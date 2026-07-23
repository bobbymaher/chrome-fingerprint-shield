(function () {
  'use strict';

  // Deterministic profile rotation, applied independently to the top-level
  // site (primaryRotation) and to every embedded third-party frame
  // (thirdPartyRotation, keyed to that frame's OWN hostname - so distinct
  // trackers/CDNs get distinct, self-consistent identities instead of one
  // shared blob). "sticky" keeps a profile forever once assigned (cached in
  // domainProfileMap) - needed so login sessions that bind to UA/
  // fingerprint don't break mid-session. Faster intervals trade session
  // stability for a moving fingerprint: "daily"/"hourly" are usually fine,
  // "insane" (reseeds every second - in practice a fresh pick on nearly
  // every navigation too) WILL break sites that validate session
  // continuity (expect surprise logouts, broken WebSockets, CAPTCHAs).
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function getTimeBucket(granularity) {
    const now = new Date();
    const y = now.getUTCFullYear(), mo = now.getUTCMonth(), d = now.getUTCDate();
    const h = now.getUTCHours(), mi = now.getUTCMinutes(), s = now.getUTCSeconds();
    if (granularity === 'hourly') return `${y}-${mo}-${d}-${h}`;
    if (granularity === 'insane') return `${y}-${mo}-${d}-${h}-${mi}-${s}`;
    return `${y}-${mo}-${d}`; // daily
  }

  function pickProfileForSeed(seedStr, profileKeys) {
    const rand = mulberry32(hashString(seedStr))();
    return profileKeys[Math.floor(rand * profileKeys.length)];
  }

  // Resolves which profile applies for one hostname under one rotation
  // setting - shared logic for both the top frame and third-party frames,
  // just called with a different hostname/setting/cache-key per frame kind.
  function resolveProfileForHost(hostname, rotation, profileKeys, domainMap, cacheKey) {
    if (!hostname) return null;
    if (rotation === 'sticky') {
      if (domainMap[cacheKey] && profileKeys.includes(domainMap[cacheKey])) {
        return { id: domainMap[cacheKey], domainMapChanged: false };
      }
      const id = pickProfileForSeed(`${hostname}|sticky`, profileKeys);
      domainMap[cacheKey] = id;
      return { id, domainMapChanged: true };
    }
    return { id: pickProfileForSeed(`${hostname}|${getTimeBucket(rotation)}`, profileKeys), domainMapChanged: false };
  }

  // Listen for probe event emitted from MAIN world
  window.addEventListener('__FINGERPRINT_PROBE_EVENT__', function (e) {
    if (e && e.detail) {
      try {
        const stats = typeof e.detail === 'string' ? JSON.parse(e.detail) : e.detail;
        chrome.runtime.sendMessage({
          type: '__PROBE_STATS_UPDATE__',
          stats: stats
        });
      } catch (err) {}
    }
  });

  chrome.storage.local.get(['activeProfile', 'profiles', 'isEnabled', 'domainProfileMap', 'shieldWorkers', 'verboseLogging', 'primaryRotation', 'thirdPartyRotation'], function (data) {
    if (data.isEnabled === false) return;

    const profiles = data.profiles || {};
    const primaryRotation = data.primaryRotation || 'sticky';
    const thirdPartyRotation = data.thirdPartyRotation || 'daily';
    const profileKeys = Object.keys(profiles).sort();

    if (profileKeys.length === 0) return;

    let selectedId = data.activeProfile || 'cheap_win10_edge';

    let isTopFrame = true;
    try { isTopFrame = window.self === window.top; } catch (e) { isTopFrame = false; }

    const hostname = window.location.hostname;
    const rotation = isTopFrame ? primaryRotation : thirdPartyRotation;
    const cacheKey = (isTopFrame ? 'primary:' : 'thirdparty:') + hostname;
    const domainMap = data.domainProfileMap || {};

    const resolved = resolveProfileForHost(hostname, rotation, profileKeys, domainMap, cacheKey);
    if (resolved) {
      selectedId = resolved.id;
      if (resolved.domainMapChanged) {
        chrome.storage.local.set({ domainProfileMap: domainMap });
      }
    }

    const profile = profiles[selectedId] || profiles['cheap_win10_edge'];
    if (!profile) return;

    const payload = Object.assign({}, profile, {
      shieldWorkers: data.shieldWorkers !== false,
      verboseLogging: data.verboseLogging !== false
    });

    // CSP-SAFE PROFILE TRANSMISSION: Use DOM CustomEvent with stringified detail
    try {
      window.dispatchEvent(new CustomEvent('__APPLY_SPOOF_PROFILE__', {
        detail: JSON.stringify(payload)
      }));
    } catch (e) {}
  });
})();
