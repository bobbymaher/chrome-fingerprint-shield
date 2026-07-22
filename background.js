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

    // Rule 1: Default Header Override for ALL requests (including main_frame address bar navigation)
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
        resourceTypes: [
          'main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
          'font', 'object', 'xmlhttprequest', 'ping', 'csp_report',
          'media', 'websocket', 'other'
        ]
      }
    });

    // Rule 4: Clean URLs (URL Tracking Parameter Stripper)
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
    console.error('[Fingerprint Shield] Dynamic rules update error:', err);
  }
}

// Background Tab Probe Stats Tracker
let tabProbeStats = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return;

  if (message.type === 'SYNC_STATE') {
    chrome.storage.local.get(['profiles', 'activeProfile', 'isEnabled', 'autoMode'], (data) => {
      const profiles = data.profiles || globalThis.DEFAULT_PROFILES;
      const activeId = data.activeProfile || 'cheap_win10_edge';
      const profile = profiles[activeId];
      updateDynamicRules(profile, data.isEnabled, data.autoMode, profiles);
      sendResponse({ status: 'OK' });
    });
    return true;
  }

  if (message.type === '__PROBE_STATS_UPDATE__') {
    const tabId = sender && sender.tab ? sender.tab.id : null;
    if (tabId && message.stats) {
      tabProbeStats[tabId] = message.stats;
      chrome.action.setBadgeText({ tabId, text: String(message.stats.total || 0) });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#38bdf8' });
    }
    return;
  }

  if (message.type === '__GET_TAB_PROBE_STATS__') {
    const tabId = message.tabId;
    const stats = tabProbeStats[tabId] || {
      userAgent: 0, userAgentData: 0, fonts: 0, canvas: 0, webgl: 0,
      hardware: 0, battery: 0, timezone: 0, speech: 0, topics: 0,
      domrect: 0, svgrect: 0, webrtc: 0, peripherals: 0, storage: 0,
      beacons: 0, plugins: 0, total: 0
    };
    sendResponse({ stats });
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabProbeStats[tabId];
});

// Initialization
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['profiles', 'activeProfile', 'isEnabled', 'autoMode'], (data) => {
    if (!data.profiles) {
      chrome.storage.local.set({
        profiles: globalThis.DEFAULT_PROFILES,
        activeProfile: 'cheap_win10_edge',
        isEnabled: true,
        autoMode: 'PER_SITE_3RD_RANDOM'
      }, () => {
        updateDynamicRules(globalThis.DEFAULT_PROFILES['cheap_win10_edge'], true, 'PER_SITE_3RD_RANDOM', globalThis.DEFAULT_PROFILES);
      });
    } else {
      const activeId = data.activeProfile || 'cheap_win10_edge';
      const profile = data.profiles[activeId];
      updateDynamicRules(profile, data.isEnabled !== undefined ? data.isEnabled : true, data.autoMode || 'PER_SITE_3RD_RANDOM', data.profiles);
    }
  });
});
