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
    spoofWebglAdvanced: true,
    custom: false
  },
  "win11_chrome_ryzen": {
    id: "win11_chrome_ryzen",
    name: "Windows 11 Ryzen (Chrome 150)",
    description: "AMD Ryzen 7 Windows 11 PC running Google Chrome 150",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
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
      { brand: "Google Chrome", version: "150" }
    ],
    fullVersionList: [
      { brand: "Not:A-Brand", version: "24.0.0.0" },
      { brand: "Chromium", version: "150.0.7100.25" },
      { brand: "Google Chrome", version: "150.0.7100.25" }
    ],
    hardwareConcurrency: 12,
    deviceMemory: 16,
    maxTouchPoints: 0,
    webglVendor: "Google Inc. (AMD)",
    webglRenderer: "ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)",
    maskBrave: false,
    spoofScreen: false,
    blockBeacons: true,
    spoofWebglAdvanced: true,
    custom: false
  },
  "win10_opera": {
    id: "win10_opera",
    name: "Windows 10 (Opera 116 / Core 150)",
    description: "Windows 10 PC running Opera Browser",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 OPR/116.0.0.0",
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
      { brand: "Opera", version: "116" }
    ],
    fullVersionList: [
      { brand: "Not:A-Brand", version: "24.0.0.0" },
      { brand: "Chromium", version: "150.0.7100.25" },
      { brand: "Opera", version: "116.0.5360.28" }
    ],
    hardwareConcurrency: 6,
    deviceMemory: 8,
    maxTouchPoints: 0,
    webglVendor: "Google Inc. (NVIDIA)",
    webglRenderer: "ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    maskBrave: false,
    spoofScreen: false,
    blockBeacons: true,
    spoofWebglAdvanced: true,
    custom: false
  },
  "win11_vivaldi": {
    id: "win11_vivaldi",
    name: "Windows 11 (Vivaldi / Core 150)",
    description: "Windows 11 Workstation running Vivaldi Browser",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Vivaldi/7.1.3570.54",
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
      { brand: "Vivaldi", version: "7" }
    ],
    fullVersionList: [
      { brand: "Not:A-Brand", version: "24.0.0.0" },
      { brand: "Chromium", version: "150.0.7100.25" },
      { brand: "Vivaldi", version: "7.1.3570.54" }
    ],
    hardwareConcurrency: 8,
    deviceMemory: 16,
    maxTouchPoints: 0,
    webglVendor: "Google Inc. (Intel)",
    webglRenderer: "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)",
    maskBrave: false,
    spoofScreen: false,
    blockBeacons: true,
    spoofWebglAdvanced: true,
    custom: false
  },
  "win10_yandex": {
    id: "win10_yandex",
    name: "Windows 10 (Yandex / Core 150)",
    description: "Windows 10 PC running Yandex Browser",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 YaBrowser/25.1.0.0 Yowser/2.5 Safari/537.36",
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
      { brand: "Yandex", version: "25" }
    ],
    fullVersionList: [
      { brand: "Not:A-Brand", version: "24.0.0.0" },
      { brand: "Chromium", version: "150.0.7100.25" },
      { brand: "Yandex", version: "25.1.0.0" }
    ],
    hardwareConcurrency: 4,
    deviceMemory: 8,
    maxTouchPoints: 0,
    webglVendor: "Google Inc. (Intel)",
    webglRenderer: "ANGLE (Intel, Intel(R) HD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    maskBrave: false,
    spoofScreen: false,
    blockBeacons: true,
    spoofWebglAdvanced: true,
    custom: false
  },
  "linux_ubuntu_chrome": {
    id: "linux_ubuntu_chrome",
    name: "Ubuntu Linux (Chrome 150)",
    description: "Ubuntu Workstation running Google Chrome 150",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    platform: "Linux x86_64",
    platformName: "Linux",
    platformVersion: "6.8.0",
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
    deviceMemory: 16,
    maxTouchPoints: 0,
    webglVendor: "Mesa/X.org",
    webglRenderer: "Mesa Intel(R) Graphics (ADL GT2)",
    maskBrave: false,
    spoofScreen: false,
    blockBeacons: true,
    spoofWebglAdvanced: true,
    custom: false
  },
  "linux_arch_edge": {
    id: "linux_arch_edge",
    name: "Arch Linux (Edge 150)",
    description: "Arch Linux Gaming Rig running Microsoft Edge 150",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0",
    platform: "Linux x86_64",
    platformName: "Linux",
    platformVersion: "6.10.0",
    architecture: "x86",
    bitness: "64",
    model: "",
    vendor: "Google Inc.",
    oscpu: "Linux x86_64",
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
    hardwareConcurrency: 16,
    deviceMemory: 32,
    maxTouchPoints: 0,
    webglVendor: "Mesa/X.org",
    webglRenderer: "AMD Radeon RX 6700 XT (RADV NAVI22)",
    maskBrave: false,
    spoofScreen: false,
    blockBeacons: true,
    spoofWebglAdvanced: true,
    custom: false
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.DEFAULT_PROFILES = DEFAULT_PROFILES;
}
