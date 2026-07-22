document.addEventListener('DOMContentLoaded', () => {
  let state = {
    profiles: {},
    activeProfile: 'cheap_win10_edge',
    isEnabled: true,
    autoMode: 'PER_SITE_3RD_RANDOM'
  };

  // DOM Elements
  const enableToggle = document.getElementById('enableToggle');
  const autoModeSelect = document.getElementById('autoModeSelect');
  const configSpoofWebglAdvanced = document.getElementById('configSpoofWebglAdvanced');
  const configBlockBeacons = document.getElementById('configBlockBeacons');
  const configSpoofScreen = document.getElementById('configSpoofScreen');
  const configMaskBrave = document.getElementById('configMaskBrave');

  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const profilesList = document.getElementById('profilesList');
  const httpHeadersPreview = document.getElementById('httpHeadersPreview');
  const jsNavigatorPreview = document.getElementById('jsNavigatorPreview');
  const fpjsShieldPreview = document.getElementById('fpjsShieldPreview');
  const previewStatusBadge = document.getElementById('previewStatusBadge');
  const btnNewProfile = document.getElementById('btnNewProfile');
  const btnResetDefaults = document.getElementById('btnResetDefaults');
  const btnCancelEdit = document.getElementById('btnCancelEdit');

  // Probe Monitor Elements
  const probeDomainText = document.getElementById('probeDomainText');
  const probeTotalBadge = document.getElementById('probeTotalBadge');
  const probeGridList = document.getElementById('probeGridList');

  // Form Elements
  const profileForm = document.getElementById('profileForm');
  const editorTitle = document.getElementById('editorTitle');
  const editProfileId = document.getElementById('editProfileId');
  const editName = document.getElementById('editName');
  const editDescription = document.getElementById('editDescription');
  const editUserAgent = document.getElementById('editUserAgent');
  const editPlatform = document.getElementById('editPlatform');
  const editPlatformName = document.getElementById('editPlatformName');
  const editPlatformVersion = document.getElementById('editPlatformVersion');
  const editVendor = document.getElementById('editVendor');
  const editCores = document.getElementById('editCores');
  const editMemory = document.getElementById('editMemory');
  const editWebglVendor = document.getElementById('editWebglVendor');
  const editWebglRenderer = document.getElementById('editWebglRenderer');
  const editSpoofWebglAdvanced = document.getElementById('editSpoofWebglAdvanced');
  const editMaskBrave = document.getElementById('editMaskBrave');
  const editBlockBeacons = document.getElementById('editBlockBeacons');
  const editSpoofScreen = document.getElementById('editSpoofScreen');

  function loadState() {
    chrome.storage.local.get(['profiles', 'activeProfile', 'isEnabled', 'autoMode'], (data) => {
      state.profiles = data.profiles || globalThis.DEFAULT_PROFILES || {};
      state.activeProfile = data.activeProfile || 'cheap_win10_edge';
      state.isEnabled = data.isEnabled !== undefined ? data.isEnabled : true;
      state.autoMode = data.autoMode || 'PER_SITE_3RD_RANDOM';

      enableToggle.checked = state.isEnabled;
      autoModeSelect.value = state.autoMode;

      const activeP = state.profiles[state.activeProfile] || {};
      configSpoofWebglAdvanced.checked = activeP.spoofWebglAdvanced !== undefined ? activeP.spoofWebglAdvanced : true;
      configBlockBeacons.checked = activeP.blockBeacons !== undefined ? activeP.blockBeacons : true;
      configSpoofScreen.checked = activeP.spoofScreen !== undefined ? activeP.spoofScreen : false;
      configMaskBrave.checked = activeP.maskBrave !== undefined ? activeP.maskBrave : true;

      renderProfiles();
      renderPreview();
      fetchProbeStats();
    });
  }

  function fetchProbeStats() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        const activeTab = tabs[0];
        try {
          const url = new URL(activeTab.url);
          probeDomainText.textContent = url.hostname || activeTab.url;
        } catch (e) {
          probeDomainText.textContent = activeTab.url || 'Active Tab';
        }

        chrome.runtime.sendMessage({ type: 'GET_TAB_PROBE_STATS', tabId: activeTab.id }, (response) => {
          if (response && response.stats) {
            renderProbeStats(response.stats);
          } else {
            renderProbeStats({ userAgent: 0, plugins: 0, hardware: 0, userAgentData: 0, webgl: 0, canvas: 0, audio: 0, screen: 0, brave: 0, battery: 0, fonts: 0, total: 0 });
          }
        });
      }
    });
  }

  function renderProbeStats(stats) {
    probeTotalBadge.textContent = `${stats.total || 0} Probes`;

    const categoryMap = [
      { key: 'userAgent', label: 'User-Agent / OS', icon: '👤' },
      { key: 'userAgentData', label: 'Client Hints', icon: '🏷️' },
      { key: 'fonts', label: 'Font Availability', icon: '🔤' },
      { key: 'canvas', label: 'Canvas 2D Render', icon: '🎨' },
      { key: 'webgl', label: 'WebGL GPU String', icon: '🎮' },
      { key: 'hardware', label: 'Hardware Cores/RAM', icon: '💻' },
      { key: 'battery', label: 'Battery Status API', icon: '🔋' },
      { key: 'plugins', label: 'Plugins Array', icon: '🔌' }
    ];

    probeGridList.innerHTML = '';
    categoryMap.forEach(item => {
      const count = stats[item.key] || 0;
      const el = document.createElement('div');
      el.className = 'probe-item';
      el.innerHTML = `
        <span class="probe-item-label">${item.icon} ${item.label}</span>
        <span class="probe-item-count">${count}</span>
      `;
      probeGridList.appendChild(el);
    });
  }

  function saveState(callback) {
    chrome.storage.local.set({
      profiles: state.profiles,
      activeProfile: state.activeProfile,
      isEnabled: state.isEnabled,
      autoMode: state.autoMode
    }, () => {
      chrome.runtime.sendMessage({ type: 'SYNC_STATE' }, () => {
        renderProfiles();
        renderPreview();
        if (callback) callback();
      });
    });
  }

  function switchTab(tabId) {
    navBtns.forEach(btn => {
      if (btn.dataset.tab === tabId) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    tabContents.forEach(content => {
      if (content.id === tabId) content.classList.add('active');
      else content.classList.remove('active');
    });
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  enableToggle.addEventListener('change', (e) => {
    state.isEnabled = e.target.checked;
    saveState();
  });

  autoModeSelect.addEventListener('change', (e) => {
    state.autoMode = e.target.value;
    saveState();
  });

  configSpoofWebglAdvanced.addEventListener('change', (e) => {
    if (state.profiles[state.activeProfile]) {
      state.profiles[state.activeProfile].spoofWebglAdvanced = e.target.checked;
      saveState();
    }
  });

  configBlockBeacons.addEventListener('change', (e) => {
    if (state.profiles[state.activeProfile]) {
      state.profiles[state.activeProfile].blockBeacons = e.target.checked;
      saveState();
    }
  });

  configSpoofScreen.addEventListener('change', (e) => {
    if (state.profiles[state.activeProfile]) {
      state.profiles[state.activeProfile].spoofScreen = e.target.checked;
      saveState();
    }
  });

  configMaskBrave.addEventListener('change', (e) => {
    if (state.profiles[state.activeProfile]) {
      state.profiles[state.activeProfile].maskBrave = e.target.checked;
      saveState();
    }
  });

  function renderProfiles() {
    profilesList.innerHTML = '';

    Object.keys(state.profiles).forEach(id => {
      const p = state.profiles[id];
      const isActive = (id === state.activeProfile);

      const card = document.createElement('div');
      card.className = `profile-card ${isActive ? 'active-profile' : ''}`;
      
      card.innerHTML = `
        <div class="profile-card-header">
          <span class="profile-name">${escapeHtml(p.name)}</span>
          <div>
            ${isActive ? '<span class="badge badge-active">ACTIVE</span>' : ''}
            ${p.custom ? '<span class="badge badge-custom">CUSTOM</span>' : ''}
          </div>
        </div>
        <div class="profile-desc">${escapeHtml(p.description || '')}</div>
        <div class="profile-meta">
          <span class="meta-tag">${escapeHtml(p.platformName || 'Windows')}</span>
          <span class="meta-tag">${escapeHtml(p.platform || 'Win32')}</span>
          <span class="meta-tag">${p.hardwareConcurrency || 4} CPU Cores</span>
          <span class="meta-tag">Advanced WebGL: ${p.spoofWebglAdvanced ? 'ON' : 'OFF'}</span>
          <span class="meta-tag">Beacons Blocker: ${p.blockBeacons ? 'ON' : 'OFF'}</span>
        </div>
        <div class="profile-actions">
          <button class="btn btn-secondary btn-sm btn-select" data-id="${id}">
            ${isActive ? 'Selected' : 'Use Profile'}
          </button>
          <button class="btn btn-secondary btn-sm btn-edit" data-id="${id}">Edit</button>
          <button class="btn btn-secondary btn-sm btn-duplicate" data-id="${id}">Duplicate</button>
          ${p.custom ? `<button class="btn btn-danger btn-sm btn-delete" data-id="${id}">Delete</button>` : ''}
        </div>
      `;

      card.querySelector('.btn-select').addEventListener('click', (e) => {
        e.stopPropagation();
        state.activeProfile = id;
        loadState();
        saveState();
      });

      card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditor(id);
      });

      card.querySelector('.btn-duplicate').addEventListener('click', (e) => {
        e.stopPropagation();
        duplicateProfile(id);
      });

      if (p.custom) {
        card.querySelector('.btn-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          deleteProfile(id);
        });
      }

      profilesList.appendChild(card);
    });
  }

  function renderPreview() {
    const active = state.profiles[state.activeProfile];
    if (!active) return;

    if (state.isEnabled) {
      previewStatusBadge.textContent = state.autoMode !== 'OFF' ? `ACTIVE (${state.autoMode})` : 'ACTIVE';
      previewStatusBadge.className = 'status-badge active-status-badge';
    } else {
      previewStatusBadge.textContent = 'DISABLED';
      previewStatusBadge.className = 'status-badge disabled-status-badge';
    }

    const brandsStr = (active.brands || []).map(b => `"${b.brand}";v="${b.version}"`).join(', ');
    const headersText = [
      `User-Agent: ${active.userAgent}`,
      `Sec-Ch-Ua: ${brandsStr}`,
      `Sec-Ch-Ua-Mobile: ?0`,
      `Sec-Ch-Ua-Platform: "${active.platformName || 'Windows'}"`,
      `Sec-Ch-Ua-Platform-Version: "${active.platformVersion || '10.0.0'}"`,
      `Sec-Ch-Ua-Arch: "${active.architecture || 'x86'}"`,
      `Sec-Ch-Ua-Bitness: "${active.bitness || '64'}"`
    ].join('\n');

    httpHeadersPreview.textContent = headersText;

    const navText = [
      `navigator.userAgent = "${active.userAgent}"`,
      `navigator.platform = "${active.platform}"`,
      `navigator.vendor = "${active.vendor}"`,
      `navigator.hardwareConcurrency = ${active.hardwareConcurrency}`,
      `navigator.deviceMemory = ${active.deviceMemory}`,
      `navigator.getBattery() = Spoofed AC Desktop (level: 1.0, charging: true)`,
      `navigator.maxTouchPoints = ${active.maxTouchPoints}`,
      `navigator.userAgentData.platform = "${active.platformName}"`,
      `navigator.userAgentData.getHighEntropyValues() ->`,
      `  platformVersion: "${active.platformVersion}"`,
      `  architecture: "${active.architecture}"`,
      `  bitness: "${active.bitness}"`,
      `WebGL UNMASKED_VENDOR = "${active.webglVendor}"`,
      `WebGL UNMASKED_RENDERER = "${active.webglRenderer}"`,
      `Advanced WebGL Shield = ${active.spoofWebglAdvanced ? 'ENABLED' : 'DISABLED'}`,
      `Mask Brave API = ${active.maskBrave ? 'ENABLED' : 'DISABLED'}`,
      `Micro Beacons Blocker = ${active.blockBeacons ? 'ENABLED' : 'DISABLED'}`
    ].join('\n');

    jsNavigatorPreview.textContent = navText;

    const fpjsText = [
      `[+] Font Availability Shield: ACTIVE (Commonly UNUSED fonts randomly reported NOT installed)`,
      `[+] Battery Status API Shield: ACTIVE (Spoofed plugged-in desktop AC power: 100%, charging)`,
      `[+] Anti-Font Measurement Noise: ACTIVE (+/- 0.005px jitter on Canvas measureText)`,
      `[+] 3rd-Party Domain Header Randomization: ACTIVE (CDNs & trackers receive randomized headers)`,
      `[+] Advanced WebGL Shield: ${active.spoofWebglAdvanced ? 'ACTIVE (Windows D3D Extensions, Shader Precision & 3D Noise)' : 'DISABLED'}`,
      `[+] Canvas 2D Noise Perturbation: ACTIVE (1-bit LSB shift on getImageData & toDataURL)`,
      `[+] WebAudio Noise Injection: ACTIVE (1e-8 float jitter on getChannelData)`,
      `[+] Micro Tracking Beacons Blocker: ${active.blockBeacons ? 'ACTIVE (Blocking <=4px images & <=30px tracking iframes)' : 'DISABLED'}`,
      `[+] Screen Geometry Override: ${active.spoofScreen ? 'ACTIVE (1920x1080)' : 'DISABLED (Native Layout Preserved)'}`,
      `[+] Language & Locale Masking: en-US, ["en-US", "en"]`,
      `[+] Plugins & MimeTypes: Windows Standard PDF Viewer Array`,
      `[+] Profile Switching Strategy: ${state.autoMode}`
    ].join('\n');

    fpjsShieldPreview.textContent = fpjsText;
  }

  function openEditor(profileId) {
    const p = state.profiles[profileId] || {};
    editorTitle.textContent = profileId ? 'Edit Profile' : 'New Custom Profile';
    editProfileId.value = profileId || '';

    editName.value = p.name || '';
    editDescription.value = p.description || '';
    editUserAgent.value = p.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0';
    editPlatform.value = p.platform || 'Win32';
    editPlatformName.value = p.platformName || 'Windows';
    editPlatformVersion.value = p.platformVersion || '10.0.0';
    editVendor.value = p.vendor || 'Google Inc.';
    editCores.value = p.hardwareConcurrency || 4;
    editMemory.value = p.deviceMemory || 4;
    editWebglVendor.value = p.webglVendor || 'Google Inc. (Intel)';
    editWebglRenderer.value = p.webglRenderer || 'ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8681)';
    editSpoofWebglAdvanced.checked = p.spoofWebglAdvanced !== undefined ? p.spoofWebglAdvanced : true;
    editMaskBrave.checked = p.maskBrave !== undefined ? p.maskBrave : true;
    editBlockBeacons.checked = p.blockBeacons !== undefined ? p.blockBeacons : true;
    editSpoofScreen.checked = p.spoofScreen !== undefined ? p.spoofScreen : false;

    switchTab('tab-editor');
  }

  btnNewProfile.addEventListener('click', () => openEditor(''));
  btnCancelEdit.addEventListener('click', () => switchTab('tab-profiles'));

  function duplicateProfile(profileId) {
    const orig = state.profiles[profileId];
    if (!orig) return;

    const newId = 'custom_' + Date.now();
    const dup = JSON.parse(JSON.stringify(orig));
    dup.id = newId;
    dup.name = `${orig.name} (Copy)`;
    dup.custom = true;

    state.profiles[newId] = dup;
    state.activeProfile = newId;
    saveState(() => switchTab('tab-profiles'));
  }

  function deleteProfile(profileId) {
    if (!state.profiles[profileId] || !state.profiles[profileId].custom) return;

    delete state.profiles[profileId];
    if (state.activeProfile === profileId) {
      state.activeProfile = 'cheap_win10_edge';
    }

    saveState();
  }

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let id = editProfileId.value;
    const isNew = !id;
    if (isNew) id = 'custom_' + Date.now();

    const ua = editUserAgent.value;
    let brands = [
      { brand: "Not:A-Brand", version: "24" },
      { brand: "Chromium", version: "150" }
    ];
    let fullVersions = [
      { brand: "Not:A-Brand", version: "24.0.0.0" },
      { brand: "Chromium", version: "150.0.7100.25" }
    ];

    if (ua.includes('Edg/')) {
      brands.push({ brand: "Microsoft Edge", version: "150" });
      fullVersions.push({ brand: "Microsoft Edge", version: "150.0.3200.12" });
    } else {
      brands.push({ brand: "Google Chrome", version: "150" });
      fullVersions.push({ brand: "Google Chrome", version: "150.0.7100.25" });
    }

    const updatedProfile = {
      id: id,
      name: editName.value,
      description: editDescription.value,
      userAgent: editUserAgent.value,
      platform: editPlatform.value,
      platformName: editPlatformName.value,
      platformVersion: editPlatformVersion.value,
      architecture: 'x86',
      bitness: '64',
      model: '',
      vendor: editVendor.value,
      oscpu: `${editPlatformName.value} NT 10.0; Win64; x64`,
      brands: brands,
      fullVersionList: fullVersions,
      hardwareConcurrency: parseInt(editCores.value, 10) || 4,
      deviceMemory: parseInt(editMemory.value, 10) || 4,
      maxTouchPoints: 0,
      webglVendor: editWebglVendor.value,
      webglRenderer: editWebglRenderer.value,
      spoofWebglAdvanced: editSpoofWebglAdvanced.checked,
      maskBrave: editMaskBrave.checked,
      blockBeacons: editBlockBeacons.checked,
      spoofScreen: editSpoofScreen.checked,
      custom: true
    };

    state.profiles[id] = updatedProfile;
    state.activeProfile = id;

    saveState(() => switchTab('tab-profiles'));
  });

  btnResetDefaults.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Reset all profiles back to default settings?')) {
      state.profiles = globalThis.DEFAULT_PROFILES;
      state.activeProfile = 'cheap_win10_edge';
      state.isEnabled = true;
      state.autoMode = 'PER_SITE_3RD_RANDOM';
      chrome.storage.local.set({ domainProfileMap: {} }, () => {
        saveState();
      });
    }
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  loadState();
});
