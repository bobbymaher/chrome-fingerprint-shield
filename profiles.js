// Profile definitions for Header & Fingerprint Shield extension (Chromium 150 Latest)
const DEFAULT_PROFILES = {
  "cheap_win10_edge": {
    id: "cheap_win10_edge",
    name: "Cheap Windows 10 (Edge 150)",
    description: "Low-spec quad-core Windows 10 PC running Microsoft Edge 150",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0",
    platform: "Win32",
    platformName: "Windows",
    platformVersion: "10.0.0",
    architecture: "x86",
    bitness: "64",
    model: "",
    vendor: "Google Inc.",
    oscpu: "Windows NT 10.0; Win64; x64",
    brands: [
      { brand: "Not:A-Brand", version: "24" },
      { brand: "Chromium", version: "150" },
      { brand: "Microsoft Edge", version: "150" }
    ],
    fullVersionList: [
      { brand: "Not:A-Brand", version: "24.0.0.0" },
      { brand: "Chromium", version: "150.0.7100.25" },
      { brand: "Microsoft Edge", version: "150.0.3200.12" }
    ],
    hardwareConcurrency: 4,
    deviceMemory: 4,
    maxTouchPoints: 0,
    webglVendor: "Google Inc. (Intel)",
    webglRenderer: "ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8681)",
    maskBrave: true,
    spoofScreen: false,
    blockBeacons: true,
    blockSameOriginBeacons: true,
    spoofWebglAdvanced: true,
    custom: false
  },
  "win11_edge_i7": {
    id: "win11_edge_i7",
    name: "Windows 11 i7 (Edge 150)",
    description: "High-spec Windows 11 PC running Microsoft Edge 150",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0",
    platform: "Win32",
    platformName: "Windows",
    platformVersion: "15.0.0",
    architecture: "x86",
    bitness: "64",
    model: "",
    vendor: "Google Inc.",
    oscpu: "Windows NT 10.0; Win64; x64",
    brands: [
      { brand: "Not:A-Brand", version: "24" },
      { brand: "Chromium", version: "150" },
      { brand: "Microsoft Edge", version: "150" }
    ],
    fullVersionList: [
      { brand: "Not:A-Brand", version: "24.0.0.0" },
      { brand: "Chromium", version: "150.0.7100.25" },
      { brand: "Microsoft Edge", version: "150.0.3200.12" }
    ],
    hardwareConcurrency: 8,
    deviceMemory: 16,
    maxTouchPoints: 0,
    webglVendor: "Google Inc. (NVIDIA)",
    webglRenderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    maskBrave: true,
    spoofScreen: false,
    blockBeacons: true,
    blockSameOriginBeacons: true,
    spoofWebglAdvanced: true,
    custom: false
  },
  "cheap_win10_chrome": {
    id: "cheap_win10_chrome",
    name: "Cheap Windows 10 (Chrome 150)",
    description: "Budget Windows 10 PC running Google Chrome 150",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    platform: "Win32",
    platformName: "Windows",
    platformVersion: "10.0.0",
    architecture: "x86",
    bitness: "64",
    model: "",
    vendor: "Google Inc.",
    oscpu: "Windows NT 10.0; Win64; x64",
    brands: [
      { brand: "Not:A-Brand", version: "24" },
      { brand: "Chromium", version: "150" },
      { brand: "Google Chrome", version: "150" }
    ],
    fullVersionList: [
      { brand: "Not:A-Brand", version: "24.0.0.0" },
      { brand: "Chromium", version: "150.0.7100.25" },
      { brand: "Google Chrome", version: "150.0.7100.25" }
    ],
    hardwareConcurrency: 4,
    deviceMemory: 4,
    maxTouchPoints: 0,
    webglVendor: "Google Inc. (Intel)",
    webglRenderer: "ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    maskBrave: false,
    spoofScreen: false,
    blockBeacons: true,
    blockSameOriginBeacons: true,
    spoofWebglAdvanced: true,
    custom: false
  },
  "ubuntu_linux_chrome": {
    id: "ubuntu_linux_chrome",
    name: "Ubuntu Linux (Chrome 150)",
    description: "Desktop Ubuntu Linux system running Google Chrome 150",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    platform: "Linux x86_64",
    platformName: "Linux",
    platformVersion: "6.5.0",
    architecture: "x86",
    bitness: "64",
    model: "",
    vendor: "Google Inc.",
    oscpu: "Linux x86_64",
    brands: [
      { brand: "Not:A-Brand", version: "24" },
      { brand: "Chromium", version: "150" },
      { brand: "Google Chrome", version: "150" }
    ],
    fullVersionList: [
      { brand: "Not:A-Brand", version: "24.0.0.0" },
      { brand: "Chromium", version: "150.0.7100.25" },
      { brand: "Google Chrome", version: "150.0.7100.25" }
    ],
    hardwareConcurrency: 8,
    deviceMemory: 8,
    maxTouchPoints: 0,
    webglVendor: "Mesa",
    webglRenderer: "Mesa Intel(R) UHD Graphics 620 (KBL GT2)",
    maskBrave: false,
    spoofScreen: false,
    blockBeacons: true,
    blockSameOriginBeacons: true,
    spoofWebglAdvanced: false,
    custom: false
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_PROFILES };
}
