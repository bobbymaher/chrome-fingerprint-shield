# Header & Fingerprint Shield

![Header & Fingerprint Shield](fingerprint-shield.png)

Header & Fingerprint Shield is a browser extension built with Manifest V3 for Chromium-based browsers (Google Chrome, Brave, Microsoft Edge). It provides HTTP header customization, browser fingerprint protection, beacon blocking, and live DevTools console probe logging against fingerprinting engines like browserleaks.us, creepjs, and FingerprintJS.

---

## Key Features

### 1. Live DevTools Console Probe Logger

![Live DevTools Console Probe Logger](fingerprint-shield-console.png)

- Logs every script attempt to measure or query DOM element dimensions (`getBoundingClientRect`), fonts (`measureText`), WebGL shaders, WebGPU adapters, AudioContext buffers, Storage Quotas, or WebRTC offers directly into the browser DevTools Console.
- Color-coded badges with category tags, target details, and inspectable JSON payload objects.
- Toggleable: **Config → Verbose Console Logging** (on by default).

### 2. Profile Switching & Dynamic Headers
Two independent rotation settings (Config tab), each with the same four options - **Sticky**, **Daily**, **Hourly**, **Insane** (reseeds every second):
- **Primary Site Rotation**: the identity the site you're actually visiting sees. Sticky (default) assigns one profile per top-level domain forever, preserving logins/cookies.
- **Third-Party Rotation**: the identity ad networks, CDNs, and trackers embedded on the page see, resolved independently per third-party frame (each keyed to its own hostname, not shared) - defaults to Daily.
- Applies at both layers: `declarativeNetRequest` HTTP headers (`User-Agent`, `Sec-CH-UA`, `Sec-CH-UA-Mobile`, `Sec-CH-UA-Platform`) and in-page JS overrides (`navigator.*`, canvas, WebGL) for the same resolved identity. The header layer can't vary per visited domain the way in-page JS can - `declarativeNetRequest` rules are static URL-pattern matches, not computed per request - so "Primary"/"Third-Party" there means one rule for all first-party requests and one for all third-party requests, not per-site.
- Anything faster than Daily WILL break logged-in sessions, live WebSockets, and trigger login/CAPTCHA challenges on sites that check for a consistent fingerprint - the popup warns before you enable Insane mode on either setting.
- All rotation is **deterministic**, not `Math.random()`: seeded from `hostname + calendar day` (or hour/second for faster settings). Same inputs give the same pick within a session/bucket - avoids both a fingerprinting tell (real hardware doesn't change every call) and, in a few places, actual crashes (see Noise section below).

### 3. Per-Site Exclusion
- **Config → Excluded Sites**: hard-excludes a domain from the shield entirely - the content scripts never inject there at all, rather than injecting and trying to behave normally. Use this for sites that break under spoofing (bank logins, sites that bind sessions to a fingerprint).
- "Exclude Current Site" button uses the active tab's hostname; domains can also be added/removed manually.
- Implemented via `chrome.scripting.registerContentScripts()` with a dynamic `excludeMatches` list, not the static `manifest.json` `content_scripts` block - the manifest declares no content scripts at all; they're registered at runtime by `background.js` on install, browser startup, and whenever the exclude list changes.

### 4. URL Tracking Parameter Stripper (`Clean URLs`) & Referer Trimming
- **Network Level**: DeclarativeNetRequest redirect rule automatically removes tracking query parameters (`utm_source`, `utm_medium`, `utm_campaign`, `fbclid`, `gclid`, `msclkid`, `twclid`, `igshid`, `yclid`, `mc_eid`, `_ga`, `_hsenc`) on outbound navigation requests.
- **DOM Level**: `history.replaceState` removes tracking query parameters from the address bar upon page load.
- **Cross-Site Referer Trimming**: Removes `Referer` headers on third-party sub-resource requests (`domainType: "thirdParty"`).

### 5. Comprehensive Beacon Suite (sendBeacon, fetch keepalive, ping, pixels & iframes)
- **`navigator.sendBeacon`**: Returns `true` to trick fingerprinters while transmitting zero bytes over the network (toggleable for same-origin vs 3rd-party).
- **`fetch` keepalive**: Mutes `fetch(url, { keepalive: true })` tracking payloads.
- **HTML `<a ping="...">`**: Strips anchor `ping` tracking attributes.
- **Micro Images & iFrames**: Filters 1x1 tracking pixels and hidden micro-iframes.

### 6. Navigator & Client Hints Spoofing
- Modifies JavaScript navigator properties: `userAgent`, `appVersion`, `platform`, `vendor`, `hardwareConcurrency`, `deviceMemory`, `maxTouchPoints`, and `storage.estimate()` disk quota.
- Supports Sec-CH-UA Client Hints via `navigator.userAgentData` and `navigator.userAgentData.getHighEntropyValues()`.
- Every override goes through a `Proxy`-based wrapper around the *real* native function/getter rather than a plain replacement function. This matters for detection resistance: `Function.prototype.toString` transparently unwraps through a Proxy to its target's own `"[native code]"` output (holding even against a pristine `toString` reference grabbed from an untouched iframe), a Proxy carries none of the extra own-properties a plain `function(){}` replacement does (the classic `getParameter has extra own props: prototype` tell), and for accessor properties, calling the real getter first before substituting the return value gets genuine native illegal-invocation branding for free instead of an approximation.
- `navigator.getBattery` and `navigator.getGamepads` are real *methods* (data properties) on `Navigator.prototype`, not accessors - they're installed via a direct-value Proxy wrap, not the getter-based override used for actual accessor properties, so `Object.getOwnPropertyDescriptor` shows `.value` like a real browser instead of `.get`.
- `navigator.oscpu` isn't added at all - it doesn't exist on real Chrome (Firefox-only), so exposing it was itself a tell. `navigator.brave` is only masked if it's actually present (i.e. the real browser is Brave) - otherwise the mask would manufacture the property on vanilla Chrome, where it should never exist.

### 7. WebGL & WebGPU Shield
- Spoofs WebGL vendor and renderer strings (`WEBGL_debug_renderer_info`), consistent with the active profile's claimed GPU.
- Overrides WebGPU `navigator.gpu` (`requestAdapter` / `requestAdapterInfo`).
- Scrubs hardware comments from `WEBGL_debug_shaders`.
- Advanced WebGL Shield: spoofs Windows D3D extension lists, a ~20-parameter `getParameter` table (texture/renderbuffer/attribute/uniform/sample limits etc, not just vendor/renderer), and a full 12-combination shader precision matrix (`HIGH`/`MEDIUM`/`LOW` × `FLOAT`/`INT` × vertex/fragment), all matched to one of five GPU capability tiers (Intel iGPU, NVIDIA discrete, AMD discrete, Apple Silicon, Mesa/Linux) selected by the active profile's renderer string.
- `readPixels()` and canvas `getImageData()` apply a fixed, deterministic 1-bit LSB flip - not a fresh random value per call - since real GPU/canvas output is deterministic for the same draw, and a detector that reads twice and compares (a real, common check) would otherwise catch fresh-per-call noise as tampering. Canvas `toDataURL()` is a clean passthrough; it used to read-modify-write the live canvas via `putImageData` as a side effect of "reading" it, which is an unconditional tell for any before/after pixel-diff check.

### 8. Web Worker & ServiceWorker Handling
- **Config → Shield Web Workers** (on by default): when enabled, `Worker`/`SharedWorker` scripts are wrapped through a `blob:` URL that injects the fingerprint shield before the real code runs. This is opt-out, not always-on, because it has a real cost: a `blob:` URL has no resolvable path, so if the real worker script does any further relative-path resource loading of its own (a nested worker, a dynamic import, a wasm fetch - common in bundled crypto/proxy workers), that resolution can silently break. This broke Telegram's MTProto worker before the toggle existed; disable it per-install if a site's workers fail to load.
- `ServiceWorker.register()` is always a passthrough - the spec requires an `http`/`https` scriptURL, so a `blob:`-wrapped registration always throws `SecurityError`. Shielding it that way is a dead end regardless of the toggle.
- Content scripts inject into every frame (`allFrames: true` on the dynamic registration), so same-origin iframes get independently shielded without needing to intercept `contentWindow` access - but dedicated/shared worker *threads* are a separate JS realm content scripts can't reach at all except via the blob-wrap trick above.

### 9. Noise Determinism (crash prevention)
Several APIs used to add a fresh `Math.random()` value on every call: `getBoundingClientRect`, `Range.getClientRects`, SVG `getBBox`/`getComputedTextLength`/`getSubStringLength`, and canvas `measureText`'s sub-pixel jitter. Any real code that measures repeatedly and waits for two reads to agree - which is extremely common in layout/chart libraries (ResizeObserver-driven redraw loops, binary-search font-size fitting) - would never see two equal reads and loop forever, hammering these hot APIs tens of thousands of times a second until the tab locked up or crashed. All of these are now clean passthroughs. Where noise is still applied (audio `getChannelData`/`getFloatFrequencyData`, the Topics API), it's derived from a seeded PRNG (`hostname + calendar day + channel`) instead of raw randomness, and applied idempotently (a `WeakSet` per buffer/array) where the underlying API mutates the same reused object on every call, to avoid unbounded drift from repeatedly adding a fixed offset.

### 10. Smart / Generative Identity Pool
- The real Chromium major version is read from the extension's own (unspoofed) `navigator.userAgent` in the background service worker and used to build every emulated Chrome/Edge/Opera UA string - checked on every install *and* every browser startup, so the emulated browser version never goes stale even between extension updates.
- Beyond the 5 hand-curated profiles, a pool of ~44 profiles is generated by combining OS × browser-skin × GPU × hardware pools (all internally consistent by construction). A small fixed pool of identities is itself a weak anonymity set - a tracker correlating a user across sites via other stable signals would notice the same handful of fake identities cycling, which is a distinctive "uses this extension" signature in its own right.
- A **consistency guardrail** in the profile editor (Edit/Add tab) warns - non-blocking - if a custom profile pairs contradictory fields (Intel vendor with an NVIDIA renderer string, a D3D/ANGLE-Windows renderer on a macOS platform, a Windows platform with a non-Windows User-Agent, etc).
- Includes a "MacBook Pro 13\" 2015 (Intel Iris 6100, 8GB RAM)" profile. macOS profiles are only self-consistent when actually run on a real Mac - installed-font fingerprinting (measuring real rendered glyph widths, not just `document.fonts`) is a rendering-engine-level signal no JS override can patch, so spoofing macOS from a different real OS will always leak through that channel.

### 11. Same-Offset Timezone Anonymizer
- Intercepts `Intl.DateTimeFormat.prototype.resolvedOptions`.
- Maps the real timezone to an equivalent same-offset IANA timezone (for example, mapping `Europe/Athens` to `Europe/Helsinki`).
- Anonymizes exact city location while maintaining zero offset difference to prevent a timezone/offset mismatch.

### 12. Google Privacy Sandbox Topics API Randomizer
- Overrides `document.browsingTopics()` to return 3 topics from the Google 629-topic taxonomy, deterministic per domain per day (matching how the real API is actually stable per epoch, not fresh-random on every call).

### 13. Multi-Monitor, Screen Details & Peripheral Neutering
- Forces `screen.isExtended = false` and overrides `getScreenDetails()` to hide multi-monitor configurations.
- Stubs WebBluetooth, WebHID, and WebUSB to reject unauthorized hardware enumeration.

---

## Installation

1. Open Chrome or Brave and navigate to `chrome://extensions` or `brave://extensions`.
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the directory containing this repository.

After pulling changes, use the **Reload** button on the extension card - some changes (profile storage merge, content script registration) only take effect on the next `onInstalled`/`onStartup` event, and open tabs need a refresh to pick up a changed exclude list.

---

## File Structure

- `manifest.json`: Extension manifest defining permissions and the background service worker. Content scripts are *not* declared here - see below.
- `background.js`: Service worker managing `declarativeNetRequest` header rules, dynamic content script registration (`chrome.scripting.registerContentScripts`, for per-site exclusion), profile storage seeding/merging, and probe statistics.
- `content_isolated.js`: Content script executing in the ISOLATED world. Selects which profile applies (sticky, rotating, or random depending on settings) and bridges it to the MAIN world via a `CustomEvent`, since `content_inject.js` can't reach `chrome.storage` directly.
- `content_inject.js`: Content script executing in the MAIN world. Contains all the DOM/JS API overrides - navigator, canvas, WebGL, audio, fonts, workers, etc.
- `profiles.js`: OS/browser/GPU/hardware pools and the builder that combines them into full profile objects (curated + generated), parametrized by the real running Chromium version.
- `popup/`: Popup UI (profiles list/editor, global config, excluded sites, live preview, probe activity monitor).

---

## License

MIT License.
