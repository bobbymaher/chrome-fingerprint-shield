(function () {
  'use strict';

  console.log('%c[Fingerprint Shield v2.1.0]%c Stealth Suite (Worker Scope GL Sync, Prototype Integrity & Native Function Preservation) initialized', 'color: #38bdf8; font-weight: bold;', 'color: #9ca3af;');

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

        if (probeLogCounts[category] <= 25 || probeLogCounts[category] % 25 === 0) {
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

  // Native Function toString Preservation Registry
  const stealthFnMap = new WeakMap();
  if (typeof Function.prototype.toString === 'function') {
    const origToString = Function.prototype.toString;
    Function.prototype.toString = function () {
      if (stealthFnMap.has(this)) {
        return stealthFnMap.get(this);
      }
      return origToString.apply(this, arguments);
    };
  }

  function registerStealthFn(fn, name) {
    if (typeof fn === 'function' && name) {
      stealthFnMap.set(fn, `function ${name}() { [native code] }`);
    }
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
    spoofScreen: false
  };

  // Google Privacy Sandbox Topics API Randomizer
  if (typeof document !== 'undefined') {
    try {
      document.browsingTopics = function () {
        recordProbe('topics', 'document.browsingTopics() query');
        const t1 = 1 + Math.floor(Math.random() * 629);
        const t2 = 1 + Math.floor(Math.random() * 629);
        const t3 = 1 + Math.floor(Math.random() * 629);
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
        overrideGetter(navProto, 'deviceMemory', () => profile.deviceMemory || 4);
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

  function patchWindowContext(targetWin) {
    if (!targetWin) return;
    try {
      if (targetWin.__SHIELD_HOOKED__) return;
      targetWin.__SHIELD_HOOKED__ = true;
    } catch (e) { return; }

    // STEALTH PROTOTYPE-ONLY GETTER OVERRIDE (Never attaches own properties on navigator/screen)
    function overridePrototypeGetter(protoTarget, prop, getValueFn, category, detailLabel) {
      if (!protoTarget) return;
      try {
        const getterFn = function () {
          if (category) recordProbe(category, detailLabel || prop);
          return getValueFn();
        };
        registerStealthFn(getterFn, `get ${prop}`);
        Object.defineProperty(protoTarget, prop, {
          get: getterFn,
          configurable: true,
          enumerable: true
        });
      } catch (e) {}
    }

    // Disk Storage Quota API Standardization
    const nav = targetWin.navigator;
    const navProto = nav ? (Object.getPrototypeOf(nav) || targetWin.Navigator?.prototype) : null;

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

    // SVGRect Sub-Pixel Geometry Noise
    if (targetWin.SVGGraphicsElement && targetWin.SVGGraphicsElement.prototype.getBBox) {
      const origGetBBox = targetWin.SVGGraphicsElement.prototype.getBBox;
      targetWin.SVGGraphicsElement.prototype.getBBox = function () {
        const tag = this.tagName ? this.tagName.toLowerCase() : 'svg';
        recordProbe('svgrect', `getBBox() on <${tag}>`);
        const box = origGetBBox.apply(this, arguments);
        if (box && typeof box.width === 'number') {
          const noise = (Math.random() - 0.5) * 0.00001;
          return {
            x: box.x + noise,
            y: box.y + noise,
            width: box.width + noise,
            height: box.height + noise,
            top: box.top ? box.top + noise : box.y + noise,
            bottom: box.bottom ? box.bottom + noise : box.y + box.height + noise,
            left: box.left ? box.left + noise : box.x + noise,
            right: box.right ? box.right + noise : box.x + box.width + noise
          };
        }
        return box;
      };
      registerStealthFn(targetWin.SVGGraphicsElement.prototype.getBBox, 'getBBox');
    }

    if (targetWin.SVGTextContentElement) {
      if (targetWin.SVGTextContentElement.prototype.getComputedTextLength) {
        const origLength = targetWin.SVGTextContentElement.prototype.getComputedTextLength;
        targetWin.SVGTextContentElement.prototype.getComputedTextLength = function () {
          recordProbe('svgrect', 'getComputedTextLength()');
          const len = origLength.apply(this, arguments);
          return typeof len === 'number' ? len + (Math.random() - 0.5) * 0.00001 : len;
        };
        registerStealthFn(targetWin.SVGTextContentElement.prototype.getComputedTextLength, 'getComputedTextLength');
      }
      if (targetWin.SVGTextContentElement.prototype.getSubStringLength) {
        const origSubLength = targetWin.SVGTextContentElement.prototype.getSubStringLength;
        targetWin.SVGTextContentElement.prototype.getSubStringLength = function () {
          recordProbe('svgrect', 'getSubStringLength()');
          const len = origSubLength.apply(this, arguments);
          return typeof len === 'number' ? len + (Math.random() - 0.5) * 0.00001 : len;
        };
        registerStealthFn(targetWin.SVGTextContentElement.prototype.getSubStringLength, 'getSubStringLength');
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

    // Multi-Monitor & Screen Details API Masking (Prototype Only)
    if (targetWin.screen) {
      const scrProto = Object.getPrototypeOf(targetWin.screen) || targetWin.Screen?.prototype;
      overridePrototypeGetter(scrProto, 'isExtended', () => false, 'screen', 'screen.isExtended');
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

    // Gamepad, Bluetooth, WebHID & WebUSB API Neutering
    if (navProto) {
      if (navProto.getGamepads) {
        const mockGetGamepads = function () {
          recordProbe('peripherals', 'navigator.getGamepads()');
          return [null, null, null, null];
        };
        registerStealthFn(mockGetGamepads, 'getGamepads');
        overridePrototypeGetter(navProto, 'getGamepads', () => mockGetGamepads, 'peripherals', 'navigator.getGamepads');
      }

      if (navProto.bluetooth) {
        const mockBluetooth = {
          getAvailability: () => Promise.resolve(false),
          getDevices: () => Promise.resolve([]),
          requestDevice: () => Promise.reject(new DOMException("Bluetooth access disabled", "NotFoundError"))
        };
        overridePrototypeGetter(navProto, 'bluetooth', () => mockBluetooth, 'peripherals', 'navigator.bluetooth');
      }

      if (navProto.hid) {
        const mockHID = {
          getDevices: () => Promise.resolve([]),
          requestDevice: () => Promise.resolve([])
        };
        overridePrototypeGetter(navProto, 'hid', () => mockHID, 'peripherals', 'navigator.hid');
      }

      if (navProto.usb) {
        const mockUSB = {
          getDevices: () => Promise.resolve([]),
          requestDevice: () => Promise.reject(new DOMException("USB device access disabled", "NotFoundError"))
        };
        overridePrototypeGetter(navProto, 'usb', () => mockUSB, 'peripherals', 'navigator.usb');
      }
    }

    // Sub-Pixel DOMRect & getBoundingClientRect Noise
    if (targetWin.Element && targetWin.Element.prototype.getBoundingClientRect) {
      const origGetBCR = targetWin.Element.prototype.getBoundingClientRect;
      targetWin.Element.prototype.getBoundingClientRect = function () {
        const tag = this.tagName ? this.tagName.toLowerCase() : 'element';
        const cls = this.className && typeof this.className === 'string' ? '.' + this.className.trim().split(/\s+/).join('.') : '';
        recordProbe('domrect', `getBoundingClientRect() on <${tag}${cls}>`);
        const rect = origGetBCR.apply(this, arguments);
        if (rect && typeof rect.width === 'number') {
          const noise = (Math.random() - 0.5) * 0.00001;
          return new DOMRect(
            rect.x + noise,
            rect.y + noise,
            rect.width + noise,
            rect.height + noise
          );
        }
        return rect;
      };
      registerStealthFn(targetWin.Element.prototype.getBoundingClientRect, 'getBoundingClientRect');
    }

    if (targetWin.Range && targetWin.Range.prototype.getClientRects) {
      const origGetCRs = targetWin.Range.prototype.getClientRects;
      targetWin.Range.prototype.getClientRects = function () {
        recordProbe('domrect', 'Range.getClientRects()');
        const list = origGetCRs.apply(this, arguments);
        if (list && list.length > 0) {
          const noise = (Math.random() - 0.5) * 0.00001;
          return Array.from(list).map(rect => new DOMRect(
            rect.x + noise,
            rect.y + noise,
            rect.width + noise,
            rect.height + noise
          ));
        }
        return list;
      };
      registerStealthFn(targetWin.Range.prototype.getClientRects, 'getClientRects');
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

    if (targetWin.Worker) {
      const OrigWorker = targetWin.Worker;
      targetWin.Worker = function (scriptURL, options) {
        recordProbe('hardware', `new Worker("${scriptURL}")`);
        if (typeof scriptURL === 'string' && !scriptURL.startsWith('blob:')) {
          const shieldHeader = generateWorkerShieldCode(activeProfile);
          const wrapperCode = `${shieldHeader}\ntry { importScripts(${JSON.stringify(scriptURL)}); } catch(e) {}`;
          const blob = new Blob([wrapperCode], { type: 'application/javascript' });
          const blobURL = URL.createObjectURL(blob);
          return new OrigWorker(blobURL, options);
        }
        return new OrigWorker(scriptURL, options);
      };
      targetWin.Worker.prototype = OrigWorker.prototype;
      registerStealthFn(targetWin.Worker, 'Worker');
    }

    if (targetWin.SharedWorker) {
      const OrigSharedWorker = targetWin.SharedWorker;
      targetWin.SharedWorker = function (scriptURL, options) {
        recordProbe('hardware', `new SharedWorker("${scriptURL}")`);
        if (typeof scriptURL === 'string' && !scriptURL.startsWith('blob:')) {
          const shieldHeader = generateWorkerShieldCode(activeProfile);
          const wrapperCode = `${shieldHeader}\ntry { importScripts(${JSON.stringify(scriptURL)}); } catch(e) {}`;
          const blob = new Blob([wrapperCode], { type: 'application/javascript' });
          const blobURL = URL.createObjectURL(blob);
          return new OrigSharedWorker(blobURL, options);
        }
        return new OrigSharedWorker(scriptURL, options);
      };
      targetWin.SharedWorker.prototype = OrigSharedWorker.prototype;
      registerStealthFn(targetWin.SharedWorker, 'SharedWorker');
    }

    // ServiceWorker Registration Interception
    if (targetWin.ServiceWorkerContainer && targetWin.ServiceWorkerContainer.prototype.register) {
      const origRegister = targetWin.ServiceWorkerContainer.prototype.register;
      targetWin.ServiceWorkerContainer.prototype.register = function (scriptURL, options) {
        const urlStr = typeof scriptURL === 'string' ? scriptURL : (scriptURL && scriptURL.toString ? scriptURL.toString() : '');
        if (urlStr && !urlStr.startsWith('blob:')) {
          return fetch(urlStr)
            .then(res => res.text())
            .then(code => {
              const shieldHeader = generateWorkerShieldCode(activeProfile);
              const combined = shieldHeader + '\n' + code;
              const blob = new Blob([combined], { type: 'application/javascript' });
              const blobURL = URL.createObjectURL(blob);
              return origRegister.call(this, blobURL, options);
            })
            .catch(() => origRegister.call(this, scriptURL, options));
        }
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

    // Standard Navigator properties (PROTOTYPE ONLY - NO OWN PROPERTIES ON NAVIGATOR)
    overridePrototypeGetter(navProto, 'userAgent', () => activeProfile.userAgent, 'userAgent', 'navigator.userAgent');
    overridePrototypeGetter(navProto, 'appVersion', () => (activeProfile.userAgent || '').replace(/^Mozilla\//, ''), 'userAgent', 'navigator.appVersion');
    overridePrototypeGetter(navProto, 'platform', () => activeProfile.platform || 'Win32', 'userAgent', 'navigator.platform');
    overridePrototypeGetter(navProto, 'vendor', () => activeProfile.vendor || 'Google Inc.', 'userAgent', 'navigator.vendor');
    overridePrototypeGetter(navProto, 'oscpu', () => activeProfile.oscpu || 'Windows NT 10.0; Win64; x64', 'userAgent', 'navigator.oscpu');

    // Languages (PROTOTYPE ONLY)
    overridePrototypeGetter(navProto, 'language', () => 'en-US');
    overridePrototypeGetter(navProto, 'languages', () => Object.freeze(['en-US', 'en']));

    // Hardware specs (PROTOTYPE ONLY)
    overridePrototypeGetter(navProto, 'hardwareConcurrency', () => activeProfile.hardwareConcurrency || 4, 'hardware', 'hardwareConcurrency');
    overridePrototypeGetter(navProto, 'deviceMemory', () => activeProfile.deviceMemory || 4, 'hardware', 'deviceMemory');
    overridePrototypeGetter(navProto, 'maxTouchPoints', () => activeProfile.maxTouchPoints || 0, 'hardware', 'maxTouchPoints');

    // Client Hints - navigator.userAgentData (PROTOTYPE ONLY)
    if (navProto.userAgentData || (nav && nav.userAgentData)) {
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
    if (navProto.gpu || (nav && nav.gpu)) {
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
    if (navProto.getBattery || (nav && nav.getBattery)) {
      const mockBatteryManager = {
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1.0,
        addEventListener: function () {},
        removeEventListener: function () {},
        dispatchEvent: function () { return true; }
      };

      const mockGetBattery = function () {
        recordProbe('battery', 'navigator.getBattery()');
        return Promise.resolve(mockBatteryManager);
      };
      registerStealthFn(mockGetBattery, 'getBattery');

      overridePrototypeGetter(navProto, 'getBattery', () => mockGetBattery, 'battery', 'navigator.getBattery');
    }

    // Safe Screen Geometry Overrides (PROTOTYPE ONLY)
    if (targetWin.screen) {
      const scr = targetWin.screen;
      const scrProto = Object.getPrototypeOf(scr) || targetWin.Screen?.prototype;
      const nativeWidth = scr.width;
      const nativeHeight = scr.height;
      const origWidthGet = Object.getOwnPropertyDescriptor(scrProto, 'width')?.get;
      const origHeightGet = Object.getOwnPropertyDescriptor(scrProto, 'height')?.get;

      overridePrototypeGetter(scrProto, 'width', () => {
        if (activeProfile.spoofScreen) return 1920;
        return origWidthGet ? origWidthGet.call(scr) : nativeWidth;
      }, 'screen', 'screen.width');

      overridePrototypeGetter(scrProto, 'height', () => {
        if (activeProfile.spoofScreen) return 1080;
        return origHeightGet ? origHeightGet.call(scr) : nativeHeight;
      }, 'screen', 'screen.height');
    }

    // WebGL Context Prototype Patching (STRICT PROTOTYPE ONLY - NO INSTANCE OVERRIDES)
    function patchGLContext(contextProto) {
      if (!contextProto || !contextProto.getParameter) return;

      const originalGetParameter = contextProto.getParameter;
      contextProto.getParameter = function (pname) {
        const numPname = Number(pname);

        if (numPname === UNMASKED_VENDOR_WEBGL || pname === 'UNMASKED_VENDOR_WEBGL') {
          recordProbe('webgl', 'getParameter(UNMASKED_VENDOR_WEBGL)');
          return activeProfile.webglVendor || "Google Inc. (Intel)";
        }
        if (numPname === UNMASKED_RENDERER_WEBGL || pname === 'UNMASKED_RENDERER_WEBGL') {
          recordProbe('webgl', 'getParameter(UNMASKED_RENDERER_WEBGL)');
          return activeProfile.webglRenderer || "ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8681)";
        }
        if (activeProfile.spoofWebglAdvanced) {
          if (numPname === 3379) {
            recordProbe('webgl', 'getParameter(MAX_TEXTURE_SIZE)');
            return 16384;
          }
          if (numPname === 3386) {
            recordProbe('webgl', 'getParameter(MAX_VIEWPORT_DIMS)');
            return Int32Array.from([16384, 16384]);
          }
        }
        return originalGetParameter.apply(this, arguments);
      };
      registerStealthFn(contextProto.getParameter, 'getParameter');

      if (contextProto.getExtension) {
        const origGetExtension = contextProto.getExtension;
        contextProto.getExtension = function (name) {
          const ext = origGetExtension.apply(this, arguments);
          if (name === 'WEBGL_debug_renderer_info' || name === 'WEBGL_DEBUG_RENDERER_INFO') {
            recordProbe('webgl', `getExtension("${name}")`);
            return {
              UNMASKED_VENDOR_WEBGL: UNMASKED_VENDOR_WEBGL,
              UNMASKED_RENDERER_WEBGL: UNMASKED_RENDERER_WEBGL
            };
          }
          if (name === 'WEBGL_debug_shaders' && ext && ext.getTranslatedShaderSource) {
            const origGetShaderSource = ext.getTranslatedShaderSource;
            ext.getTranslatedShaderSource = function () {
              recordProbe('webgl', 'getTranslatedShaderSource() comment scrub');
              let src = origGetShaderSource.apply(this, arguments);
              if (typeof src === 'string') {
                src = src.replace(/Apple|M1|M2|M3|Max|Pro|Metal/gi, 'Intel');
              }
              return src;
            };
            registerStealthFn(ext.getTranslatedShaderSource, 'getTranslatedShaderSource');
          }
          return ext;
        };
        registerStealthFn(contextProto.getExtension, 'getExtension');
      }

      if (contextProto.getSupportedExtensions) {
        const origGetExt = contextProto.getSupportedExtensions;
        contextProto.getSupportedExtensions = function () {
          if (activeProfile.spoofWebglAdvanced) {
            recordProbe('webgl', 'getSupportedExtensions() D3D spoof');
            return WINDOWS_D3D_EXTENSIONS;
          }
          return origGetExt.apply(this, arguments);
        };
        registerStealthFn(contextProto.getSupportedExtensions, 'getSupportedExtensions');
      }

      if (contextProto.getShaderPrecisionFormat) {
        const origShaderPrec = contextProto.getShaderPrecisionFormat;
        contextProto.getShaderPrecisionFormat = function () {
          if (activeProfile.spoofWebglAdvanced) {
            recordProbe('webgl', 'getShaderPrecisionFormat()');
            return { rangeMin: 127, rangeMax: 127, precision: 23 };
          }
          return origShaderPrec.apply(this, arguments);
        };
        registerStealthFn(contextProto.getShaderPrecisionFormat, 'getShaderPrecisionFormat');
      }

      if (contextProto.readPixels) {
        const origReadPixels = contextProto.readPixels;
        contextProto.readPixels = function (x, y, w, h, format, type, pixels) {
          recordProbe('webgl', 'readPixels() 1-bit LSB noise');
          const res = origReadPixels.apply(this, arguments);
          if (activeProfile.spoofWebglAdvanced && pixels && pixels.length > 3) {
            pixels[0] = (pixels[0] ^ 1) & 0xFF;
          }
          return res;
        };
        registerStealthFn(contextProto.readPixels, 'readPixels');
      }
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
        if (metrics && typeof metrics.width === 'number') {
          let widthVal = metrics.width;
          if (forcePresent) {
            widthVal = metrics.width + 2.5;
            recordProbe('fonts', `measureText("${this.font}") -> Spoofed Present`);
          } else {
            const noise = (Math.random() - 0.5) * 0.01;
            widthVal = metrics.width + noise;
            recordProbe('fonts', `measureText("${this.font}") -> Sub-pixel Jittered`);
          }
          Object.defineProperty(metrics, 'width', {
            value: widthVal,
            configurable: true,
            enumerable: true
          });
        }
        return metrics;
      };
      registerStealthFn(targetWin.CanvasRenderingContext2D.prototype.measureText, 'measureText');
    }

    // Canvas 2D Noise
    if (targetWin.HTMLCanvasElement && targetWin.CanvasRenderingContext2D) {
      const origToDataURL = targetWin.HTMLCanvasElement.prototype.toDataURL;
      targetWin.HTMLCanvasElement.prototype.toDataURL = function () {
        recordProbe('canvas', 'toDataURL() 1-bit pixel noise');
        try {
          const ctx = this.getContext('2d');
          if (ctx && this.width > 2 && this.height > 2) {
            const imgData = ctx.getImageData(0, 0, 1, 1);
            imgData.data[0] = (imgData.data[0] ^ 1) & 0xFF;
            ctx.putImageData(imgData, 0, 0);
          }
        } catch (e) {}
        return origToDataURL.apply(this, arguments);
      };
      registerStealthFn(targetWin.HTMLCanvasElement.prototype.toDataURL, 'toDataURL');

      const origGetImageData = targetWin.CanvasRenderingContext2D.prototype.getImageData;
      targetWin.CanvasRenderingContext2D.prototype.getImageData = function (x, y, w, h) {
        recordProbe('canvas', 'getImageData() 1-bit pixel noise');
        const res = origGetImageData.apply(this, arguments);
        if (res && res.data && res.data.length > 3) {
          res.data[0] = (res.data[0] ^ 1) & 0xFF;
        }
        return res;
      };
      registerStealthFn(targetWin.CanvasRenderingContext2D.prototype.getImageData, 'getImageData');
    }

    // AudioContext Micro-Noise
    if (targetWin.AudioBuffer) {
      const origGetChannelData = targetWin.AudioBuffer.prototype.getChannelData;
      targetWin.AudioBuffer.prototype.getChannelData = function (channel) {
        recordProbe('audio', 'AudioBuffer.getChannelData() micro-noise');
        const data = origGetChannelData.apply(this, arguments);
        if (data && data.length > 0) {
          data[0] += (Math.random() - 0.5) * 0.00000001;
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
          if (array && array.length > 0) {
            array[0] += (Math.random() - 0.5) * 0.00001;
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

    // Brave Masking
    if (activeProfile.maskBrave) {
      try {
        delete nav.brave;
        if (navProto) delete navProto.brave;
      } catch (e) {
        overridePrototypeGetter(navProto, 'brave', () => undefined, 'brave', 'navigator.brave');
      }
    }
  }

  function applyProfile(profile) {
    if (!profile) return;
    activeProfile = profile;
    patchWindowContext(window);

    // Deep iFrame Hooking
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
      const origCreateElement = document.createElement;
      document.createElement = function (tagName, options) {
        const el = origCreateElement.apply(this, arguments);
        if (typeof tagName === 'string' && tagName.toLowerCase() === 'iframe') {
          el.addEventListener('load', function () {
            if (el.contentWindow) patchWindowContext(el.contentWindow);
          });
        }
        return el;
      };
      registerStealthFn(document.createElement, 'createElement');
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
