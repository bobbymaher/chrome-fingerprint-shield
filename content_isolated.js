(function () {
  'use strict';

  // Listen for probe event emitted from MAIN world
  window.addEventListener('__FINGERPRINT_PROBE_EVENT__', function (e) {
    if (e && e.detail) {
      try {
        const stats = typeof e.detail === 'string' ? JSON.parse(e.detail) : e.detail;
        chrome.runtime.sendMessage({
          type: 'UPDATE_PROBE_STATS',
          stats: stats
        });
      } catch (err) {}
    }
  });

  chrome.storage.local.get(['activeProfile', 'profiles', 'isEnabled', 'autoMode', 'domainProfileMap'], function (data) {
    if (data.isEnabled === false) return;

    const profiles = data.profiles || {};
    const autoMode = data.autoMode || 'PER_SITE_3RD_RANDOM';
    const profileKeys = Object.keys(profiles);

    if (profileKeys.length === 0) return;

    let selectedId = data.activeProfile || 'cheap_win10_edge';

    if (autoMode === 'PER_SITE' || autoMode === 'PER_SITE_3RD_RANDOM') {
      const hostname = window.location.hostname;
      const domainMap = data.domainProfileMap || {};

      if (domainMap[hostname] && profiles[domainMap[hostname]]) {
        selectedId = domainMap[hostname];
      } else if (hostname) {
        const randIndex = Math.floor(Math.random() * profileKeys.length);
        selectedId = profileKeys[randIndex];
        domainMap[hostname] = selectedId;
        chrome.storage.local.set({ domainProfileMap: domainMap });
      }
    } else if (autoMode === 'PER_NAVIGATION') {
      const randIndex = Math.floor(Math.random() * profileKeys.length);
      selectedId = profileKeys[randIndex];
    }

    const profile = profiles[selectedId] || profiles['cheap_win10_edge'];
    if (!profile) return;

    // CSP-SAFE PROFILE TRANSMISSION: Use DOM CustomEvent with stringified detail (No inline <script> tag created!)
    try {
      window.dispatchEvent(new CustomEvent('__APPLY_SPOOF_PROFILE__', {
        detail: JSON.stringify(profile)
      }));
    } catch (e) {}
  });
})();
