(function () {
  'use strict';

  // Deterministic per-domain profile rotation. "off" keeps today's sticky
  // behavior (one profile per domain forever, cached in domainProfileMap -
  // needed so login sessions that bind to UA/fingerprint don't break mid-
  // session). Faster intervals trade session stability for a moving
  // fingerprint: "daily"/"hourly" are usually fine, "minute"/"second" WILL
  // break sites that validate session continuity against UA/TLS-adjacent
  // signals (expect surprise logouts, broken WebSockets, CAPTCHAs).
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
    if (granularity === 'minute') return `${y}-${mo}-${d}-${h}-${mi}`;
    if (granularity === 'second') return `${y}-${mo}-${d}-${h}-${mi}-${s}`;
    return `${y}-${mo}-${d}`; // daily
  }

  function pickProfileForSeed(seedStr, profileKeys) {
    const rand = mulberry32(hashString(seedStr))();
    return profileKeys[Math.floor(rand * profileKeys.length)];
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

  chrome.storage.local.get(['activeProfile', 'profiles', 'isEnabled', 'autoMode', 'domainProfileMap', 'shieldWorkers', 'verboseLogging', 'primaryRotation'], function (data) {
    if (data.isEnabled === false) return;

    const profiles = data.profiles || {};
    const autoMode = data.autoMode || 'PER_SITE_3RD_RANDOM';
    const primaryRotation = data.primaryRotation || 'off';
    const profileKeys = Object.keys(profiles).sort();

    if (profileKeys.length === 0) return;

    let selectedId = data.activeProfile || 'cheap_win10_edge';

    if (autoMode === 'PER_SITE' || autoMode === 'PER_SITE_3RD_RANDOM') {
      const hostname = window.location.hostname;

      if (primaryRotation !== 'off' && hostname) {
        // Recomputed fresh every load, not cached: deterministic given
        // (hostname, current time bucket), so it naturally stays the same
        // within a bucket and changes once the bucket rolls over.
        selectedId = pickProfileForSeed(`${hostname}|${getTimeBucket(primaryRotation)}`, profileKeys);
      } else {
        const domainMap = data.domainProfileMap || {};
        if (domainMap[hostname] && profiles[domainMap[hostname]]) {
          selectedId = domainMap[hostname];
        } else if (hostname) {
          selectedId = pickProfileForSeed(`${hostname}|sticky`, profileKeys);
          domainMap[hostname] = selectedId;
          chrome.storage.local.set({ domainProfileMap: domainMap });
        }
      }
    } else if (autoMode === 'PER_NAVIGATION') {
      const randIndex = Math.floor(Math.random() * profileKeys.length);
      selectedId = profileKeys[randIndex];
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
