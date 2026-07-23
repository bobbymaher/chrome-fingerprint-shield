importScripts('profiles.js');

// content_isolated.js/content_inject.js are registered dynamically (not via
// manifest.json content_scripts) so per-site exclusion can be a true hard
// exclude - the scripts never inject at all on an excluded site, rather
// than injecting and then trying to detect/undo themselves. content_inject
// runs in the MAIN world at document_start and can't reach chrome.storage
// itself (that's the whole reason content_isolated.js exists as a bridge),
// so a soft "ask it nicely not to patch" approach can't work reliably here.
const CONTENT_SCRIPT_IDS = ['shield-isolated', 'shield-inject'];

// Built-in exclusion list for Cloudflare Turnstile, CAPTCHA, and challenge verification domains.
// Scoped to challenge subframes and verification endpoints so anti-bot challenges run un-interfered.
const BUILTIN_EXCLUDED_CHALLENGE_DOMAINS = [
  'challenges.cloudflare.com',
  'turnstile.cloudflare.com',
  'cloudflarechallenge.com',
  'hcaptcha.com',
  'recaptcha.net'
];

async function registerShieldScripts(excludedDomains) {
  try {
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: CONTENT_SCRIPT_IDS });
    if (existing.length > 0) {
      await chrome.scripting.unregisterContentScripts({ ids: CONTENT_SCRIPT_IDS });
    }
  } catch (e) {}

  const allExcluded = Array.from(new Set([...(excludedDomains || []), ...BUILTIN_EXCLUDED_CHALLENGE_DOMAINS]));
  const excludeMatches = [];
  allExcluded.forEach((host) => {
    if (!host) return;
    excludeMatches.push(`*://${host}/*`);
    excludeMatches.push(`*://*.${host}/*`);
  });

  try {
    await chrome.scripting.registerContentScripts([
      {
        id: 'shield-isolated',
        matches: ['<all_urls>'],
        excludeMatches: excludeMatches.length ? excludeMatches : undefined,
        js: ['content_isolated.js'],
        runAt: 'document_start',
        world: 'ISOLATED',
        allFrames: true,
        matchOriginAsFallback: true
      },
      {
        id: 'shield-inject',
        matches: ['<all_urls>'],
        excludeMatches: excludeMatches.length ? excludeMatches : undefined,
        js: ['content_inject.js'],
        runAt: 'document_start',
        world: 'MAIN',
        allFrames: true,
        matchOriginAsFallback: true
      }
    ]);
  } catch (e) {
    console.error('[Fingerprint Shield] Failed to register content scripts:', e);
  }
}

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

// Deterministic rotation, not Math.random(). Headers are one global
// declarativeNetRequest rule each (DNR can't vary a header value per
// matched domain dynamically, only by static URL filter) so unlike the
// in-page JS layer this can't be scoped per-visited-site - "primary"
// picks one identity for ALL first-party requests, "third-party" one for
// ALL third-party requests, each reseeded on the configured schedule
// instead of on every settings save.
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

// The service worker's own navigator.userAgent is real/unspoofed - our
// header-rewrite rules only apply to page requests, not the extension's own
// context - so this reads the actual Chromium major version currently
// running, used to keep every emulated Chrome/Edge/Opera build current.
function detectChromeVersion() {
  try {
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    if (match) return parseInt(match[1], 10);
  } catch (e) {}
  return 150;
}

function getTimeBucket(granularity) {
  const now = new Date();
  const y = now.getUTCFullYear(), mo = now.getUTCMonth(), d = now.getUTCDate();
  const h = now.getUTCHours(), mi = now.getUTCMinutes(), s = now.getUTCSeconds();
  if (granularity === 'hourly') return `${y}-${mo}-${d}-${h}`;
  if (granularity === 'insane') return `${y}-${mo}-${d}-${h}-${mi}-${s}`;
  return `${y}-${mo}-${d}`; // daily
}

// "sticky" uses a fixed seed (never rotates on its own - the pick only
// changes if the profile pool itself changes, e.g. a new smart profile
// added), anything else reseeds from the current time bucket.
function pickProfileForRotation(profiles, rotation, seedPrefix) {
  const keys = Object.keys(profiles || {}).sort();
  if (keys.length === 0) return buildAllProfiles(detectChromeVersion())['cheap_win10_edge'];
  const seed = rotation === 'sticky' ? `${seedPrefix}|sticky` : `${seedPrefix}|${getTimeBucket(rotation)}`;
  const pick = Math.floor(mulberry32(hashString(seed))() * keys.length);
  return profiles[keys[pick]];
}

async function updateDynamicRules(manualProfile, isEnabled, primaryRotation, thirdPartyRotation, profiles, excludedDomains) {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map(r => r.id);

    if (!isEnabled || !manualProfile) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
      return;
    }

    const allExcludedDomains = Array.from(new Set([...(excludedDomains || []), ...BUILTIN_EXCLUDED_CHALLENGE_DOMAINS]));

    const profile = primaryRotation === 'sticky' || !primaryRotation
      ? manualProfile
      : pickProfileForRotation(profiles, primaryRotation, 'primary');

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

    // Rule 1: Default Header Override for ALL requests except excluded domains
    const firstPartyCondition = {
      urlFilter: '*',
      resourceTypes: [
        'main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
        'font', 'object', 'xmlhttprequest', 'ping', 'csp_report',
        'media', 'websocket', 'other'
      ]
    };
    if (allExcludedDomains.length > 0) {
      firstPartyCondition.excludedDomains = allExcludedDomains;
      firstPartyCondition.excludedRequestDomains = allExcludedDomains;
      firstPartyCondition.excludedInitiatorDomains = allExcludedDomains;
    }

    const addRules = [
      {
        id: RULE_ID_FIRST_PARTY,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: firstPartyHeaders
        },
        condition: firstPartyCondition
      }
    ];

    // Third-party header identity, independent of the primary one.
    const thirdPartyProfile = pickProfileForRotation(profiles, thirdPartyRotation || 'daily', 'thirdparty');
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

    const thirdPartyCondition = {
      urlFilter: '*',
      domainType: 'thirdParty',
      resourceTypes: [
        'main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
        'font', 'object', 'xmlhttprequest', 'ping', 'csp_report',
        'media', 'websocket', 'other'
      ]
    };
    if (allExcludedDomains.length > 0) {
      thirdPartyCondition.excludedDomains = allExcludedDomains;
      thirdPartyCondition.excludedRequestDomains = allExcludedDomains;
      thirdPartyCondition.excludedInitiatorDomains = allExcludedDomains;
    }

    addRules.push({
      id: RULE_ID_THIRD_PARTY,
      priority: 2,
      action: {
        type: 'modifyHeaders',
        requestHeaders: thirdPartyHeaders
      },
      condition: thirdPartyCondition
    });

    // Rule 3: Third-Party Referer Trimming (Origin Only)
    const refererCondition = {
      urlFilter: '*',
      domainType: 'thirdParty',
      resourceTypes: [
        'main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
        'font', 'object', 'xmlhttprequest', 'ping', 'csp_report',
        'media', 'websocket', 'other'
      ]
    };
    if (allExcludedDomains.length > 0) {
      refererCondition.excludedDomains = allExcludedDomains;
      refererCondition.excludedRequestDomains = allExcludedDomains;
      refererCondition.excludedInitiatorDomains = allExcludedDomains;
    }

    addRules.push({
      id: RULE_ID_REFERER_TRIM,
      priority: 3,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          { header: 'Referer', operation: 'remove' }
        ]
      },
      condition: refererCondition
    });

    // Rule 4: Clean URLs (URL Tracking Parameter Stripper)
    const cleanUrlCondition = {
      urlFilter: '*',
      resourceTypes: ['main_frame', 'sub_frame']
    };
    if (allExcludedDomains.length > 0) {
      cleanUrlCondition.excludedDomains = allExcludedDomains;
      cleanUrlCondition.excludedRequestDomains = allExcludedDomains;
      cleanUrlCondition.excludedInitiatorDomains = allExcludedDomains;
    }

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
      condition: cleanUrlCondition
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
    chrome.storage.local.get(['profiles', 'activeProfile', 'isEnabled', 'primaryRotation', 'thirdPartyRotation', 'excludedDomains'], (data) => {
      const profiles = data.profiles || buildAllProfiles(detectChromeVersion());
      const activeId = data.activeProfile || 'cheap_win10_edge';
      const profile = profiles[activeId];
      updateDynamicRules(profile, data.isEnabled, data.primaryRotation, data.thirdPartyRotation, profiles, data.excludedDomains || []);
      sendResponse({ status: 'OK' });
    });
    return true;
  }

  if (message.type === 'SYNC_EXCLUDED_SITES') {
    chrome.storage.local.get(['excludedDomains', 'profiles', 'activeProfile', 'isEnabled', 'primaryRotation', 'thirdPartyRotation'], (data) => {
      const excludedDomains = data.excludedDomains || [];
      registerShieldScripts(excludedDomains).then(() => {
        const profiles = data.profiles || buildAllProfiles(detectChromeVersion());
        const activeId = data.activeProfile || 'cheap_win10_edge';
        const profile = profiles[activeId];
        updateDynamicRules(profile, data.isEnabled, data.primaryRotation, data.thirdPartyRotation, profiles, excludedDomains);
        sendResponse({ status: 'OK' });
      });
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
// Built-in profiles (curated + smart-generated, anything with an id
// buildAllProfiles() produces) are refreshed on every install/update AND
// every browser startup, so both code changes (new/changed built-ins) and
// real Chromium version drift (the browser auto-updated since the last
// extension update) reach users who already have a populated storage from
// before. Custom profiles the user authored are left untouched.
function refreshBuiltInProfiles() {
  chrome.storage.local.get(['profiles', 'activeProfile', 'isEnabled', 'primaryRotation', 'thirdPartyRotation', 'excludedDomains'], (data) => {
    const builtIns = buildAllProfiles(detectChromeVersion());
    const mergedProfiles = Object.assign({}, data.profiles || {}, builtIns);
    const activeId = data.activeProfile || 'cheap_win10_edge';
    const isEnabled = data.isEnabled !== undefined ? data.isEnabled : true;
    const primaryRotation = data.primaryRotation || 'sticky';
    const thirdPartyRotation = data.thirdPartyRotation || 'daily';

    chrome.storage.local.set({
      profiles: mergedProfiles,
      activeProfile: activeId,
      isEnabled: isEnabled,
      primaryRotation: primaryRotation,
      thirdPartyRotation: thirdPartyRotation
    }, () => {
      updateDynamicRules(mergedProfiles[activeId] || mergedProfiles['cheap_win10_edge'], isEnabled, primaryRotation, thirdPartyRotation, mergedProfiles, data.excludedDomains || []);
    });

    registerShieldScripts(data.excludedDomains || []);
  });
}

chrome.runtime.onInstalled.addListener(refreshBuiltInProfiles);
chrome.runtime.onStartup.addListener(refreshBuiltInProfiles);
