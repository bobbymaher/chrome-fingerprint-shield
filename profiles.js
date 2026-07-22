// Profile definitions for Header & Fingerprint Shield extension.
// Every UA/brand/version string is built at runtime from the REAL Chromium
// major version currently running (see background.js, which reads it from
// the service worker's own unspoofed navigator.userAgent) rather than a
// hardcoded literal - so the emulated Chrome/Edge/Opera build always tracks
// whatever version of the browser is actually installed.

const OS_SPECS = {
  win10: {
    uaFragment: "Windows NT 10.0; Win64; x64",
    platform: "Win32",
    platformName: "Windows",
    platformVersion: "10.0.0",
    architecture: "x86",
    bitness: "64"
  },
  win11: {
    // Windows 11 still reports "Windows NT 10.0" in the raw UA string -
    // Microsoft never bumped the NT kernel version for compat reasons. Only
    // Sec-CH-UA-Platform-Version differs (Win11 maps to 13+).
    uaFragment: "Windows NT 10.0; Win64; x64",
    platform: "Win32",
    platformName: "Windows",
    platformVersion: "15.0.0",
    architecture: "x86",
    bitness: "64"
  },
  macos: {
    // Chrome freezes the macOS UA token at 10_15_7 regardless of the real
    // OS version (has for years, across all real macOS releases) - the
    // actual OS version only shows up in Sec-CH-UA-Platform-Version.
    uaFragment: "Macintosh; Intel Mac OS X 10_15_7",
    platform: "MacIntel",
    platformName: "macOS",
    platformVersion: "12.7.6",
    architecture: "x86",
    bitness: "64"
  },
  linux: {
    uaFragment: "X11; Linux x86_64",
    platform: "Linux x86_64",
    platformName: "Linux",
    platformVersion: "6.5.0",
    architecture: "x86",
    bitness: "64"
  }
};

const BROWSER_SKINS = {
  chrome: {
    brandName: "Google Chrome",
    vendor: "Google Inc.",
    suffix: () => "",
    brandVersion: (v) => `${v}`,
    fullVersion: (v) => `${v}.0.7100.25`
  },
  edge: {
    brandName: "Microsoft Edge",
    vendor: "Google Inc.",
    suffix: (v) => ` Edg/${v}.0.0.0`,
    brandVersion: (v) => `${v}`,
    fullVersion: (v) => `${v}.0.3200.12`
  },
  opera: {
    // Opera's own version number trails the Chromium version it's built on
    // by roughly 13 (e.g. Opera 106 ships on Chromium 119) - approximate,
    // not exact, but keeps the pairing plausible rather than nonsensical.
    brandName: "Opera",
    vendor: "Google Inc.",
    suffix: (v) => ` OPR/${Math.max(1, v - 13)}.0.0.0`,
    brandVersion: (v) => `${Math.max(1, v - 13)}`,
    fullVersion: (v) => `${Math.max(1, v - 13)}.0.5000.0`
  }
};

const GPU_POOL = {
  win10: [
    { webglVendor: "Google Inc. (Intel)", webglRenderer: "ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8681)" },
    { webglVendor: "Google Inc. (Intel)", webglRenderer: "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8681)" },
    { webglVendor: "Google Inc. (Intel)", webglRenderer: "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11-31.0.101.5333)" },
    { webglVendor: "Google Inc. (NVIDIA)", webglRenderer: "ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)" },
    { webglVendor: "Google Inc. (AMD)", webglRenderer: "ANGLE (AMD, AMD Radeon RX 570 Series Direct3D11 vs_5_0 ps_5_0, D3D11)" }
  ],
  win11: [
    { webglVendor: "Google Inc. (Intel)", webglRenderer: "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11-31.0.101.5333)" },
    { webglVendor: "Google Inc. (NVIDIA)", webglRenderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)" },
    { webglVendor: "Google Inc. (NVIDIA)", webglRenderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)" },
    { webglVendor: "Google Inc. (NVIDIA)", webglRenderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)" },
    { webglVendor: "Google Inc. (AMD)", webglRenderer: "ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)" }
  ],
  macos: [
    { webglVendor: "Google Inc. (Intel)", webglRenderer: "ANGLE (Apple, ANGLE Metal Renderer: Intel(R) Iris(TM) Graphics 6100, Unspecified Version)" },
    { webglVendor: "Google Inc. (Apple)", webglRenderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)" },
    { webglVendor: "Google Inc. (Apple)", webglRenderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)" },
    { webglVendor: "Google Inc. (Apple)", webglRenderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version)" }
  ],
  linux: [
    { webglVendor: "Mesa", webglRenderer: "Mesa Intel(R) UHD Graphics 620 (KBL GT2)" },
    { webglVendor: "Mesa", webglRenderer: "Mesa Intel(R) Iris(R) Xe Graphics (TGL GT2)" },
    { webglVendor: "Mesa", webglRenderer: "AMD Radeon RX 6600 (navi23, LLVM 15.0.7, DRM 3.49, 6.2.0)" }
  ]
};

const HW_POOL = [
  { hardwareConcurrency: 4, deviceMemory: 4 },
  { hardwareConcurrency: 4, deviceMemory: 8 },
  { hardwareConcurrency: 6, deviceMemory: 8 },
  { hardwareConcurrency: 8, deviceMemory: 16 },
  { hardwareConcurrency: 12, deviceMemory: 16 },
  { hardwareConcurrency: 16, deviceMemory: 32 }
];

function buildProfile(spec, chromeVersion) {
  const os = OS_SPECS[spec.osKey];
  const skin = BROWSER_SKINS[spec.browserKey];
  const v = chromeVersion || 150;

  const userAgent = `Mozilla/5.0 (${os.uaFragment}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36${skin.suffix(v)}`;

  const brands = [
    { brand: "Not:A-Brand", version: "24" },
    { brand: "Chromium", version: `${v}` },
    { brand: skin.brandName, version: skin.brandVersion(v) }
  ];
  const fullVersionList = [
    { brand: "Not:A-Brand", version: "24.0.0.0" },
    { brand: "Chromium", version: `${v}.0.7100.25` },
    { brand: skin.brandName, version: skin.fullVersion(v) }
  ];

  return {
    id: spec.id,
    name: `${spec.name} (${skin.brandName} ${v})`,
    description: spec.description,
    userAgent,
    platform: os.platform,
    platformName: os.platformName,
    platformVersion: os.platformVersion,
    architecture: os.architecture,
    bitness: os.bitness,
    model: "",
    vendor: skin.vendor,
    brands,
    fullVersionList,
    hardwareConcurrency: spec.hw.hardwareConcurrency,
    deviceMemory: spec.hw.deviceMemory,
    maxTouchPoints: 0,
    webglVendor: spec.gpu.webglVendor,
    webglRenderer: spec.gpu.webglRenderer,
    maskBrave: spec.osKey !== "linux",
    spoofScreen: false,
    blockBeacons: true,
    blockSameOriginBeacons: true,
    spoofWebglAdvanced: spec.osKey !== "linux",
    custom: false
  };
}

// The 5 hand-curated profiles, now built dynamically so their Chrome/Edge
// version always matches the real running browser.
function buildCuratedProfiles(chromeVersion) {
  return {
    cheap_win10_edge: buildProfile({
      id: "cheap_win10_edge", osKey: "win10", browserKey: "edge",
      name: "Cheap Windows 10", description: "Low-spec quad-core Windows 10 PC running Microsoft Edge",
      gpu: GPU_POOL.win10[0], hw: HW_POOL[1]
    }, chromeVersion),
    win11_edge_i7: buildProfile({
      id: "win11_edge_i7", osKey: "win11", browserKey: "edge",
      name: "Windows 11 i7", description: "High-spec Windows 11 PC running Microsoft Edge",
      gpu: GPU_POOL.win11[1], hw: HW_POOL[3]
    }, chromeVersion),
    cheap_win10_chrome: buildProfile({
      id: "cheap_win10_chrome", osKey: "win10", browserKey: "chrome",
      name: "Cheap Windows 10", description: "Budget Windows 10 PC running Google Chrome",
      gpu: GPU_POOL.win10[1], hw: HW_POOL[1]
    }, chromeVersion),
    ubuntu_linux_chrome: buildProfile({
      id: "ubuntu_linux_chrome", osKey: "linux", browserKey: "chrome",
      name: "Ubuntu Linux", description: "Desktop Ubuntu Linux system running Google Chrome",
      gpu: GPU_POOL.linux[0], hw: HW_POOL[3]
    }, chromeVersion),
    old_macbook_pro_intel: (() => {
      const p = buildProfile({
        id: "old_macbook_pro_intel", osKey: "macos", browserKey: "chrome",
        name: "MacBook Pro 13\" 2015", description: "Old Intel MacBook Pro (13-inch, Early 2015), Iris 6100, 8GB RAM. Only use this on a real Mac - font/OS consistency can't be spoofed, so this profile is only self-consistent when it matches the machine it's running on.",
        gpu: GPU_POOL.macos[0], hw: HW_POOL[1]
      }, chromeVersion);
      return p;
    })()
  };
}

// Smart/generative pool: every OS x browser-skin x GPU x hardware
// combination from the pools above, deterministically enumerated (not
// randomly sampled, so profile IDs are stable across reinstalls). Gives a
// much larger anonymity set than a handful of hand-authored profiles - a
// tracker correlating a user across sites via other stable signals would
// otherwise notice the same small closed set of fake identities cycling,
// which is itself a distinctive "uses this extension" signature.
function buildSmartProfiles(chromeVersion) {
  const combos = [];
  const osKeys = ["win10", "win11", "macos", "linux"];
  const browserKeysByOs = {
    win10: ["chrome", "edge", "opera"],
    win11: ["chrome", "edge", "opera"],
    macos: ["chrome", "opera"],
    linux: ["chrome", "opera"]
  };

  osKeys.forEach((osKey) => {
    const gpus = GPU_POOL[osKey];
    browserKeysByOs[osKey].forEach((browserKey) => {
      gpus.forEach((gpu, gpuIdx) => {
        const hw = HW_POOL[(gpuIdx * 2) % HW_POOL.length];
        combos.push({ osKey, browserKey, gpu, hw });
      });
    });
  });

  const profiles = {};
  combos.forEach((combo, i) => {
    const id = `smart_${i}`;
    profiles[id] = buildProfile({
      id,
      osKey: combo.osKey,
      browserKey: combo.browserKey,
      name: "Smart",
      description: `Generated profile #${i}: ${combo.osKey} / ${combo.browserKey} / ${combo.gpu.webglRenderer}`,
      gpu: combo.gpu,
      hw: combo.hw
    }, chromeVersion);
    profiles[id].smart = true;
  });
  return profiles;
}

function buildAllProfiles(chromeVersion) {
  return Object.assign({}, buildCuratedProfiles(chromeVersion), buildSmartProfiles(chromeVersion));
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildAllProfiles, buildCuratedProfiles, buildSmartProfiles, OS_SPECS, BROWSER_SKINS, GPU_POOL, HW_POOL };
}
