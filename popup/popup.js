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

        chrome.runtime.sendMessage({ type: '__GET_TAB_PROBE_STATS__', tabId: activeTab.id }, (response) => {
          if (response && response.stats) {
            renderProbeStats(response.stats);
          } else {
            renderProbeStats({
              userAgent: 0, userAgentData: 0, fonts: 0, canvas: 0, webgl: 0,
              hardware: 0, battery: 0, timezone: 0, speech: 0, topics: 0,
              domrect: 0, svgrect: 0, webrtc: 0, peripherals: 0, storage: 0,
              beacons: 0, plugins: 0, total: 0
            });
          }
        });
      }
    });
  }

  function renderProbeStats(stats) {
    probeTotalBadge.textContent = `${stats.total || 0} Probes Intercepted`;

    const categoryMap = [
      { key: 'userAgent', label: 'User-Agent / OS', icon: '👤' },
      { key: 'userAgentData', label: 'Client Hints', icon: '🏷️' },
      { key: 'fonts', label: 'Font Availability', icon: '🔤' },
      { key: 'canvas', label: 'Canvas 2D Noise', icon: '🎨' },
      { key: 'webgl', label: 'WebGL & WebGPU', icon: '🎮' },
      { key: 'hardware', label: 'Hardware Cores/RAM', icon: '💻' },
      { key: 'battery', label: 'Battery Status API', icon: '🔋' },
      { key: 'timezone', label: 'Timezone Anonymizer', icon: '🌐' },
      { key: 'speech', label: 'Speech Voices', icon: '🗣️' },
      { key: 'topics', label: 'Topics API Shield', icon: '🎯' },
      { key: 'domrect', label: 'Sub-Pixel DOMRect', icon: '📐' },
      { key: 'svgrect', label: 'SVGRect Geometry', icon: '📊' },
      { key: 'webrtc', label: 'WebRTC LAN Scrub', icon: '🔒' },
      { key: 'peripherals', label: 'HID/USB/Gamepad', icon: '🕹️' },
      { key: 'storage', label: 'Storage Quota API', icon: '💾' },
      { key: 'beacons', label: 'Tracking Beacons', icon: '📡' },
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
    const p = state.profiles[state.activeProfile];
    if (!p) return;

    previewStatusBadge.textContent = state.isEnabled ? 'SHIELD ACTIVE' : 'SHIELD DISABLED';
    previewStatusBadge.className = `status-badge ${state.isEnabled ? 'active-status-badge' : 'disabled-status-badge'}`;

    httpHeadersPreview.textContent = JSON.stringify({
      "User-Agent": p.userAgent,
      "Sec-Ch-Ua": formatBrands(p.brands),
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": `"${p.platformName || 'Windows'}"`,
      "Sec-Ch-Ua-Platform-Version": `"${p.platformVersion || '10.0.0'}"`,
      "Sec-Ch-Ua-Arch": `"${p.architecture || 'x86'}"`,
      "Sec-Ch-Ua-Bitness": `"${p.bitness || '64'}"`
    }, null, 2);

    jsNavigatorPreview.textContent = JSON.stringify({
      "navigator.userAgent": p.userAgent,
      "navigator.platform": p.platform || "Win32",
      "navigator.vendor": p.vendor || "Google Inc.",
      "navigator.hardwareConcurrency": p.hardwareConcurrency || 4,
      "navigator.deviceMemory": p.deviceMemory || 4,
      "WebGL UNMASKED_VENDOR": p.webglVendor || "Google Inc. (Intel)",
      "WebGL UNMASKED_RENDERER": p.webglRenderer || "ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11...)",
      "Storage Quota API": "100 GB (Fixed)"
    }, null, 2);

    fpjsShieldPreview.textContent = JSON.stringify({
      "D3D Extensions Spoofing": p.spoofWebglAdvanced ? "Active" : "Disabled",
      "Shader Comment Scrubbing": "Active",
      "Canvas 2D & Audio Noise": "Active",
      "Web Worker & ServiceWorker": "Active",
      "Topics API Randomizer": "Active (629-topic taxonomy)",
      "Same-Offset Timezone": "Active",
      "Sub-Pixel DOMRect & SVGRect": "Active",
      "WebRTC LAN IP Scrubbing": "Active",
      "Peripheral Neutering": "Active",
      "Brave Masking": p.maskBrave ? "Active" : "Disabled"
    }, null, 2);
  }

  function openEditor(profileId) {
    const p = state.profiles[profileId];
    if (!p) return;

    editorTitle.textContent = `Edit Profile: ${p.name}`;
    editProfileId.value = profileId;
    editName.value = p.name || '';
    editDescription.value = p.description || '';
    editUserAgent.value = p.userAgent || '';
    editPlatform.value = p.platform || 'Win32';
    editPlatformName.value = p.platformName || 'Windows';
    editPlatformVersion.value = p.platformVersion || '10.0.0';
    editVendor.value = p.vendor || 'Google Inc.';
    editCores.value = p.hardwareConcurrency || 4;
    editMemory.value = p.deviceMemory || 4;
    editWebglVendor.value = p.webglVendor || 'Google Inc. (Intel)';
    editWebglRenderer.value = p.webglRenderer || '';
    editSpoofWebglAdvanced.checked = p.spoofWebglAdvanced !== undefined ? p.spoofWebglAdvanced : true;
    editMaskBrave.checked = p.maskBrave !== undefined ? p.maskBrave : true;
    editBlockBeacons.checked = p.blockBeacons !== undefined ? p.blockBeacons : true;
    editSpoofScreen.checked = p.spoofScreen !== undefined ? p.spoofScreen : false;

    switchTab('tab-editor');
  }

  btnNewProfile.addEventListener('click', () => {
    editorTitle.textContent = 'Create New Custom Profile';
    editProfileId.value = '';
    profileForm.reset();
    editPlatform.value = 'Win32';
    editPlatformName.value = 'Windows';
    editPlatformVersion.value = '10.0.0';
    editVendor.value = 'Google Inc.';
    editCores.value = 4;
    editMemory.value = 4;
    editSpoofWebglAdvanced.checked = true;
    editMaskBrave.checked = true;
    editBlockBeacons.checked = true;
    editSpoofScreen.checked = false;

    switchTab('tab-editor');
  });

  btnCancelEdit.addEventListener('click', () => {
    switchTab('tab-profiles');
  });

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editProfileId.value || `custom_${Date.now()}`;

    state.profiles[id] = {
      id: id,
      name: editName.value,
      description: editDescription.value,
      userAgent: editUserAgent.value,
      platform: editPlatform.value,
      platformName: editPlatformName.value,
      platformVersion: editPlatformVersion.value,
      vendor: editVendor.value,
      hardwareConcurrency: parseInt(editCores.value, 10) || 4,
      deviceMemory: parseInt(editMemory.value, 10) || 4,
      webglVendor: editWebglVendor.value,
      webglRenderer: editWebglRenderer.value,
      spoofWebglAdvanced: editSpoofWebglAdvanced.checked,
      maskBrave: editMaskBrave.checked,
      blockBeacons: editBlockBeacons.checked,
      spoofScreen: editSpoofScreen.checked,
      custom: true
    };

    saveState(() => {
      switchTab('tab-profiles');
    });
  });

  function duplicateProfile(profileId) {
    const orig = state.profiles[profileId];
    if (!orig) return;

    const newId = `custom_${Date.now()}`;
    state.profiles[newId] = {
      ...JSON.parse(JSON.stringify(orig)),
      id: newId,
      name: `${orig.name} (Copy)`,
      custom: true
    };

    saveState();
  }

  function deleteProfile(profileId) {
    if (confirm('Are you sure you want to delete this custom profile?')) {
      delete state.profiles[profileId];
      if (state.activeProfile === profileId) {
        state.activeProfile = 'cheap_win10_edge';
      }
      saveState();
    }
  }

  function formatBrands(brands) {
    if (!brands || !Array.isArray(brands)) return '"Not:A-Brand";v="24", "Chromium";v="150", "Microsoft Edge";v="150"';
    return brands.map(b => `"${b.brand}";v="${b.version}"`).join(', ');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Auto-refresh probe stats every 1.5 seconds
  setInterval(fetchProbeStats, 1500);

  loadState();
});
