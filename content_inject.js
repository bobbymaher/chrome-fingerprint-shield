(function () {
  'use strict';

  console.log('%c[Fingerprint Shield v2.10.0]%c Hardened Anti-Detection & Realm Isolation Suite initialized', 'color: #38bdf8; font-weight: bold;', 'color: #9ca3af;');

  let probeCounts = {
    userAgent: 0,
    plugins: 0,
    hardware: 0,
    userAgentData: 0,
    webgl: 0,
    canvas: 0,
    audio: 0,
    screen: 0,
    brave: 0,
    battery: 0,
    fonts: 0,
    timezone: 0,
    speech: 0,
    topics: 0,
    domrect: 0,
    beacons: 0,
    svgrect: 0,
    webrtc: 0,
    peripherals: 0,
    storage: 0,
    total: 0
  };

  const PROBE_COLOR_MAP = {
    domrect: '#a855f7',
    webgl: '#3b82f6',
    fonts: '#f59e0b',
    canvas: '#ec4899',
    audio: '#8b5cf6',
    topics: '#10b981',
    webrtc: '#ef4444',
    storage: '#06b6d4',
    userAgent: '#38bdf8',
    userAgentData: '#6366f1',
    battery: '#eab308',
    speech: '#f97316',
    svgrect: '#14b8a6',
    peripherals: '#64748b',
    beacons: '#d946ef'
  };

  let probeLogCounts = {};
  let isRecordingProbe = false;
  let probeDispatchScheduled = false;

  function recordProbe(category, detailInfo, inspectableObj) {
    if (isRecordingProbe) return;
    isRecordingProbe = true;
    try {
      if (probeCounts[category] !== undefined) {
        probeCounts[category]++;
        probeCounts.total++;

        const color = PROBE_COLOR_MAP[category] || '#38bdf8';
        const detailStr = detailInfo ? ` → ${detailInfo}` : '';
        probeLogCounts[category] = (probeLogCounts[category] || 0) + 1;

        if (activeProfile.verboseLogging !== false && (probeLogCounts[category] <= 25 || probeLogCounts[category] % 25 === 0)) {
          if (inspectableObj) {
            console.groupCollapsed(
              `%c[Shield Probe]%c %c${category.toUpperCase()}%c${detailStr} %c(Total: ${probeCounts[category]})`,
              'color: #38bdf8; font-weight: bold; background: #0f172a; padding: 2px 6px; border-radius: 4px;',
              '',
              `color: #fff; background: ${color}; font-weight: bold; padding: 2px 6px; border-radius: 4px;`,
              'color: #e2e8f0; font-weight: 500;',
              'color: #94a3b8; font-style: italic;'
            );
            console.log('Intercepted Payload Data:', inspectableObj);
            console.groupEnd();
          } else {
            console.log(
              `%c[Shield Probe]%c %c${category.toUpperCase()}%c${detailStr} %c(Total: ${probeCounts[category]})`,
              'color: #38bdf8; font-weight: bold; background: #0f172a; padding: 2px 6px; border-radius: 4px;',
              '',
              `color: #fff; background: ${color}; font-weight: bold; padding: 2px 6px; border-radius: 4px;`,
              'color: #e2e8f0; font-weight: 500;',
              'color: #94a3b8; font-style: italic;'
            );
          }
        }

        if (!probeDispatchScheduled) {
          probeDispatchScheduled = true;
          queueMicrotask(() => {
            probeDispatchScheduled = false;
            try {
              if (window && typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('__FINGERPRINT_PROBE_EVENT__', {
                  detail: JSON.stringify(probeCounts)
                }));
              }
            } catch (err) {}
          });
        }
      }
    } catch (err) {
    } finally {
      isRecordingProbe = false;
    }
  }

  // Cross-Realm Native Function toString Preservation Registry
  const stealthFnMap = new WeakMap();

  function applyStealthToStringToWindow(win) {
    if (!win || !win.Function || !win.Function.prototype) return;
    try {
      const origWinToString = win.Function.prototype.toString;
      if (origWinToString.__STEALTH_APPLIED__) return;

      function realmCustomToString() {
        if (this === realmCustomToString || this === origWinToString) {
          return 'function toString() { [native code] }';
        }
        if (stealthFnMap.has(this)) {
          return stealthFnMap.get(this);
        }
        return origWinToString.apply(this, arguments);
      }
      realmCustomToString.__STEALTH_APPLIED__ = true;

      try {
        Object.defineProperty(realmCustomToString, 'name', { value: 'toString', configurable: true });
        Object.defineProperty(realmCustomToString, 'length', { value: 0, configurable: true });
      } catch(e) {}

      stealthFnMap.set(realmCustomToString, 'function toString() { [native code] }');
      stealthFnMap.set(origWinToString, 'function toString() { [native code] }');

      Object.defineProperty(win.Function.prototype, 'toString', {
        value: realmCustomToString,
        writable: true,
        enumerable: false,
        configurable: true
      });
    } catch(e) {
    }
  }

  applyStealthToStringToWindow(window);

  function registerStealthFn(fn, name) {
    if (typeof fn === 'function' && name) {
      stealthFnMap.set(fn, name.startsWith('function ') ? name : `function ${name}() { [native code] }`);
    }
  }

  // Proxy-based native disguise: wrapping the REAL native function/getter as
  // the Proxy target means Function.prototype.toString shows the target's
  // own "[native code]" output automatically (per spec, toString unwraps
  // through a Proxy to its target) - this holds even against a pristine
  // toString reference grabbed from an untouched iframe, unlike the
  // registerStealthFn/WeakMap trick which only fools callers going through
  // OUR patched Function.prototype.toString. A Proxy also has zero own
  // properties beyond what the target exposes, so it can't be caught by an
  // "extra own props" scan the way a plain `function(){}` replacement can.
  function wrapNativeMethod(protoTarget, methodName, implFn) {
    if (!protoTarget) return null;
    try {
      const origMethod = protoTarget[methodName];
      if (typeof origMethod !== 'function') return null;
      const proxyMethod = new Proxy(origMethod, {
        apply(target, thisArg, args) {
          return implFn(target, thisArg, args);
        }
      });
      protoTarget[methodName] = proxyMethod;
      return origMethod;
    } catch (e) { return null; }
  }

  // 1. Clean URLs (DOM Parameter Stripper)
  if (typeof window !== 'undefined' && window.location && window.history && window.history.replaceState) {
    try {
      const url = new URL(window.location.href);
      const TRACKING_PARAMS = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'msclkid', 'twclid', 'igshid', 'yclid', 'mc_eid', '_ga', '_hsenc'
      ];
      let modified = false;
      TRACKING_PARAMS.forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
          modified = true;
        }
      });
      if (modified) {
        window.history.replaceState(window.history.state, '', url.href);
      }
    } catch (e) {}
  }

  // Active Profile Pointer
  let activeProfile = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0",
    platform: "Win32",
    platformName: "Windows",
    platformVersion: "10.0.0",
    vendor: "Google Inc.",
    oscpu: "Windows NT 10.0; Win64; x64",
    hardwareConcurrency: 4,
    deviceMemory: 4,
    maxTouchPoints: 0,
    webglVendor: "Google Inc. (Intel)",
    webglRenderer: "ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8681)",
    maskBrave: true,
    spoofWebglAdvanced: true,
    blockBeacons: true,
    blockSameOriginBeacons: true,
    spoofScreen: false,
    shieldWorkers: true,
    verboseLogging: true
  };

  // Deterministic per-domain-per-day noise. Plain Math.random() noise
  // changes on every call, which is both a fingerprinting tell (real
  // hardware/APIs are deterministic within a session - browserleaks-style
  // detectors literally compare two back-to-back reads and flag a mismatch
  // as injected noise) and, worse, a crash risk: any code that measures
  // repeatedly and waits for two reads to agree (layout/text-fit loops,
  // audio comparison) never converges if the value moves every call. Seeding
  // the RNG from (hostname, calendar day, channel, and an optional per-
  // measurement key) makes noise a pure function of its inputs - identical
  // calls in the same session return identical output - while still
  // rotating daily so it isn't a stable long-term identifier across visits.
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
  }

  // mulberry32 - small, fast, deterministic PRNG. Not cryptographic, doesn't
  // need to be; only needs to be stable for a given seed.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededRandom01(channel, extraKey) {
    const now = new Date();
    const dayStr = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
    const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
    const seedStr = `${hostname}|${dayStr}|${channel}|${extraKey || ''}`;
    return mulberry32(hashString(seedStr))();
  }

  // Signed noise offset in [-magnitude/2, magnitude/2), deterministic for a
  // given (channel, extraKey) on this domain today.
  function seededNoise(channel, extraKey, magnitude) {
    return (seededRandom01(channel, extraKey) - 0.5) * magnitude;
  }

  // Google Privacy Sandbox Topics API Randomizer
  if (typeof document !== 'undefined') {
    try {
      document.browsingTopics = function () {
        recordProbe('topics', 'document.browsingTopics() query');
        // Real Topics API returns stable topics for the current epoch, not
        // fresh random values on every call - matching that (deterministic
        // per domain per day) is both more realistic and avoids a script
        // catching an inconsistency by calling this twice and comparing.
        const t1 = 1 + Math.floor(seededRandom01('topics', 't1') * 629);
        const t2 = 1 + Math.floor(seededRandom01('topics', 't2') * 629);
        const t3 = 1 + Math.floor(seededRandom01('topics', 't3') * 629);
        return Promise.resolve([
          { value: t1, taxonomyVersion: "1", modelVersion: "2", configVersion: "1" },
          { value: t2, taxonomyVersion: "1", modelVersion: "2", configVersion: "1" },
          { value: t3, taxonomyVersion: "1", modelVersion: "2", configVersion: "1" }
        ]);
      };
      registerStealthFn(document.browsingTopics, 'browsingTopics');
    } catch (e) {}
  }

  // Worker Code Generator with Full WebGL & Language Sync
  function generateWorkerShieldCode(profile) {
    return `(function() {
      'use strict';
      const profile = ${JSON.stringify(profile)};
      if (self.__WORKER_SHIELD_APPLIED__) return;
      self.__WORKER_SHIELD_APPLIED__ = true;

      function overrideGetter(target, prop, getValueFn) {
        try {
          Object.defineProperty(target, prop, {
            get: getValueFn,
            configurable: true,
            enumerable: true
          });
        } catch(e) {}
      }

      const nav = self.navigator;
      if (nav) {
        const navProto = Object.getPrototypeOf(nav) || nav;
        overrideGetter(navProto, 'userAgent', () => profile.userAgent);
        overrideGetter(navProto, 'appVersion', () => (profile.userAgent || '').replace(/^Mozilla\\//, ''));
        overrideGetter(navProto, 'platform', () => profile.platform || 'Win32');
        overrideGetter(navProto, 'hardwareConcurrency', () => profile.hardwareConcurrency || 4);
        overrideGetter(navProto, 'deviceMemory', () => Math.min(8, profile.deviceMemory || 4));
        overrideGetter(navProto, 'language', () => 'en-US');
        overrideGetter(navProto, 'languages', () => Object.freeze(['en-US', 'en']));
      }

      function patchWorkerGL(proto) {
        if (!proto || !proto.getParameter) return;
        const origParam = proto.getParameter;
        proto.getParameter = function(pname) {
          const num = Number(pname);
          if (num === 37445 || pname === 'UNMASKED_VENDOR_WEBGL') return profile.webglVendor || "Google Inc. (Intel)";
          if (num === 37446 || pname === 'UNMASKED_RENDERER_WEBGL') return profile.webglRenderer || "ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8681)";
          return origParam.apply(this, arguments);
        };
      }

      if (self.WebGLRenderingContext) patchWorkerGL(self.WebGLRenderingContext.prototype);
      if (self.WebGL2RenderingContext) patchWorkerGL(self.WebGL2RenderingContext.prototype);
      if (self.OffscreenCanvas) {
        const origGetCtx = self.OffscreenCanvas.prototype.getContext;
        self.OffscreenCanvas.prototype.getContext = function(type) {
          const ctx = origGetCtx.apply(this, arguments);
          if (ctx && (type === 'webgl' || type === 'webgl2')) patchWorkerGL(Object.getPrototypeOf(ctx));
          return ctx;
        };
      }
    })();\n`;
  }

  // Same-Offset IANA Timezone Database
  const TIMEZONE_OFFSET_GROUPS = {
    "Europe/Athens": ["Europe/Helsinki", "Europe/Bucharest", "Europe/Sofia", "Europe/Tallinn", "Europe/Riga", "Europe/Vilnius", "Europe/Istanbul", "Europe/Moscow", "Asia/Riyadh", "Africa/Nairobi"],
    "Europe/Helsinki": ["Europe/Athens", "Europe/Bucharest", "Europe/Sofia", "Europe/Tallinn", "Europe/Riga", "Europe/Vilnius", "Europe/Istanbul", "Europe/Moscow"],
    "Europe/Moscow": ["Europe/Athens", "Europe/Helsinki", "Europe/Bucharest", "Asia/Riyadh", "Africa/Nairobi"],
    "Europe/Berlin": ["Europe/Paris", "Europe/Rome", "Europe/Madrid", "Europe/Amsterdam", "Europe/Brussels", "Europe/Vienna", "Europe/Warsaw", "Europe/Stockholm", "Europe/Oslo"],
    "Europe/Paris": ["Europe/Berlin", "Europe/Rome", "Europe/Madrid", "Europe/Amsterdam", "Europe/Brussels", "Europe/Vienna", "Europe/Stockholm"],
    "Europe/London": ["Europe/Dublin", "Europe/Lisbon", "Atlantic/Canary"],
    "America/New_York": ["America/Toronto", "America/Detroit", "America/Kentucky/Louisville", "America/Indiana/Indianapolis"],
    "America/Los_Angeles": ["America/Vancouver", "America/Tijuana"],
    "Asia/Singapore": ["Asia/Hong_Kong", "Asia/Taipei", "Australia/Perth", "Asia/Manila"],
    "Asia/Tokyo": ["Asia/Seoul"]
  };

  function getSpoofedTimezone(nativeTz, profileId) {
    const seedStr = (profileId || '') + (window.location.hostname || '');
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    const candidates = TIMEZONE_OFFSET_GROUPS[nativeTz];
    if (Array.isArray(candidates) && candidates.length > 0) {
      const idx = absHash % candidates.length;
      return candidates[idx];
    }
    return nativeTz;
  }

  // Intercept Intl.DateTimeFormat.prototype.resolvedOptions
  if (window.Intl && Intl.DateTimeFormat) {
    try {
      const origResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
      const nativeTz = new Intl.DateTimeFormat().resolvedOptions().timeZone;

      Intl.DateTimeFormat.prototype.resolvedOptions = function () {
        const res = origResolvedOptions.apply(this, arguments);
        if (res && res.timeZone) {
          const spoofedTz = getSpoofedTimezone(res.timeZone || nativeTz, activeProfile?.id);
          recordProbe('timezone', `Intl.resolvedOptions() -> ${spoofedTz}`);
          res.timeZone = spoofedTz;
        }
        return res;
      };
      registerStealthFn(Intl.DateTimeFormat.prototype.resolvedOptions, 'resolvedOptions');
    } catch (e) {}
  }

  // Comprehensive Mac Signature Fonts List
  const MAC_SIGNATURE_FONTS = [
    "san francisco", "blinkmacsystemfont", "helvetica neue", "geneva",
    "monaco", "menlo", "lucida grande", "apple color emoji", "apple sd gothic neo",
    "pingfang sc", "pingfang hk", "pingfang tc", "hiragino sans", "zapfino",
    "snell roundhand", "chalkboard", "marker felt", "galvji", "luminari",
    "baskerville", "optima", "didot", "american typewriter", "cochin",
    "hoefler text", "skia", "avenir", "avenir next", "apple-system", "system-ui",
    "al bayan", "al nile", "al tarikh", "andale mono", "big caslon", "bodoni 72",
    "chalkduster", "copperplate", "khelvetica neus", "krungthep", "noto nashtaliq urdu",
    "plantagenet cherokee", "savoye let"
  ];

  const WIN_SIGNATURE_FONTS = [
    "segoe ui", "segoe ui symbol", "segoe ui emoji", "calibri",
    "cambria", "consolas", "ms sans serif", "ms serif", "tahoma", "trebuchet ms"
  ];

  const RARE_FONTS_LIST = [
    "Impact", "Comic Sans MS", "Palatino", "Monaco", "Helvetica Neue",
    "Futura", "Gill Sans", "Arial Black", "Arial Narrow", "Copperplate",
    "Optima", "Didot", "American Typewriter", "Baskerville", "Brush Script MT",
    "Chalkboard", "Cochin", "Hoefler Text", "Marker Felt", "Papyrus",
    "Phosphate", "Rockwell", "Skia", "Snell Roundhand", "Zapfino",
    "PT Sans", "PT Serif", "Menlo", "Andale Mono", "Lucida Grande",
    "Geneva", "Hiragino Sans", "Webdings", "Wingdings"
  ];

  function getDisabledFontsForProfile(profileId) {
    const seedStr = profileId || window.location.hostname || 'default';
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const disabled = new Set();
    const count = 8 + (absHash % 7);
    for (let i = 0; i < count; i++) {
      const idx = (absHash + i * 13) % RARE_FONTS_LIST.length;
      disabled.add(RARE_FONTS_LIST[idx].toLowerCase());
    }
    return disabled;
  }

  // Intercept document.fonts.check API
  if (typeof document !== 'undefined' && document.fonts && document.fonts.check) {
    try {
      const origFontsCheck = document.fonts.check;
      document.fonts.check = function (font, text) {
        const fontStr = (font || '').toLowerCase();
        const isWindowsProfile = (activeProfile.platformName || 'Windows').toLowerCase().includes('win');
        if (isWindowsProfile) {
          let isMacFont = false;
          MAC_SIGNATURE_FONTS.forEach(macFont => {
            if (fontStr.includes(macFont)) isMacFont = true;
          });
          if (isMacFont) {
            recordProbe('fonts', `document.fonts.check("${font}") -> Suppressed (Mac Font)`);
            return false;
          }
        }
        recordProbe('fonts', `document.fonts.check("${font}")`);
        return origFontsCheck.apply(this, arguments);
      };
      registerStealthFn(document.fonts.check, 'check');
    } catch(e) {}
  }

  const UNMASKED_VENDOR_WEBGL = 37445;
  const UNMASKED_RENDERER_WEBGL = 37446;

  const WINDOWS_D3D_EXTENSIONS = [
    "ANGLE_instanced_arrays",
    "EXT_blend_minmax",
    "EXT_color_buffer_half_float",
    "EXT_disjoint_timer_query",
    "EXT_float_blend",
    "EXT_frag_depth",
    "EXT_shader_texture_lod",
    "EXT_texture_compression_bptc",
    "EXT_texture_compression_rgtc",
    "EXT_texture_filter_anisotropic",
    "WEBGL_color_buffer_float",
    "WEBGL_compressed_texture_s3tc",
    "WEBGL_compressed_texture_s3tc_srgb",
    "WEBGL_debug_renderer_info",
    "WEBGL_debug_shaders",
    "WEBGL_depth_texture",
    "WEBGL_draw_buffers",
    "WEBGL_lose_context",
    "WEBGL_multi_draw"
  ];

  // Extended getParameter pname table. Real values, not the placeholder
  // 3390/3391 the old code used for ALIASED_LINE_WIDTH_RANGE/
  // ALIASED_POINT_SIZE_RANGE - those never matched a real query since the
  // actual WebGL enum values are 0x846E/0x846D (33902/33901), so that code
  // was silently dead. Fingerprinting scripts (FingerprintJS-style) walk a
  // few dozen of these pnames and hash the tuple, so leaving them at real
  // hardware defaults while only masking VENDOR/RENDERER is itself a
  // detectable mismatch - the values below are chosen per GPU tier so the
  // whole tuple stays internally consistent with the claimed card.
  const GL_PNAME = {
    RED_BITS: 3410, GREEN_BITS: 3411, BLUE_BITS: 3412, ALPHA_BITS: 3413,
    DEPTH_BITS: 3414, STENCIL_BITS: 3415, SUBPIXEL_BITS: 3408,
    MAX_TEXTURE_SIZE: 3379, MAX_VIEWPORT_DIMS: 3386,
    ALIASED_POINT_SIZE_RANGE: 33901, ALIASED_LINE_WIDTH_RANGE: 33902,
    MAX_CUBE_MAP_TEXTURE_SIZE: 34076, MAX_RENDERBUFFER_SIZE: 34024,
    MAX_VERTEX_ATTRIBS: 34921, MAX_VERTEX_UNIFORM_VECTORS: 36347,
    MAX_VARYING_VECTORS: 36348, MAX_COMBINED_TEXTURE_IMAGE_UNITS: 35661,
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 35660, MAX_TEXTURE_IMAGE_UNITS: 34930,
    MAX_FRAGMENT_UNIFORM_VECTORS: 36349,
    MAX_DRAW_BUFFERS_WEBGL: 34852, MAX_COLOR_ATTACHMENTS_WEBGL: 36063,
    MAX_SAMPLES: 36183, MAX_3D_TEXTURE_SIZE: 32883, MAX_ARRAY_TEXTURE_LAYERS: 35071,
    VENDOR: 7936, RENDERER: 7937, VERSION: 7938, SHADING_LANGUAGE_VERSION: 35724
  };

  // Three GPU capability tiers, matched by substring against the profile's
  // webglRenderer. Desktop GPUs across vendors report near-identical shader
  // precision (unlike mobile), so one shared precision table for all tiers
  // is realistic, not a tell.
  const GL_SHADER_PRECISION = {
    float: { rangeMin: 127, rangeMax: 127, precision: 23 },
    int: { rangeMin: 31, rangeMax: 30, precision: 0 }
  };

  const GL_CAPABILITY_TIERS = {
    intel_igpu: {
      match: /intel|iris|uhd|hd graphics/i,
      caps: {
        MAX_TEXTURE_SIZE: 16384, MAX_CUBE_MAP_TEXTURE_SIZE: 16384, MAX_RENDERBUFFER_SIZE: 16384,
        MAX_VERTEX_ATTRIBS: 16, MAX_VERTEX_UNIFORM_VECTORS: 4096, MAX_VARYING_VECTORS: 31,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 32, MAX_VERTEX_TEXTURE_IMAGE_UNITS: 16,
        MAX_TEXTURE_IMAGE_UNITS: 16, MAX_FRAGMENT_UNIFORM_VECTORS: 1024,
        MAX_DRAW_BUFFERS_WEBGL: 8, MAX_COLOR_ATTACHMENTS_WEBGL: 8,
        MAX_SAMPLES: 8, MAX_3D_TEXTURE_SIZE: 2048, MAX_ARRAY_TEXTURE_LAYERS: 2048,
        DEPTH_BITS: 24, STENCIL_BITS: 8, SUBPIXEL_BITS: 4
      }
    },
    nvidia_discrete: {
      match: /nvidia|geforce|rtx|gtx/i,
      caps: {
        MAX_TEXTURE_SIZE: 32768, MAX_CUBE_MAP_TEXTURE_SIZE: 32768, MAX_RENDERBUFFER_SIZE: 32768,
        MAX_VERTEX_ATTRIBS: 16, MAX_VERTEX_UNIFORM_VECTORS: 4096, MAX_VARYING_VECTORS: 31,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 192, MAX_VERTEX_TEXTURE_IMAGE_UNITS: 32,
        MAX_TEXTURE_IMAGE_UNITS: 32, MAX_FRAGMENT_UNIFORM_VECTORS: 4096,
        MAX_DRAW_BUFFERS_WEBGL: 8, MAX_COLOR_ATTACHMENTS_WEBGL: 8,
        MAX_SAMPLES: 32, MAX_3D_TEXTURE_SIZE: 16384, MAX_ARRAY_TEXTURE_LAYERS: 2048,
        DEPTH_BITS: 24, STENCIL_BITS: 8, SUBPIXEL_BITS: 4
      }
    },
    apple_intel_igpu: {
      match: /iris.*61|iris graphics/i,
      caps: {
        MAX_TEXTURE_SIZE: 16384, MAX_CUBE_MAP_TEXTURE_SIZE: 16384, MAX_RENDERBUFFER_SIZE: 16384,
        MAX_VERTEX_ATTRIBS: 16, MAX_VERTEX_UNIFORM_VECTORS: 4096, MAX_VARYING_VECTORS: 31,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 48, MAX_VERTEX_TEXTURE_IMAGE_UNITS: 16,
        MAX_TEXTURE_IMAGE_UNITS: 16, MAX_FRAGMENT_UNIFORM_VECTORS: 1024,
        MAX_DRAW_BUFFERS_WEBGL: 8, MAX_COLOR_ATTACHMENTS_WEBGL: 8,
        MAX_SAMPLES: 4, MAX_3D_TEXTURE_SIZE: 2048, MAX_ARRAY_TEXTURE_LAYERS: 2048,
        DEPTH_BITS: 24, STENCIL_BITS: 8, SUBPIXEL_BITS: 4
      }
    },
    mesa_generic: {
      match: /mesa|llvmpipe/i,
      caps: {
        MAX_TEXTURE_SIZE: 16384, MAX_CUBE_MAP_TEXTURE_SIZE: 16384, MAX_RENDERBUFFER_SIZE: 16384,
        MAX_VERTEX_ATTRIBS: 16, MAX_VERTEX_UNIFORM_VECTORS: 4096, MAX_VARYING_VECTORS: 31,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 32, MAX_VERTEX_TEXTURE_IMAGE_UNITS: 16,
        MAX_TEXTURE_IMAGE_UNITS: 16, MAX_FRAGMENT_UNIFORM_VECTORS: 1024,
        MAX_DRAW_BUFFERS_WEBGL: 8, MAX_COLOR_ATTACHMENTS_WEBGL: 8,
        MAX_SAMPLES: 8, MAX_3D_TEXTURE_SIZE: 2048, MAX_ARRAY_TEXTURE_LAYERS: 2048,
        DEPTH_BITS: 24, STENCIL_BITS: 8, SUBPIXEL_BITS: 4
      }
    },
    amd_discrete: {
      match: /amd|radeon/i,
      caps: {
        MAX_TEXTURE_SIZE: 16384, MAX_CUBE_MAP_TEXTURE_SIZE: 16384, MAX_RENDERBUFFER_SIZE: 16384,
        MAX_VERTEX_ATTRIBS: 16, MAX_VERTEX_UNIFORM_VECTORS: 4096, MAX_VARYING_VECTORS: 31,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 160, MAX_VERTEX_TEXTURE_IMAGE_UNITS: 32,
        MAX_TEXTURE_IMAGE_UNITS: 32, MAX_FRAGMENT_UNIFORM_VECTORS: 4096,
        MAX_DRAW_BUFFERS_WEBGL: 8, MAX_COLOR_ATTACHMENTS_WEBGL: 8,
        MAX_SAMPLES: 16, MAX_3D_TEXTURE_SIZE: 16384, MAX_ARRAY_TEXTURE_LAYERS: 2048,
        DEPTH_BITS: 24, STENCIL_BITS: 8, SUBPIXEL_BITS: 4
      }
    },
    apple_silicon: {
      match: /apple m\d/i,
      caps: {
        MAX_TEXTURE_SIZE: 16384, MAX_CUBE_MAP_TEXTURE_SIZE: 16384, MAX_RENDERBUFFER_SIZE: 16384,
        MAX_VERTEX_ATTRIBS: 31, MAX_VERTEX_UNIFORM_VECTORS: 4096, MAX_VARYING_VECTORS: 31,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 96, MAX_VERTEX_TEXTURE_IMAGE_UNITS: 32,
        MAX_TEXTURE_IMAGE_UNITS: 32, MAX_FRAGMENT_UNIFORM_VECTORS: 4096,
        MAX_DRAW_BUFFERS_WEBGL: 8, MAX_COLOR_ATTACHMENTS_WEBGL: 8,
        MAX_SAMPLES: 4, MAX_3D_TEXTURE_SIZE: 2048, MAX_ARRAY_TEXTURE_LAYERS: 2048,
        DEPTH_BITS: 24, STENCIL_BITS: 8, SUBPIXEL_BITS: 4
      }
    }
  };

  function getGLCapsForRenderer(rendererStr, vendorStr) {
    const r = rendererStr || '';
    const v = vendorStr || '';
    // Vendor string is the strongest signal for Mesa (Linux) - a renderer
    // string alone (e.g. "AMD Radeon RX 6600 (navi23, ...)") doesn't always
    // literally contain "mesa", but the vendor field does on Linux.
    if (/mesa/i.test(v) || /mesa|llvmpipe/i.test(r)) return GL_CAPABILITY_TIERS.mesa_generic.caps;
    if (/apple m\d/i.test(r)) return GL_CAPABILITY_TIERS.apple_silicon.caps;
    if (/apple|metal/i.test(r) && /iris/i.test(r)) return GL_CAPABILITY_TIERS.apple_intel_igpu.caps;
    for (const key of ['nvidia_discrete', 'amd_discrete', 'intel_igpu']) {
      if (GL_CAPABILITY_TIERS[key].match.test(r)) return GL_CAPABILITY_TIERS[key].caps;
    }
    return GL_CAPABILITY_TIERS.intel_igpu.caps;
  }

  function patchWindowContext(targetWin) {
    if (!targetWin) return;
    try {
      if (targetWin.__SHIELD_HOOKED__) return;
      targetWin.__SHIELD_HOOKED__ = true;
    } catch (e) { return; }

    applyStealthToStringToWindow(targetWin);

    // STRICT PROTOTYPE-ONLY GETTER OVERRIDE WITH 'this' VALIDATION
    function overridePrototypeGetter(protoTarget, prop, getValueFn, category, detailLabel) {
      if (!protoTarget) return;
      try {
        const desc = Object.getOwnPropertyDescriptor(protoTarget, prop);
        const origGetter = desc && desc.get;
        let replacementGetter;

        if (origGetter) {
          // Wrap the real native getter. Calling it first (and discarding its
          // return value) gets us native illegal-invocation branding for
          // free - a bad receiver throws the real TypeError, not an
          // approximation - and the Proxy's toString/own-props transparently
          // match the native original (see wrapNativeMethod comment above).
          replacementGetter = new Proxy(origGetter, {
            apply(target, thisArg, args) {
              Reflect.apply(target, thisArg, args);
              if (category) recordProbe(category, detailLabel || prop);
              return getValueFn();
            }
          });
        } else {
          // No native getter exists on this prototype to wrap (e.g.
          // navigator.brave, navigator.hid don't natively exist) - fall back
          // to the toString-registry disguise since there's no real native
          // to wrap transparently.
          const fallback = function () {
            if (this === protoTarget) throw new TypeError('Illegal invocation');
            if (category) recordProbe(category, detailLabel || prop);
            return getValueFn();
          };
          try {
            Object.defineProperty(fallback, 'name', { value: `get ${prop}`, configurable: true });
          } catch (e) {}
          registerStealthFn(fallback, `get ${prop}`);
          replacementGetter = fallback;
        }

        Object.defineProperty(protoTarget, prop, {
          get: replacementGetter,
          configurable: desc ? desc.configurable !== false : true,
          enumerable: desc ? desc.enumerable !== false : true
        });
      } catch (e) {}
    }

    const nav = targetWin.navigator;
    const navProto = nav ? (Object.getPrototypeOf(nav) || targetWin.Navigator?.prototype) : null;

    // Disk Storage Quota API Standardization
    if (nav && nav.storage && nav.storage.estimate) {
      const origEstimate = nav.storage.estimate;
      nav.storage.estimate = function () {
        recordProbe('storage', 'navigator.storage.estimate()');
        return Promise.resolve({
          quota: 107374182400,
          usage: 1024000,
          usageDetails: {}
        });
      };
      registerStealthFn(nav.storage.estimate, 'estimate');
    }

    // Media Device Enumeration Masking
    if (nav && nav.mediaDevices && nav.mediaDevices.enumerateDevices) {
      const origEnumerate = nav.mediaDevices.enumerateDevices;
      nav.mediaDevices.enumerateDevices = function () {
        recordProbe('peripherals', 'navigator.mediaDevices.enumerateDevices() -> Masked Generic');
        return Promise.resolve([
          { deviceId: "default", kind: "audioinput", label: "", groupId: "default" },
          { deviceId: "default", kind: "audiooutput", label: "", groupId: "default" },
          { deviceId: "default", kind: "videoinput", label: "", groupId: "default" }
        ]);
      };
      registerStealthFn(nav.mediaDevices.enumerateDevices, 'enumerateDevices');
    }

    // SVGRect geometry (getBBox/getComputedTextLength/getSubStringLength)
    // used to add fresh Math.random() noise per call - the exact same
    // measure-until-stable crash risk as getBoundingClientRect above.
    // SVG-based chart libraries (d3 and friends) call getBBox in resize/
    // redraw loops just as aggressively. Passthrough.
    if (targetWin.SVGGraphicsElement && targetWin.SVGGraphicsElement.prototype.getBBox) {
      wrapNativeMethod(targetWin.SVGGraphicsElement.prototype, 'getBBox', (target, thisArg, args) => {
        return Reflect.apply(target, thisArg, args);
      });
    }

    if (targetWin.SVGTextContentElement) {
      if (targetWin.SVGTextContentElement.prototype.getComputedTextLength) {
        wrapNativeMethod(targetWin.SVGTextContentElement.prototype, 'getComputedTextLength', (target, thisArg, args) => {
          return Reflect.apply(target, thisArg, args);
        });
      }
      if (targetWin.SVGTextContentElement.prototype.getSubStringLength) {
        wrapNativeMethod(targetWin.SVGTextContentElement.prototype, 'getSubStringLength', (target, thisArg, args) => {
          return Reflect.apply(target, thisArg, args);
        });
      }
    }

    // Smart WebRTC Private LAN IP Scrubbing (Meeting-Safe)
    if (targetWin.RTCPeerConnection) {
      const origCreateOffer = targetWin.RTCPeerConnection.prototype.createOffer;
      if (origCreateOffer) {
        targetWin.RTCPeerConnection.prototype.createOffer = function () {
          recordProbe('webrtc', 'RTCPeerConnection.createOffer() SDP candidate scrub');
          return origCreateOffer.apply(this, arguments).then(offer => {
            if (offer && offer.sdp) {
              offer.sdp = offer.sdp.replace(/a=candidate:.*?\s(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|fe80::[a-fA-F0-9:]+).*?\r\n/gi, '');
            }
            return offer;
          });
        };
        registerStealthFn(targetWin.RTCPeerConnection.prototype.createOffer, 'createOffer');
      }

      const origCreateAnswer = targetWin.RTCPeerConnection.prototype.createAnswer;
      if (origCreateAnswer) {
        targetWin.RTCPeerConnection.prototype.createAnswer = function () {
          recordProbe('webrtc', 'RTCPeerConnection.createAnswer() SDP candidate scrub');
          return origCreateAnswer.apply(this, arguments).then(answer => {
            if (answer && answer.sdp) {
              answer.sdp = answer.sdp.replace(/a=candidate:.*?\s(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|fe80::[a-fA-F0-9:]+).*?\r\n/gi, '');
            }
            return answer;
          });
        };
        registerStealthFn(targetWin.RTCPeerConnection.prototype.createAnswer, 'createAnswer');
      }
    }

    // Multi-Monitor & Screen Details API Masking (PROTOTYPE ONLY)
    if (targetWin.screen) {
      const scr = targetWin.screen;
      const scrProto = Object.getPrototypeOf(scr) || targetWin.Screen?.prototype;
      if (scrProto) overridePrototypeGetter(scrProto, 'isExtended', () => false, 'screen', 'screen.isExtended');
    }

    if (targetWin.getScreenDetails) {
      targetWin.getScreenDetails = function () {
        recordProbe('screen', 'window.getScreenDetails()');
        return Promise.resolve({
          currentScreen: { isPrimary: true, isInternal: true, label: "Primary Display" },
          screens: [{ isPrimary: true, isInternal: true, label: "Primary Display" }]
        });
      };
      registerStealthFn(targetWin.getScreenDetails, 'getScreenDetails');
    }

    // Gamepad, Bluetooth, WebHID & WebUSB API Neutering (PROTOTYPE ONLY)
    if (navProto) {
      // getGamepads is a real METHOD (data property), not an accessor -
      // same shape mismatch as getBattery above, same fix.
      wrapNativeMethod(navProto, 'getGamepads', (target, thisArg, args) => {
        recordProbe('peripherals', 'navigator.getGamepads()');
        return [null, null, null, null];
      });

      const mockBluetooth = {
        getAvailability: () => Promise.resolve(false),
        getDevices: () => Promise.resolve([]),
        requestDevice: () => Promise.reject(new DOMException("Bluetooth access disabled", "NotFoundError"))
      };
      overridePrototypeGetter(navProto, 'bluetooth', () => mockBluetooth, 'peripherals', 'navigator.bluetooth');

      const mockHID = {
        getDevices: () => Promise.resolve([]),
        requestDevice: () => Promise.resolve([])
      };
      overridePrototypeGetter(navProto, 'hid', () => mockHID, 'peripherals', 'navigator.hid');

      const mockUSB = {
        getDevices: () => Promise.resolve([]),
        requestDevice: () => Promise.reject(new DOMException("USB device access disabled", "NotFoundError"))
      };
      overridePrototypeGetter(navProto, 'usb', () => mockUSB, 'peripherals', 'navigator.usb');
    }

    // getBoundingClientRect/getClientRects used to add fresh Math.random()
    // noise on every call. Layout code that measures-until-stable (common in
    // ResizeObserver-driven chart/UI libraries: measure, compare to last
    // measurement, re-measure if different) never sees two equal reads once
    // every call returns a different random value - it loops forever,
    // hammering these hot APIs tens of thousands of times a second until the
    // tab locks up or crashes. Sub-pixel rect noise is a weak entropy source
    // anyway; passthrough is the safe choice; also drop the per-call
    // tag/class string building, since this is a hot path that can be
    // called at very high frequency by legitimate layout code.
    if (targetWin.Element && targetWin.Element.prototype.getBoundingClientRect) {
      wrapNativeMethod(targetWin.Element.prototype, 'getBoundingClientRect', (target, thisArg, args) => {
        return Reflect.apply(target, thisArg, args);
      });
    }

    if (targetWin.Range && targetWin.Range.prototype.getClientRects) {
      wrapNativeMethod(targetWin.Range.prototype, 'getClientRects', (target, thisArg, args) => {
        return Reflect.apply(target, thisArg, args);
      });
    }

    // Worker Constructor & URL.createObjectURL Interception
    if (targetWin.URL && targetWin.URL.createObjectURL) {
      const origCreateObjectURL = targetWin.URL.createObjectURL;
      targetWin.URL.createObjectURL = function (blobOrMedia) {
        if (blobOrMedia instanceof Blob) {
          const type = (blobOrMedia.type || '').toLowerCase();
          if (type.includes('javascript') || type.includes('ecmascript') || type === '') {
            const shieldHeader = generateWorkerShieldCode(activeProfile);
            const patchedBlob = new Blob([shieldHeader, blobOrMedia], { type: blobOrMedia.type || 'application/javascript' });
            return origCreateObjectURL.call(this, patchedBlob);
          }
        }
        return origCreateObjectURL.apply(this, arguments);
      };
      registerStealthFn(targetWin.URL.createObjectURL, 'createObjectURL');
    }

    // Worker/SharedWorker shielding is opt-out (popup toggle "Shield Web
    // Workers", default on) rather than always-on. Running the real script
    // through a blob: wrapper (importScripts(realURL)) to inject the shield
    // poisons the worker's base URL for its whole lifetime - blob: URLs have
    // no resolvable path, so any relative resource load the real script
    // does afterward (a nested Worker/SharedWorker, a dynamic import, a wasm
    // fetch - all common in bundled crypto workers) can silently fail. That
    // broke Telegram's MTProto worker. Module workers always skip the
    // wrapper since importScripts doesn't exist there. When the toggle is
    // off, workers load at their real URL unmodified - no shield inside
    // worker threads, but nothing breaks either. checked at call time (not
    // patch time) so toggling it takes effect on the next worker created
    // without needing a fresh injection.
    function wrapWorkerCtor(OrigCtor) {
      return function (scriptURL, options) {
        if (activeProfile.shieldWorkers && typeof scriptURL === 'string' &&
            !scriptURL.startsWith('blob:') && options?.type !== 'module') {
          try {
            const absoluteURL = new URL(scriptURL, targetWin.location.href).href;
            const shieldHeader = generateWorkerShieldCode(activeProfile);
            const wrapperCode = `${shieldHeader}\ntry { importScripts(${JSON.stringify(absoluteURL)}); } catch(e) {}`;
            const blob = new Blob([wrapperCode], { type: 'application/javascript' });
            const blobURL = URL.createObjectURL(blob);
            return new OrigCtor(blobURL, options);
          } catch (e) {
            return new OrigCtor(scriptURL, options);
          }
        }
        return new OrigCtor(scriptURL, options);
      };
    }

    if (targetWin.Worker) {
      const OrigWorker = targetWin.Worker;
      const WrappedWorker = wrapWorkerCtor(OrigWorker);
      targetWin.Worker = function (scriptURL, options) {
        recordProbe('hardware', `new Worker("${scriptURL}")`);
        return WrappedWorker(scriptURL, options);
      };
      targetWin.Worker.prototype = OrigWorker.prototype;
      registerStealthFn(targetWin.Worker, 'Worker');
    }

    if (targetWin.SharedWorker) {
      const OrigSharedWorker = targetWin.SharedWorker;
      const WrappedSharedWorker = wrapWorkerCtor(OrigSharedWorker);
      targetWin.SharedWorker = function (scriptURL, options) {
        recordProbe('hardware', `new SharedWorker("${scriptURL}")`);
        return WrappedSharedWorker(scriptURL, options);
      };
      targetWin.SharedWorker.prototype = OrigSharedWorker.prototype;
      registerStealthFn(targetWin.SharedWorker, 'SharedWorker');
    }

    // ServiceWorker Registration Interception
    // Note: the spec requires a ServiceWorker scriptURL to be http/https, so a
    // blob: URL always throws SecurityError on register(). Shielding a service
    // worker this way is a dead end - just record the probe and pass through.
    if (targetWin.ServiceWorkerContainer && targetWin.ServiceWorkerContainer.prototype.register) {
      const origRegister = targetWin.ServiceWorkerContainer.prototype.register;
      targetWin.ServiceWorkerContainer.prototype.register = function (scriptURL, options) {
        recordProbe('hardware', `serviceWorker.register("${scriptURL}")`);
        return origRegister.apply(this, arguments);
      };
      registerStealthFn(targetWin.ServiceWorkerContainer.prototype.register, 'register');
    }

    // SpeechSynthesis Voice Spoofing
    if (targetWin.speechSynthesis || targetWin.SpeechSynthesis) {
      const mockVoices = [
        { name: "Microsoft David - English (United States)", lang: "en-US", default: true, localService: true, voiceURI: "Microsoft David - English (United States)" },
        { name: "Microsoft Zira - English (United States)", lang: "en-US", default: false, localService: true, voiceURI: "Microsoft Zira - English (United States)" },
        { name: "Microsoft Mark - English (United States)", lang: "en-US", default: false, localService: true, voiceURI: "Microsoft Mark - English (United States)" }
      ];

      const mockGetVoices = function () {
        recordProbe('speech', 'speechSynthesis.getVoices()');
        return mockVoices;
      };
      registerStealthFn(mockGetVoices, 'getVoices');

      try {
        if (targetWin.speechSynthesis) targetWin.speechSynthesis.getVoices = mockGetVoices;
        if (targetWin.SpeechSynthesis && targetWin.SpeechSynthesis.prototype) {
          targetWin.SpeechSynthesis.prototype.getVoices = mockGetVoices;
        }
      } catch (e) {}
    }

    if (!navProto) return;

    // sendBeacon & Ping Protection
    if (nav && nav.sendBeacon) {
      const origSendBeacon = nav.sendBeacon;
      nav.sendBeacon = function (url, data) {
        let inspectObj = null;
        if (data) {
          try {
            if (typeof data === 'string') inspectObj = JSON.parse(data);
            else inspectObj = data;
          } catch(e) {
            inspectObj = String(data);
          }
        }

        let isThirdParty = false;
        try {
          const targetUrl = new URL(url, targetWin.location.href);
          isThirdParty = targetUrl.hostname !== targetWin.location.hostname;
        } catch (e) {}

        const blockSameOrigin = activeProfile.blockSameOriginBeacons !== false;
        const shouldBlock = isThirdParty || blockSameOrigin;

        if (shouldBlock) {
          recordProbe('beacons', `sendBeacon("${url}") -> BLOCKED (${isThirdParty ? '3rd-Party' : 'Same-Origin'} Telemetry)`, inspectObj);
          return true;
        }

        recordProbe('beacons', `sendBeacon("${url}") -> ALLOWED (Same-Origin)`, inspectObj);
        return origSendBeacon.apply(this, arguments);
      };
      registerStealthFn(nav.sendBeacon, 'sendBeacon');
    }

    if (targetWin.HTMLAnchorElement) {
      try {
        Object.defineProperty(targetWin.HTMLAnchorElement.prototype, 'ping', {
          get: function () { return ''; },
          set: function () { return true; },
          configurable: true,
          enumerable: true
        });
      } catch (e) {}
    }

    // STRICT PROTOTYPE-ONLY NAVIGATOR OVERRIDES (Zero own properties on navigator instance)
    overridePrototypeGetter(navProto, 'userAgent', () => activeProfile.userAgent, 'userAgent', 'navigator.userAgent');
    overridePrototypeGetter(navProto, 'appVersion', () => (activeProfile.userAgent || '').replace(/^Mozilla\//, ''), 'userAgent', 'navigator.appVersion');
    overridePrototypeGetter(navProto, 'platform', () => activeProfile.platform || 'Win32', 'userAgent', 'navigator.platform');
    overridePrototypeGetter(navProto, 'vendor', () => activeProfile.vendor || 'Google Inc.', 'userAgent', 'navigator.vendor');
    // navigator.oscpu doesn't exist on real Chrome (it's a Firefox-only
    // property) - previously this added it unconditionally, which is itself
    // a tell for any check that tests `'oscpu' in navigator`.
    overridePrototypeGetter(navProto, 'language', () => 'en-US');
    overridePrototypeGetter(navProto, 'languages', () => Object.freeze(['en-US', 'en']));
    overridePrototypeGetter(navProto, 'hardwareConcurrency', () => activeProfile.hardwareConcurrency || 4, 'hardware', 'hardwareConcurrency');
    overridePrototypeGetter(navProto, 'deviceMemory', () => Math.min(8, activeProfile.deviceMemory || 4), 'hardware', 'deviceMemory');
    overridePrototypeGetter(navProto, 'maxTouchPoints', () => activeProfile.maxTouchPoints || 0, 'hardware', 'maxTouchPoints');

    // Only mask navigator.brave if it actually exists (i.e. this really is
    // Brave). Without the 'in nav' guard this would manufacture the
    // property on vanilla Chrome, where it should never exist at all - the
    // same "adds a property real Chrome never has" tell as the old
    // navigator.oscpu bug.
    if (activeProfile.maskBrave && 'brave' in nav) {
      overridePrototypeGetter(navProto, 'brave', () => undefined, 'brave', 'navigator.brave');
    }

    try {
      if ('Brave' in targetWin) {
        delete targetWin.Brave;
      }
    } catch(e) {}

    // Client Hints - navigator.userAgentData (PROTOTYPE ONLY)
    if ('userAgentData' in nav) {
      const mockUAData = {
        get brands() { return activeProfile.brands || [{ brand: "Not:A-Brand", version: "24" }, { brand: "Chromium", version: "150" }, { brand: "Microsoft Edge", version: "150" }]; },
        get mobile() { return false; },
        get platform() { return activeProfile.platformName || "Windows"; },
        getHighEntropyValues: function (hints) {
          recordProbe('userAgentData', `getHighEntropyValues(${JSON.stringify(hints || [])})`);
          return new Promise(function (resolve) {
            const platformName = activeProfile.platformName || "Windows";
            const platformVersion = activeProfile.platformVersion || "10.0.0";
            const architecture = activeProfile.architecture || "x86";
            const bitness = activeProfile.bitness || "64";
            const spoofedBrands = activeProfile.brands || [{ brand: "Chromium", version: "150" }];
            const spoofedFullVersions = activeProfile.fullVersionList || [{ brand: "Chromium", version: "150.0.7100.25" }];

            const res = { brands: spoofedBrands, mobile: false, platform: platformName };
            if (Array.isArray(hints)) {
              if (hints.includes('architecture')) res.architecture = architecture;
              if (hints.includes('bitness')) res.bitness = bitness;
              if (hints.includes('brands')) res.brands = spoofedBrands;
              if (hints.includes('fullVersionList')) res.fullVersionList = spoofedFullVersions;
              if (hints.includes('mobile')) res.mobile = false;
              if (hints.includes('model')) res.model = "";
              if (hints.includes('platform')) res.platform = platformName;
              if (hints.includes('platformVersion')) res.platformVersion = platformVersion;
              if (hints.includes('uaFullVersion')) res.uaFullVersion = spoofedFullVersions[2]?.version || "150.0.0.0";
            }
            resolve(res);
          });
        },
        toJSON: function () {
          recordProbe('userAgentData', 'userAgentData.toJSON()');
          return { brands: activeProfile.brands, mobile: false, platform: activeProfile.platformName || "Windows" };
        }
      };
      registerStealthFn(mockUAData.getHighEntropyValues, 'getHighEntropyValues');
      registerStealthFn(mockUAData.toJSON, 'toJSON');

      overridePrototypeGetter(navProto, 'userAgentData', () => mockUAData, 'userAgentData', 'navigator.userAgentData');
    }

    // WebGPU Protection (PROTOTYPE ONLY)
    if ('gpu' in nav) {
      const mockGPU = {
        requestAdapter: function () {
          recordProbe('webgl', 'navigator.gpu.requestAdapter()');
          const mockAdapterInfo = {
            vendor: "intel",
            architecture: "gen-9",
            device: "Intel(R) HD Graphics 620",
            description: activeProfile.webglRenderer || "ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11)",
            driver: ""
          };
          return Promise.resolve({
            features: new Set(),
            limits: {},
            isFallbackAdapter: false,
            requestAdapterInfo: () => Promise.resolve(mockAdapterInfo),
            info: mockAdapterInfo
          });
        },
        getPreferredCanvasFormat: () => 'bgra8unorm'
      };
      registerStealthFn(mockGPU.requestAdapter, 'requestAdapter');
      registerStealthFn(mockGPU.getPreferredCanvasFormat, 'getPreferredCanvasFormat');

      overridePrototypeGetter(navProto, 'gpu', () => mockGPU, 'webgl', 'navigator.gpu');
    }

    // Battery Status API Spoofing (PROTOTYPE ONLY)
    // navigator.getBattery is a real METHOD on Navigator.prototype (a plain
    // data property whose value is a function), not an accessor. Routing it
    // through overridePrototypeGetter turned it into a getter-backed
    // property - Object.getOwnPropertyDescriptor shows `.get` where a real
    // browser shows `.value`, a structural tell independent of toString
    // disguise quality. wrapNativeMethod keeps the native shape (direct
    // value assignment, Proxy-wrapped for correct toString/own-props).
    if ('getBattery' in nav) {
      const mockBatteryManager = {
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1.0,
        addEventListener: function () {},
        removeEventListener: function () {},
        dispatchEvent: function () { return true; }
      };

      wrapNativeMethod(navProto, 'getBattery', (target, thisArg, args) => {
        recordProbe('battery', 'navigator.getBattery()');
        return Promise.resolve(mockBatteryManager);
      });
    }

    // Safe Screen Geometry Overrides (PROTOTYPE ONLY)
    if (targetWin.screen) {
      const scr = targetWin.screen;
      const scrProto = Object.getPrototypeOf(scr) || targetWin.Screen?.prototype;
      const nativeWidth = scr.width;
      const nativeHeight = scr.height;
      const origWidthGet = Object.getOwnPropertyDescriptor(scrProto, 'width')?.get || Object.getOwnPropertyDescriptor(scr, 'width')?.get;
      const origHeightGet = Object.getOwnPropertyDescriptor(scrProto, 'height')?.get || Object.getOwnPropertyDescriptor(scr, 'height')?.get;

      if (scrProto) {
        overridePrototypeGetter(scrProto, 'width', () => {
          if (activeProfile.spoofScreen) return 1920;
          return origWidthGet ? origWidthGet.call(scr) : nativeWidth;
        }, 'screen', 'screen.width');

        overridePrototypeGetter(scrProto, 'height', () => {
          if (activeProfile.spoofScreen) return 1080;
          return origHeightGet ? origHeightGet.call(scr) : nativeHeight;
        }, 'screen', 'screen.height');
      }
    }

    // WebGL Context Prototype Patching (PROTOTYPE ONLY - NO INSTANCE POLLUTION)
    // Every override below goes through wrapNativeMethod so getParameter et
    // al. stay Proxy-wrapped around the real native function: correct
    // toString, zero extra own-properties, and identical whether checked
    // from the main document, a worker (worker threads aren't patched at
    // all right now - see the Worker/SharedWorker section - so a
    // Worker-vs-main GPU cross-check will still catch a mismatch there
    // regardless of anything done here), or an iframe (content scripts run
    // per-frame via manifest all_frames, so this function re-runs
    // independently in every frame already).
    function patchGLContext(contextProto) {
      if (!contextProto || !contextProto.getParameter) return;
      const caps = getGLCapsForRenderer(activeProfile.webglRenderer, activeProfile.webglVendor);

      wrapNativeMethod(contextProto, 'getParameter', (target, thisArg, args) => {
        const pname = args[0];
        const numPname = Number(pname);

        if (numPname === UNMASKED_VENDOR_WEBGL) {
          recordProbe('webgl', 'getParameter(UNMASKED_VENDOR_WEBGL)');
          return activeProfile.webglVendor || "Google Inc. (Intel)";
        }
        if (numPname === UNMASKED_RENDERER_WEBGL) {
          recordProbe('webgl', 'getParameter(UNMASKED_RENDERER_WEBGL)');
          return activeProfile.webglRenderer || "ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8681)";
        }
        if (activeProfile.spoofWebglAdvanced) {
          if (numPname === GL_PNAME.MAX_TEXTURE_SIZE || numPname === GL_PNAME.MAX_CUBE_MAP_TEXTURE_SIZE ||
              numPname === GL_PNAME.MAX_RENDERBUFFER_SIZE || numPname === GL_PNAME.MAX_VERTEX_ATTRIBS ||
              numPname === GL_PNAME.MAX_VERTEX_UNIFORM_VECTORS || numPname === GL_PNAME.MAX_VARYING_VECTORS ||
              numPname === GL_PNAME.MAX_COMBINED_TEXTURE_IMAGE_UNITS || numPname === GL_PNAME.MAX_VERTEX_TEXTURE_IMAGE_UNITS ||
              numPname === GL_PNAME.MAX_TEXTURE_IMAGE_UNITS || numPname === GL_PNAME.MAX_FRAGMENT_UNIFORM_VECTORS ||
              numPname === GL_PNAME.MAX_DRAW_BUFFERS_WEBGL || numPname === GL_PNAME.MAX_COLOR_ATTACHMENTS_WEBGL ||
              numPname === GL_PNAME.MAX_SAMPLES || numPname === GL_PNAME.MAX_3D_TEXTURE_SIZE ||
              numPname === GL_PNAME.MAX_ARRAY_TEXTURE_LAYERS || numPname === GL_PNAME.DEPTH_BITS ||
              numPname === GL_PNAME.STENCIL_BITS || numPname === GL_PNAME.SUBPIXEL_BITS) {
            const key = Object.keys(GL_PNAME).find(k => GL_PNAME[k] === numPname);
            if (caps[key] !== undefined) {
              recordProbe('webgl', `getParameter(${key})`);
              return caps[key];
            }
          }
          if (numPname === GL_PNAME.MAX_VIEWPORT_DIMS) {
            recordProbe('webgl', 'getParameter(MAX_VIEWPORT_DIMS)');
            return Int32Array.from([caps.MAX_TEXTURE_SIZE, caps.MAX_TEXTURE_SIZE]);
          }
          if (numPname === GL_PNAME.ALIASED_LINE_WIDTH_RANGE) {
            recordProbe('webgl', 'getParameter(ALIASED_LINE_WIDTH_RANGE)');
            return Float32Array.from([1, 1]);
          }
          if (numPname === GL_PNAME.ALIASED_POINT_SIZE_RANGE) {
            recordProbe('webgl', 'getParameter(ALIASED_POINT_SIZE_RANGE)');
            return Float32Array.from([1, 1024]);
          }
        }
        return Reflect.apply(target, thisArg, args);
      });

      wrapNativeMethod(contextProto, 'getExtension', (target, thisArg, args) => {
        const name = args[0];
        const ext = Reflect.apply(target, thisArg, args);
        if (name === 'WEBGL_debug_renderer_info' || name === 'WEBGL_DEBUG_RENDERER_INFO') {
          recordProbe('webgl', `getExtension("${name}")`);
          return {
            UNMASKED_VENDOR_WEBGL: UNMASKED_VENDOR_WEBGL,
            UNMASKED_RENDERER_WEBGL: UNMASKED_RENDERER_WEBGL
          };
        }
        if (name === 'WEBGL_debug_shaders' && ext && ext.getTranslatedShaderSource) {
          wrapNativeMethod(ext, 'getTranslatedShaderSource', (t2, this2, args2) => {
            recordProbe('webgl', 'getTranslatedShaderSource() comment scrub');
            let src = Reflect.apply(t2, this2, args2);
            if (typeof src === 'string') {
              src = src.replace(/Apple|M1|M2|M3|Max|Pro|Metal/gi, 'Intel');
            }
            return src;
          });
        }
        return ext;
      });

      wrapNativeMethod(contextProto, 'getSupportedExtensions', (target, thisArg, args) => {
        if (activeProfile.spoofWebglAdvanced) {
          recordProbe('webgl', 'getSupportedExtensions() D3D spoof');
          return WINDOWS_D3D_EXTENSIONS;
        }
        return Reflect.apply(target, thisArg, args);
      });

      wrapNativeMethod(contextProto, 'getShaderPrecisionFormat', (target, thisArg, args) => {
        if (activeProfile.spoofWebglAdvanced) {
          recordProbe('webgl', 'getShaderPrecisionFormat()');
          const precisionType = Number(args[1]);
          // LOW/MEDIUM/HIGH_INT = 36339/36340/36341, everything else is a
          // float precision type. Desktop GL implementations report near-
          // identical precision across the *_FLOAT tiers (and across
          // vendors), so one shared table per kind is realistic, not a tell.
          const isInt = precisionType === 36339 || precisionType === 36340 || precisionType === 36341;
          const t = isInt ? GL_SHADER_PRECISION.int : GL_SHADER_PRECISION.float;
          return { rangeMin: t.rangeMin, rangeMax: t.rangeMax, precision: t.precision };
        }
        return Reflect.apply(target, thisArg, args);
      });

      wrapNativeMethod(contextProto, 'readPixels', (target, thisArg, args) => {
        recordProbe('webgl', 'readPixels() 1-bit LSB noise');
        const res = Reflect.apply(target, thisArg, args);
        const pixels = args[6];
        if (activeProfile.spoofWebglAdvanced && pixels && pixels.length > 3) {
          pixels[0] = (pixels[0] ^ 1) & 0xFF;
        }
        return res;
      });
    }

    if (targetWin.WebGLRenderingContext) patchGLContext(targetWin.WebGLRenderingContext.prototype);
    if (targetWin.WebGL2RenderingContext) patchGLContext(targetWin.WebGL2RenderingContext.prototype);

    // Font Availability & OS Alignment Spoofing
    if (targetWin.CanvasRenderingContext2D && targetWin.CanvasRenderingContext2D.prototype.measureText) {
      const origMeasureText = targetWin.CanvasRenderingContext2D.prototype.measureText;
      targetWin.CanvasRenderingContext2D.prototype.measureText = function () {
        const fontStr = (this.font || '').toLowerCase();
        const isWindowsProfile = (activeProfile.platformName || 'Windows').toLowerCase().includes('win');
        const disabledFonts = getDisabledFontsForProfile(activeProfile.id || activeProfile.name);

        let forceAbsent = false;
        let forcePresent = false;

        if (isWindowsProfile) {
          MAC_SIGNATURE_FONTS.forEach(macFont => {
            if (fontStr.includes(macFont)) forceAbsent = true;
          });
          disabledFonts.forEach(rareFont => {
            if (fontStr.includes(rareFont)) forceAbsent = true;
          });
          WIN_SIGNATURE_FONTS.forEach(winFont => {
            if (fontStr.includes(winFont)) forcePresent = true;
          });
        }

        if (forceAbsent) {
          recordProbe('fonts', `measureText("${this.font}") -> Suppressed (Mac/Rare Font)`);
          const savedFont = this.font;
          this.font = '72px sans-serif';
          const fallbackMetrics = origMeasureText.apply(this, arguments);
          this.font = savedFont;
          return fallbackMetrics;
        }

        const metrics = origMeasureText.apply(this, arguments);
        // forcePresent's +2.5 is deterministic (same font string -> same
        // offset), safe. The old "else" branch added fresh Math.random()
        // noise per call - text-fitting code that measures-until-it-fits
        // (binary-search font sizing, canvas label layout) never converges
        // once every measurement of the same text comes back different,
        // which is the same measure-until-stable crash risk fixed above for
        // getBoundingClientRect/getBBox. Real width otherwise.
        if (metrics && typeof metrics.width === 'number' && forcePresent) {
          recordProbe('fonts', `measureText("${this.font}") -> Spoofed Present`);
          Object.defineProperty(metrics, 'width', {
            value: metrics.width + 2.5,
            configurable: true,
            enumerable: true
          });
        }
        return metrics;
      };
      registerStealthFn(targetWin.CanvasRenderingContext2D.prototype.measureText, 'measureText');
    }

    // Canvas 2D Noise
    // toDataURL used to read the canvas, flip a pixel, and putImageData it
    // straight back onto the real canvas before encoding - a genuine,
    // persistent mutation of the canvas's own pixel buffer as a side effect
    // of "reading" it. Any detector that reads the canvas before and after
    // calling toDataURL() (a two-line check) catches that unconditionally,
    // no matter how deterministic the noise value is. toDataURL is now a
    // clean passthrough: it reflects the real rendered canvas, same as
    // getImageData does elsewhere, rather than self-outing as tampered.
    // getImageData's noise is safe to keep - it only perturbs the freshly
    // allocated return array, never writes back to the canvas, and the
    // transform is a pure function of the real pixel value (XOR 1) so
    // repeated reads of the same canvas stay internally consistent.
    if (targetWin.HTMLCanvasElement && targetWin.CanvasRenderingContext2D) {
      wrapNativeMethod(targetWin.HTMLCanvasElement.prototype, 'toDataURL', (target, thisArg, args) => {
        recordProbe('canvas', 'toDataURL()');
        return Reflect.apply(target, thisArg, args);
      });

      wrapNativeMethod(targetWin.CanvasRenderingContext2D.prototype, 'getImageData', (target, thisArg, args) => {
        recordProbe('canvas', 'getImageData() 1-bit pixel noise');
        const res = Reflect.apply(target, thisArg, args);
        if (res && res.data && res.data.length > 3) {
          res.data[0] = (res.data[0] ^ 1) & 0xFF;
        }
        return res;
      });
    }

    // AudioContext Micro-Noise & SampleRate Standardization
    if (targetWin.AudioContext || targetWin.webkitAudioContext) {
      const AudioCtxClass = targetWin.AudioContext || targetWin.webkitAudioContext;
      if (AudioCtxClass && AudioCtxClass.prototype) {
        overridePrototypeGetter(AudioCtxClass.prototype, 'sampleRate', () => 44100, 'audio', 'AudioContext.sampleRate');
      }
    }

    // getChannelData returns a live reference to the buffer's own backing
    // store (not a copy) - the same array on every call - and
    // getFloatFrequencyData writes into a caller-supplied array that's
    // typically reused every animation frame. Both used to add fresh
    // Math.random() noise via `+=` on every call: since it's the same
    // array, that *adds to whatever's already there* each time, and with a
    // deterministic (non-averaging) offset that's a monotonic drift, not a
    // one-off perturbation - repeated calls (60fps for an analyser) would
    // walk array[0] arbitrarily far from any real value within seconds. A
    // WeakSet makes the perturbation idempotent per array instance: applied
    // once, deterministically, never compounded.
    const perturbedAudioBuffers = new WeakSet();

    if (targetWin.AudioBuffer) {
      const origGetChannelData = targetWin.AudioBuffer.prototype.getChannelData;
      targetWin.AudioBuffer.prototype.getChannelData = function (channel) {
        recordProbe('audio', 'AudioBuffer.getChannelData() micro-noise');
        const data = origGetChannelData.apply(this, arguments);
        if (data && data.length > 0 && !perturbedAudioBuffers.has(data)) {
          perturbedAudioBuffers.add(data);
          data[0] += seededNoise('audio-channeldata', `${channel}-${data.length}`, 0.00000001);
        }
        return data;
      };
      registerStealthFn(targetWin.AudioBuffer.prototype.getChannelData, 'getChannelData');
    }

    if (targetWin.AnalyserNode) {
      const origGetFloatFreq = targetWin.AnalyserNode.prototype.getFloatFrequencyData;
      if (origGetFloatFreq) {
        targetWin.AnalyserNode.prototype.getFloatFrequencyData = function (array) {
          recordProbe('audio', 'AnalyserNode.getFloatFrequencyData() micro-noise');
          origGetFloatFreq.apply(this, arguments);
          if (array && array.length > 0 && !perturbedAudioBuffers.has(array)) {
            perturbedAudioBuffers.add(array);
            array[0] += seededNoise('audio-freqdata', `${array.length}`, 0.00001);
          }
        };
        registerStealthFn(targetWin.AnalyserNode.prototype.getFloatFrequencyData, 'getFloatFrequencyData');
      }
      const origGetByteFreq = targetWin.AnalyserNode.prototype.getByteFrequencyData;
      if (origGetByteFreq) {
        targetWin.AnalyserNode.prototype.getByteFrequencyData = function (array) {
          recordProbe('audio', 'AnalyserNode.getByteFrequencyData() 1-bit noise');
          origGetByteFreq.apply(this, arguments);
          if (array && array.length > 0) {
            array[0] = (array[0] ^ 1) & 0xFF;
          }
        };
        registerStealthFn(targetWin.AnalyserNode.prototype.getByteFrequencyData, 'getByteFrequencyData');
      }
    }
  }

  function applyProfile(profile) {
    if (!profile) return;
    activeProfile = profile;
    patchWindowContext(window);

    // Deep Synchronous iFrame Hooking (contentWindow getter & DOM insertion)
    try {
      if (window.HTMLIFrameElement) {
        const desc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');
        if (desc && desc.get) {
          const origContentWindowGet = desc.get;
          Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
            get: function () {
              const win = origContentWindowGet.apply(this, arguments);
              if (win) patchWindowContext(win);
              return win;
            },
            configurable: true,
            enumerable: true
          });
          registerStealthFn(desc.get, 'get contentWindow');
        }
      }
    } catch (e) {}

    try {
      if (window.Node && window.Node.prototype.appendChild) {
        const origAppendChild = window.Node.prototype.appendChild;
        window.Node.prototype.appendChild = function (child) {
          const res = origAppendChild.apply(this, arguments);
          if (child && child.tagName && child.tagName.toLowerCase() === 'iframe') {
            try {
              if (child.contentWindow) patchWindowContext(child.contentWindow);
            } catch (e) {}
          }
          return res;
        };
        registerStealthFn(window.Node.prototype.appendChild, 'appendChild');
      }
    } catch (e) {}

    try {
      if (window.Node && window.Node.prototype.insertBefore) {
        const origInsertBefore = window.Node.prototype.insertBefore;
        window.Node.prototype.insertBefore = function (newNode, referenceNode) {
          const res = origInsertBefore.apply(this, arguments);
          if (newNode && newNode.tagName && newNode.tagName.toLowerCase() === 'iframe') {
            try {
              if (newNode.contentWindow) patchWindowContext(newNode.contentWindow);
            } catch (e) {}
          }
          return res;
        };
        registerStealthFn(window.Node.prototype.insertBefore, 'insertBefore');
      }
    } catch (e) {}
  }

  // Initial patch
  patchWindowContext(window);

  window.addEventListener('__APPLY_SPOOF_PROFILE__', function (e) {
    if (e && e.detail) {
      try {
        const profile = typeof e.detail === 'string' ? JSON.parse(e.detail) : e.detail;
        applyProfile(profile);
      } catch (err) {}
    }
  });
})();
