importScripts('profiles.js');

const RULE_ID_FIRST_PARTY = 1;
const RULE_ID_THIRD_PARTY = 2;
const RULE_ID_REFERER_TRIM = 3;
const RULE_ID_REMOVE_TRACKING_PARAMS = 4;

function formatBrandsHeader(brands) {
  if (!brands || !Array.isArray(brands)) return '"Not:A-Brand";v="24", "Chromium";v="150", "Microsoft Edge";v="150"';
  return brands.map(b => `"${b.brand}";v="${b.version}"`).join(', ');
}

function formatFullVersionListHeader(fullVersions) {
  if (!fullVersions || !Array.isArray(fullVersions)) return '"Not:A-Brand";v="24.0.0.0", "Chromium";v="150.0.7100.25", "Microsoft Edge";v="150.0.3200.12"';
  return fullVersions.map(b => `"${b.brand}";v="${b.version}"`).join(', ');
}

function getRandomProfile(profiles) {
  const keys = Object.keys(profiles || {});
  if (keys.length === 0) return globalThis.DEFAULT_PROFILES['cheap_win10_edge'];
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  return profiles[randKey];
}

async function updateDynamicRules(profile, isEnabled, autoMode, profiles) {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map(r => r.id);

    if (!isEnabled || !profile) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
      return;
    }

    const firstPartyHeaders = [
      { header: 'User-Agent', operation: 'set', value: profile.userAgent },
      { header: 'Sec-Ch-Ua', operation: 'set', value: formatBrandsHeader(profile.brands) },
      { header: 'Sec-Ch-Ua-Mobile', operation: 'set', value: '?0' },
      { header: 'Sec-Ch-Ua-Platform', operation: 'set', value: `"${profile.platformName || 'Windows'}"` },
      { header: 'Sec-Ch-Ua-Platform-Version', operation: 'set', value: `"${profile.platformVersion || '10.0.0'}"` },
      { header: 'Sec-Ch-Ua-Arch', operation: 'set', value: `"${profile.architecture || 'x86'}"` },
      { header: 'Sec-Ch-Ua-Bitness', operation: 'set', value: `"${profile.bitness || '64'}"` },
      { header: 'Sec-Ch-Ua-Model', operation: 'set', value: `"${profile.model || ''}"` }
    ];

    if (profile.fullVersionList) {
      firstPartyHeaders.push({
        header: 'Sec-Ch-Ua-Full-Version-List',
        operation: 'set',
        value: formatFullVersionListHeader(profile.fullVersionList)
      });
    }

    const addRules = [
      {
        id: RULE_ID_FIRST_PARTY,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: firstPartyHeaders
        },
        condition: {
          urlFilter: '*',
          domainType: 'firstParty',
          resourceTypes: [
            'main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
            'font', 'object', 'xmlhttprequest', 'ping', 'csp_report',
            'media', 'websocket', 'other'
          ]
        }
      }
    ];

    // Strategy PER_SITE_3RD_RANDOM: Third-Party randomized headers
    if (autoMode === 'PER_SITE_3RD_RANDOM' || !autoMode) {
      const thirdPartyProfile = getRandomProfile(profiles);
      const thirdPartyHeaders = [
        { header: 'User-Agent', operation: 'set', value: thirdPartyProfile.userAgent },
        { header: 'Sec-Ch-Ua', operation: 'set', value: formatBrandsHeader(thirdPartyProfile.brands) },
        { header: 'Sec-Ch-Ua-Mobile', operation: 'set', value: '?0' },
        { header: 'Sec-Ch-Ua-Platform', operation: 'set', value: `"${thirdPartyProfile.platformName || 'Windows'}"` },
        { header: 'Sec-Ch-Ua-Platform-Version', operation: 'set', value: `"${thirdPartyProfile.platformVersion || '10.0.0'}"` },
        { header: 'Sec-Ch-Ua-Arch', operation: 'set', value: `"${thirdPartyProfile.architecture || 'x86'}"` },
        { header: 'Sec-Ch-Ua-Bitness', operation: 'set', value: `"${thirdPartyProfile.bitness || '64'}"` },
        { header: 'Sec-Ch-Ua-Model', operation: 'set', value: `"${thirdPartyProfile.model || ''}"` }
      ];

      if (thirdPartyProfile.fullVersionList) {
        thirdPartyHeaders.push({
          header: 'Sec-Ch-Ua-Full-Version-List',
          operation: 'set',
          value: formatFullVersionListHeader(thirdPartyProfile.fullVersionList)
        });
      }

      addRules.push({
        id: RULE_ID_THIRD_PARTY,
        priority: 2,
        action: {
          type: 'modifyHeaders',
          requestHeaders: thirdPartyHeaders
        },
        condition: {
          urlFilter: '*',
          domainType: 'thirdParty',
          resourceTypes: [
            'main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
            'font', 'object', 'xmlhttprequest', 'ping', 'csp_report',
            'media', 'websocket', 'other'
          ]
        }
      });
    }

    // Rule 3: Third-Party Referer Trimming (Origin Only)
    addRules.push({
      id: RULE_ID_REFERER_TRIM,
      priority: 3,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          { header: 'Referer', operation: 'remove' }
        ]
      },
      condition: {
        urlFilter: '*',
        domainType: 'thirdParty',
        resourceTypes: ['script', 'image', 'xmlhttprequest', 'ping', 'other']
      }
    });

    // Rule 4: Outbound URL Tracking Parameter Stripper (Clean URLs)
    addRules.push({
      id: RULE_ID_REMOVE_TRACKING_PARAMS,
      priority: 4,
      action: {
        type: 'redirect',
        redirect: {
          transform: {
            queryTransform: {
              removeParams: [
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                'fbclid', 'gclid', 'msclkid', 'twclid', 'igshid', 'yclid', 'mc_eid', '_ga', '_hsenc'
              ]
            }
          }
        }
      },
      condition: {
        urlFilter: '*',
        resourceTypes: ['main_frame', 'sub_frame']
      }
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules
    });
  } catch (err) {
    console.error('[Background] Failed to update dynamic DNR rules:', err);
  }
}

// In-memory probe statistics per tab
const tabProbeStats = new Map();

async function getStoredState() {
  const result = await chrome.storage.local.get([
    'activeProfile', 'enabled', 'autoMode', 'customProfiles'
  ]);
  const allProfiles = { ...globalThis.DEFAULT_PROFILES, ...(result.customProfiles || {}) };
  const profile = result.activeProfile || globalThis.DEFAULT_PROFILES['cheap_win10_edge'];
  const enabled = result.enabled !== undefined ? result.enabled : true;
  const autoMode = result.autoMode || 'PER_SITE_3RD_RANDOM';
  return { profile, enabled, autoMode, allProfiles };
}

chrome.runtime.onInstalled.addListener(async () => {
  const state = await getStoredState();
  await updateDynamicRules(state.profile, state.enabled, state.autoMode, state.allProfiles);
});

chrome.runtime.onStartup.addListener(async () => {
  const state = await getStoredState();
  await updateDynamicRules(state.profile, state.enabled, state.autoMode, state.allProfiles);
});

chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local') {
    const state = await getStoredState();
    await updateDynamicRules(state.profile, state.enabled, state.autoMode, state.allProfiles);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === '__PROBE_STATS_UPDATE__') {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId) {
      tabProbeStats.set(tabId, message.stats);
      const total = message.stats ? (message.stats.total || 0) : 0;
      if (total > 0) {
        chrome.action.setBadgeText({ tabId, text: String(total) });
        chrome.action.setBadgeBackgroundColor({ tabId, color: '#38bdf8' });
      }
    }
  } else if (message.type === '__GET_TAB_PROBE_STATS__') {
    const tabId = message.tabId;
    const stats = tabProbeStats.get(tabId) || null;
    sendResponse({ stats });
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabProbeStats.delete(tabId);
});
