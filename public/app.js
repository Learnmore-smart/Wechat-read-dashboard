// WeChat Reading Dashboard — Frontend Application v3.0
// Premium, sleek loading experience with top progress bar + settings panel + themes

// ========================== ENCRYPTION & DECRYPTION SYSTEM ==========================
const KeyCrypt = {
  encrypt(text) {
    if (!text) return '';
    const salt = "weread_secret_salt_key_2026";
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(encodeURIComponent(result));
  },
  decrypt(ciphertext) {
    if (!ciphertext) return '';
    try {
      const decoded = decodeURIComponent(atob(ciphertext));
      const salt = "weread_secret_salt_key_2026";
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch (e) {
      return '';
    }
  }
};

// ========================== TRANSLATION & LOCALIZATION SYSTEM ==========================
const i18n = {};

// ========================== SYSTEM SETTINGS & THEMES ==========================
const settingsState = {
  appearance: 'auto', // 'auto', 'light', 'dark'
  theme: 'warm', // 'warm', 'sepia', 'navy', 'sage', 'dark', 'cyber'
  apiKey: '',
  language: 'zh' // 'zh', 'en'
};

async function initSettings() {
  // Load settings from localStorage
  settingsState.appearance = localStorage.getItem('weread_appearance') || 'auto';
  settingsState.theme = localStorage.getItem('weread_theme') || 'warm';
  settingsState.language = localStorage.getItem('weread_language') || 'zh';
  
  const storedKey = localStorage.getItem('weread_api_key');
  settingsState.apiKey = storedKey ? KeyCrypt.decrypt(storedKey) : '';

  // Apply theme on load
  applyTheme(settingsState.appearance, settingsState.theme);
  
  // Apply language on load
  await updateLanguage(settingsState.language);

  // Setup DOM Event Listeners for Settings Modal
  const openBtn = document.getElementById('open-settings-btn');
  const closeBtn = document.getElementById('close-settings-btn');
  const cancelBtn = document.getElementById('cancel-settings-btn');
  const saveBtn = document.getElementById('save-settings-btn');
  const togglePwdBtn = document.getElementById('toggle-api-key-visibility');
  const apiKeyInput = document.getElementById('settings-api-key-input');
  const modal = document.getElementById('settings-modal');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      // Load current settings into inputs
      apiKeyInput.value = settingsState.apiKey;
      
      // Select appropriate appearance button
      document.querySelectorAll('.mode-select-btn').forEach(btn => {
        if (btn.getAttribute('data-appearance') === settingsState.appearance) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Select appropriate language button
      document.querySelectorAll('.lang-select-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === settingsState.language) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Select appropriate theme button
      document.querySelectorAll('.theme-option-btn').forEach(btn => {
        if (btn.getAttribute('data-theme') === settingsState.theme) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      modal.classList.add('active');
    });
  }

  const hideSettings = () => {
    if (modal) modal.classList.remove('active');
    if (apiKeyInput) apiKeyInput.type = 'password';
    const eyeIcon = togglePwdBtn.querySelector('i');
    if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye');
    lucide.createIcons();
  };

  if (closeBtn) closeBtn.addEventListener('click', hideSettings);
  if (cancelBtn) cancelBtn.addEventListener('click', hideSettings);

  // Password toggle visibility
  if (togglePwdBtn && apiKeyInput) {
    togglePwdBtn.addEventListener('click', () => {
      const eyeIcon = togglePwdBtn.querySelector('i');
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye-off');
      } else {
        apiKeyInput.type = 'password';
        if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye');
      }
      lucide.createIcons();
    });
  }

  // Helper to save API key
  const saveApiKey = async () => {
    const newApiKey = apiKeyInput.value.trim();
    if (newApiKey === settingsState.apiKey) return;

    settingsState.apiKey = newApiKey;
    if (newApiKey) {
      localStorage.setItem('weread_api_key', KeyCrypt.encrypt(newApiKey));
    } else {
      localStorage.removeItem('weread_api_key');
    }
    showToast(i18n[settingsState.language].keyUpdated, "success");
    await refreshAllData();
  };

  // Auto-save API Key on enter or blur
  if (apiKeyInput) {
    apiKeyInput.addEventListener('blur', saveApiKey);
    apiKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        apiKeyInput.blur(); // Triggers blur listener to save
      }
    });
  }

  // Appearance Select Buttons (Reactive Save)
  document.querySelectorAll('.mode-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-select-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const newAppearance = btn.getAttribute('data-appearance') || 'auto';
      if (newAppearance !== settingsState.appearance) {
        settingsState.appearance = newAppearance;
        localStorage.setItem('weread_appearance', newAppearance);
        applyTheme(newAppearance, settingsState.theme);
      }
    });
  });

  // Language Select Buttons (Reactive Save)
  document.querySelectorAll('.lang-select-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newLang = btn.getAttribute('data-lang') || 'zh';
      if (newLang !== settingsState.language) {
        await updateLanguage(newLang);
        // Refresh dynamically rendered content components
        renderHeaderStats();
        renderDashboard();
        renderBookshelf();
        renderNotebooksList();
        renderRecommendations();
      }
    });
  });

  // Theme Select Buttons (Reactive Save)
  document.querySelectorAll('.theme-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-option-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const newTheme = btn.getAttribute('data-theme') || 'warm';
      if (newTheme !== settingsState.theme) {
        settingsState.theme = newTheme;
        localStorage.setItem('weread_theme', newTheme);
        applyTheme(settingsState.appearance, newTheme);
      }
    });
  });

  // API Key Help Collapsible Toggle
  const helpToggle = document.getElementById('api-key-help-toggle');
  const helpContent = document.getElementById('api-key-help-content');
  if (helpToggle && helpContent) {
    helpToggle.addEventListener('click', () => {
      helpContent.classList.toggle('active');
    });
  }

  // Listen to system theme changes in auto mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (settingsState.appearance === 'auto') {
      applyTheme('auto', settingsState.theme);
    }
  });
}

async function updateLanguage(lang) {
  // If we haven't loaded the translations for this language yet, fetch them
  if (!i18n[lang]) {
    try {
      const response = await fetch(`/locales/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load translations for ${lang}`);
      i18n[lang] = await response.json();
    } catch (error) {
      console.error("Error loading language files:", error);
      // Fallback in case of network issue
      i18n[lang] = {};
    }
  }

  settingsState.language = lang;
  localStorage.setItem('weread_language', lang);

  // Set html lang attribute
  document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');

  // Translate elements with [data-i18n]
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key] !== undefined) {
      el.innerHTML = i18n[lang][key];
    }
  });

  // Translate elements with [data-i18n-placeholder]
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[lang] && i18n[lang][key] !== undefined) {
      el.setAttribute('placeholder', i18n[lang][key]);
    }
  });

  // Highlight active language button
  document.querySelectorAll('.lang-select-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update dynamic elements that might already be rendered
  updateTabLabels(lang);
}

function openSettingsModalWithAlert() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    const apiKeyInput = document.getElementById('settings-api-key-input');
    if (apiKeyInput) {
      apiKeyInput.value = settingsState.apiKey || '';
      apiKeyInput.classList.add('input-alert');
      setTimeout(() => apiKeyInput.classList.remove('input-alert'), 3000);
    }
    
    // Auto-open settings
    modal.classList.add('active');
    
    // Expand help instructions
    const helpContent = document.getElementById('api-key-help-content');
    if (helpContent) {
      helpContent.classList.add('active');
    }
  }
}

function updateTabLabels(lang) {
  const currentTab = state.activeTab;
  const t = i18n[lang] || {};
  const meta = (t.tabMeta && t.tabMeta[currentTab]) || { title: 'console.', subtitle: '' };
  
  if (el.pageTitle) el.pageTitle.textContent = meta.title;
  
  if (currentTab === 'dashboard') {
    const subtitleMap = {
      weekly: lang === 'zh' ? '查看本周阅读统计及最近阅读偏好' : 'View weekly reading stats and recent preferences',
      monthly: lang === 'zh' ? '查看本月阅读统计及最近阅读偏好' : 'View monthly reading stats and recent preferences',
      annually: lang === 'zh' ? '查看本年阅读统计及最近阅读偏好' : 'View annual reading stats and recent preferences',
      overall: lang === 'zh' ? '查看生涯累计阅读统计及最近阅读偏好' : 'View lifetime reading stats and recent preferences'
    };
    if (el.pageSubtitle) el.pageSubtitle.textContent = subtitleMap[state.statsMode] || meta.subtitle;
  } else {
    if (el.pageSubtitle) el.pageSubtitle.textContent = meta.subtitle;
  }

  // Update stat label text in header
  if (el.headerTimeLabel) {
    el.headerTimeLabel.textContent = (t.timeLabel && t.timeLabel[state.statsMode]) || '';
  }

  if (el.headerDaysLabel) {
    el.headerDaysLabel.textContent = (t.daysLabel && t.daysLabel[state.statsMode]) || '';
  }

  if (el.headerNotesLabel) {
    el.headerNotesLabel.textContent = t.notesLabel || '';
  }

  // Update card static sub-hints and charts titles
  const titleEl = document.getElementById('activity-chart-title');
  if (titleEl) {
    titleEl.textContent = (t.chartTitleMap && t.chartTitleMap[state.statsMode]) || '';
  }

  // Update compare time if dashboard data exists
  const detailsCompareEl = document.getElementById('dash-compare-time');
  if (detailsCompareEl && state.monthlyData) {
    renderCompareTimeText(lang);
  }

  // Habits Labels
  const habitTimeHeader = document.querySelector('.habit-item:nth-child(1) h4');
  if (habitTimeHeader) habitTimeHeader.textContent = t.prefTime || '';
  const habitCatHeader = document.querySelector('.habit-item:nth-child(2) h4');
  if (habitCatHeader) habitCatHeader.textContent = t.coreCategory || '';
  const habitRateHeader = document.querySelector('.habit-item:nth-child(3) h4');
  if (habitRateHeader) habitRateHeader.textContent = t.readRate || '';
}

function renderCompareTimeText(lang) {
  const d = state.monthlyData;
  if (!d) return;
  const t = i18n[lang] || {};
  
  if (d.compare !== undefined && d.compare !== null) {
    const compVal = d.compare * 100;
    if (compVal > 0) {
      const tmpl = t.compareUp || '';
      el.dashCompareTime.innerHTML = tmpl.replace('{percent}', compVal.toFixed(1));
    } else if (compVal < 0) {
      const tmpl = t.compareDown || '';
      el.dashCompareTime.innerHTML = tmpl.replace('{percent}', Math.abs(compVal).toFixed(1));
    } else {
      el.dashCompareTime.textContent = t.compareFlat || '';
    }
  } else {
    el.dashCompareTime.textContent = t.compareNoData || '';
  }
  lucide.createIcons();
}

function applyTheme(appearance, theme) {
  const root = document.documentElement;
  root.setAttribute('data-appearance', appearance);
  root.setAttribute('data-theme', theme);

  // Determine active visual dark status based strictly on appearance (light/dark/auto)
  let isDark = false;
  if (appearance === 'dark') {
    isDark = true;
  } else if (appearance === 'auto') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    root.classList.add('dark-mode-applied');
    root.setAttribute('data-active-style', 'dark');
  } else {
    root.classList.remove('dark-mode-applied');
    root.setAttribute('data-active-style', 'light');
  }
}

// Global State
const state = {
  activeTab: 'dashboard',
  statsMode: 'monthly',
  monthlyData: null,
  shelfData: null,
  notebooksData: null,
  recommendData: null,
  currentBookDetails: null,
  currentBookProgress: null,
  currentBookNotes: null,
  isInitialLoad: true
};

// UI Elements
const el = {
  sidebarBtns: document.querySelectorAll('.sidebar-menu .menu-item'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  loadingOverlay: document.getElementById('loading-overlay'),
  topLoadingBar: document.getElementById('top-loading-bar'),
  pageTitle: document.getElementById('page-title'),
  pageSubtitle: document.getElementById('page-subtitle'),
  
  // Header Stats
  headerTimeLabel: document.getElementById('header-stat-time-label'),
  headerTime: document.getElementById('header-stat-time'),
  headerDaysLabel: document.getElementById('header-stat-days-label'),
  headerDays: document.getElementById('header-stat-days'),
  headerNotesLabel: document.getElementById('header-stat-notes-label'),
  headerNotes: document.getElementById('header-stat-notes'),
  
  // Dashboard Elements
  dashTotalTimeLabel: document.getElementById('dash-total-time-label'),
  dashTotalTime: document.getElementById('dash-total-time'),
  dashReadDaysLabel: document.getElementById('dash-read-days-label'),
  dashReadDays: document.getElementById('dash-read-days'),
  dashAvgTime: document.getElementById('dash-avg-time'),
  dashAvgTimeSubtitle: document.getElementById('dash-avg-time-subtitle'),
  dashCompareTime: document.getElementById('dash-compare-time'),
  barChartContainer: document.getElementById('bar-chart-container'),
  preferCategoryContainer: document.getElementById('prefer-category-container'),
  dashRankList: document.getElementById('dash-rank-list'),
  habitTimeWord: document.getElementById('habit-time-word'),
  habitCategoryWord: document.getElementById('habit-category-word'),
  habitReadRate: document.getElementById('habit-read-rate'),
  
  // Bookshelf Elements
  bookshelfGrid: document.getElementById('bookshelf-grid'),
  shelfSearchInput: document.getElementById('shelf-search-input'),
  filterBtns: document.querySelectorAll('.filter-btn'),
  countAll: document.getElementById('count-all'),
  countReading: document.getElementById('count-reading'),
  countFinished: document.getElementById('count-finished'),
  countSecret: document.getElementById('count-secret'),
  
  // Notes Elements
  notesTotalBooks: document.getElementById('notes-total-books'),
  notebooksGrid: document.getElementById('notebooks-grid'),
  notesViewerModal: document.getElementById('notes-viewer-modal'),
  notesViewerTitle: document.getElementById('notes-viewer-title'),
  notesViewerAuthor: document.getElementById('notes-viewer-author'),
  notesViewerBody: document.getElementById('notes-viewer-body'),
  
  // Recommend Elements
  recommendGrid: document.getElementById('recommend-grid'),
  
  // Book Detail Elements
  bookDetailModal: document.getElementById('book-detail-modal'),
  bookDetailBody: document.getElementById('book-detail-body'),
  
  // Toast
  toastContainer: document.getElementById('toast-container')
};

// ========================== INIT ==========================

document.addEventListener('DOMContentLoaded', async () => {
  await initSettings();
  setupTabListeners();
  setupStatsToggles();
  setupShelfFilters();
  setupModals();
  lucide.createIcons();
  
  await refreshAllData();
});

// ========================== TAB NAVIGATION ==========================

function setupTabListeners() {
  el.sidebarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      el.sidebarBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      el.tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`tab-${tabId}`).classList.add('active');
      
      state.activeTab = tabId;
      updateTabLabels(settingsState.language);
      lucide.createIcons();
    });
  });
}

// ========================== STATS PERIOD TOGGLE ==========================

function setupStatsToggles() {
  const toggleContainer = document.getElementById('stats-mode-toggles');
  if (!toggleContainer) return;
  
  const buttons = toggleContainer.querySelectorAll('.toggle-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const mode = btn.getAttribute('data-mode');
      if (mode === state.statsMode) return;
      
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.statsMode = mode;
      
      showTopBar(true);
      
      try {
        const statsResult = await callApi('/readdata/detail', { mode: mode });
        if (statsResult && !statsResult.errcode) {
          state.monthlyData = statsResult;
          
          updateTabLabels(settingsState.language);
          
          renderHeaderStats();
          renderDashboard();
        }
      } catch (err) {
        console.error("Error toggling stats mode:", err);
      } finally {
        showTopBar(false);
      }
    });
  });
}

// ========================== SHELF FILTERS ==========================

function setupShelfFilters() {
  if (el.shelfSearchInput) {
    el.shelfSearchInput.addEventListener('input', () => {
      renderBookshelf();
    });
  }
  
  el.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      el.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderBookshelf();
    });
  });
}

// ========================== MODAL SETUP ==========================

function setupModals() {
  const settingsModal = document.getElementById('settings-modal');
  window.addEventListener('click', (e) => {
    if (e.target === el.bookDetailModal) closeBookDetailModal();
    if (e.target === el.notesViewerModal) closeNotesViewerModal();
    if (e.target === settingsModal) {
      settingsModal.classList.remove('active');
    }
  });
  
  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBookDetailModal();
      closeNotesViewerModal();
      if (settingsModal) settingsModal.classList.remove('active');
    }
  });
}

// ========================== DATA LOADING ==========================

async function refreshAllData() {
  showLoading(true, i18n[settingsState.language].syncing);
  
  try {
    // Fetch all data in parallel for speed
    const [statsResult, shelfResult, notebooksResult, recommendResult] = await Promise.all([
      callApi('/readdata/detail', { mode: 'monthly' }).catch(e => null),
      callApi('/shelf/sync').catch(e => null),
      callApi('/user/notebooks', { count: 100 }).catch(e => null),
      callApi('/book/recommend', { count: 12 }).catch(e => null)
    ]);
    
    if (statsResult && !statsResult.errcode) state.monthlyData = statsResult;
    if (shelfResult && !shelfResult.errcode) state.shelfData = shelfResult;
    if (notebooksResult && !notebooksResult.errcode) state.notebooksData = notebooksResult;
    if (recommendResult && !recommendResult.errcode) state.recommendData = recommendResult;
    
    // Render all components
    renderHeaderStats();
    renderDashboard();
    renderBookshelf();
    renderNotebooksList();
    renderRecommendations();
    
    showToast(i18n[settingsState.language].syncSuccess, "success");
  } catch (error) {
    console.error("Error loading WeChat Reading data:", error);
    showToast(i18n[settingsState.language].syncFail, "error");
  } finally {
    state.isInitialLoad = false;
    showLoading(false);
  }
}

// ========================== API CALLER ==========================

async function callApi(apiName, params = {}) {
  // Retrieve stored API key
  const storedKeyEncrypted = localStorage.getItem('weread_api_key');
  const userApiKey = storedKeyEncrypted ? KeyCrypt.decrypt(storedKeyEncrypted) : null;

  const requestBody = { api_name: apiName, ...params };
  if (userApiKey) {
    requestBody.user_api_key = userApiKey;
  }

  try {
    const response = await fetch('/api/weread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    if (data.errcode && data.errcode !== 0) {
      showToast(data.errmsg || `接口调用错误: ${apiName}`, "error");
      
      // Auto-open settings if API key is missing
      if (data.errmsg && data.errmsg.toLowerCase().includes("api key is missing")) {
        openSettingsModalWithAlert();
      }
      
      return null;
    }
    return data;
  } catch (e) {
    console.error(`Fetch API Error calling ${apiName}:`, e);
    showToast(`连接本地后端失败: ${e.message}`, "error");
    throw e;
  }
}

// ========================== LOADING UI ==========================

// Full overlay for initial load
function showLoading(show, message) {
  if (show) {
    el.loadingOverlay.classList.remove('fade-out');
    const textEl = el.loadingOverlay.querySelector('.loading-text');
    if (textEl) textEl.textContent = message || i18n[settingsState.language].loading;
  } else {
    el.loadingOverlay.classList.add('fade-out');
  }
}

// Slim top progress bar for subsequent data loads
function showTopBar(active) {
  if (active) {
    el.topLoadingBar.classList.add('active');
  } else {
    el.topLoadingBar.classList.remove('active');
  }
}

// ========================== TOAST SYSTEM ==========================

function showToast(message, type = "success") {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconName = type === 'success' ? 'check-circle-2' : 'alert-circle';
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;
  
  el.toastContainer.appendChild(toast);
  lucide.createIcons();
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ========================== RENDER FUNCTIONS ==========================

// 1. Header Stats
function renderHeaderStats() {
  const mode = state.statsMode || 'monthly';
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  
  // Update header labels dynamically
  if (el.headerTimeLabel) {
    el.headerTimeLabel.textContent = (t.timeLabel && t.timeLabel[mode]) || '';
  }
  
  if (el.headerDaysLabel) {
    el.headerDaysLabel.textContent = (t.daysLabel && t.daysLabel[mode]) || '';
  }

  if (state.monthlyData) {
    const totalSecs = state.monthlyData.totalReadTime || 0;
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    el.headerTime.textContent = `${hours}h ${mins}m`;
    
    const isZh = lang === 'zh';
    el.headerDays.textContent = isZh ? `${state.monthlyData.readDays || 0}天` : `${state.monthlyData.readDays || 0} days`;
  }
  
  if (state.notebooksData) {
    const isZh = lang === 'zh';
    el.headerNotes.textContent = isZh ? `${state.notebooksData.totalNoteCount || 0}条` : `${state.notebooksData.totalNoteCount || 0} notes`;
  }
}

// 2. Dashboard
function renderDashboard() {
  if (!state.monthlyData) return;
  
  const d = state.monthlyData;
  const mode = state.statsMode || 'monthly';
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  const isZh = lang === 'zh';
  
  // Update dashboard stat card titles dynamically
  if (el.dashTotalTimeLabel) {
    el.dashTotalTimeLabel.textContent = (t.totalTimeLabelMap && t.totalTimeLabelMap[mode]) || '';
  }
  
  if (el.dashReadDaysLabel) {
    el.dashReadDaysLabel.textContent = (t.readDaysLabelMap && t.readDaysLabelMap[mode]) || '';
  }
  
  el.dashTotalTime.textContent = formatDuration(d.totalReadTime);
  el.dashReadDays.textContent = isZh ? `${d.readDays || 0} 天` : `${d.readDays || 0} days`;
  
  // Calculate average
  let avgSecs = d.dayAverageReadTime;
  let avgSubtitle = t.avgSubtitleMap ? t.avgSubtitleMap.monthly : "";
  
  if (state.statsMode === 'weekly') {
    avgSubtitle = t.avgSubtitleMap ? t.avgSubtitleMap.weekly : "";
    if (avgSecs === undefined || avgSecs === null) {
      const now = new Date();
      const day = now.getDay();
      const elapsedDays = day === 0 ? 7 : day;
      avgSecs = Math.floor((d.totalReadTime || 0) / elapsedDays);
    }
  } else if (state.statsMode === 'monthly') {
    avgSubtitle = t.avgSubtitleMap ? t.avgSubtitleMap.monthly : "";
    if (avgSecs === undefined || avgSecs === null) {
      const now = new Date();
      const elapsedDays = now.getDate();
      avgSecs = Math.floor((d.totalReadTime || 0) / elapsedDays);
    }
  } else if (state.statsMode === 'annually') {
    avgSubtitle = t.avgSubtitleMap ? t.avgSubtitleMap.annually : "";
    if (avgSecs === undefined || avgSecs === null) {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const elapsedDays = Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24));
      avgSecs = Math.floor((d.totalReadTime || 0) / elapsedDays);
    }
  } else if (state.statsMode === 'overall') {
    avgSubtitle = t.avgSubtitleMap ? t.avgSubtitleMap.overall_regist : "";
    if (avgSecs === undefined || avgSecs === null) {
      if (d.registTime) {
        const elapsedDays = Math.max(1, Math.ceil((Date.now() / 1000 - d.registTime) / 86400));
        avgSecs = Math.floor((d.totalReadTime || 0) / elapsedDays);
      } else {
        avgSubtitle = t.avgSubtitleMap ? t.avgSubtitleMap.overall_valid : "";
        avgSecs = Math.floor((d.totalReadTime || 0) / Math.max(1, d.readDays || 1));
      }
    }
  }

  el.dashAvgTime.textContent = isZh ? `${Math.round((avgSecs || 0) / 60)} 分钟` : `${Math.round((avgSecs || 0) / 60)} mins`;
  if (el.dashAvgTimeSubtitle) {
    el.dashAvgTimeSubtitle.textContent = avgSubtitle;
  }
  
  // Trend
  if (d.compare !== undefined && d.compare !== null) {
    const compVal = d.compare * 100;
    if (compVal > 0) {
      const tmpl = t.compareUpDashboard || '';
      el.dashCompareTime.innerHTML = tmpl.replace('{percent}', compVal.toFixed(1));
    } else if (compVal < 0) {
      const tmpl = t.compareDownDashboard || '';
      el.dashCompareTime.innerHTML = tmpl.replace('{percent}', Math.abs(compVal).toFixed(1));
    } else {
      el.dashCompareTime.textContent = t.compareFlatDashboard || '';
    }
  } else {
    el.dashCompareTime.textContent = t.compareNoData || '';
  }
  
  // Habits
  el.habitTimeWord.textContent = d.preferTimeWord || (t.noHabitData || "");
  el.habitCategoryWord.textContent = d.preferCategoryWord || (t.noHabitData || "");
  if (d.readRate !== undefined) {
    const tmpl = t.readRateText || '';
    el.habitReadRate.textContent = tmpl.replace('{readRate}', d.readRate).replace('{audioRate}', 100 - d.readRate);
  } else {
    el.habitReadRate.textContent = t.readRateLow || "";
  }

  renderDailyActivityChart(d.readTimes);
  renderCategoryPreferences(d.preferCategory);
  renderLongestReads(d.readLongest);
}

// Bar chart
function renderDailyActivityChart(readTimes) {
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  const isZh = lang === 'zh';
  
  if (!readTimes || Object.keys(readTimes).length === 0) {
    el.barChartContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="bar-chart-3"></i>
        <p>${t.noData || '无阅读时长明细数据'}</p>
      </div>
    `;
    return;
  }
  
  const daysOfWeek = t.daysOfWeek || ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dailyData = Object.entries(readTimes).map(([ts, val]) => {
    const date = new Date(parseInt(ts) * 1000);
    let label = "";
    let shortLabel = "";
    
    if (state.statsMode === 'weekly') {
      label = daysOfWeek[date.getDay()];
      shortLabel = label;
    } else if (state.statsMode === 'monthly') {
      label = isZh ? `${date.getMonth() + 1}月${date.getDate()}日` : `${date.getMonth() + 1}/${date.getDate()}`;
      shortLabel = `${date.getDate()}`;
    } else if (state.statsMode === 'annually') {
      label = isZh ? `${date.getFullYear()}年${date.getMonth() + 1}月` : `${date.getFullYear()}/${date.getMonth() + 1}`;
      shortLabel = isZh ? `${date.getMonth() + 1}月` : `${date.getMonth() + 1}`;
    } else {
      label = isZh ? `${date.getFullYear()}年` : `${date.getFullYear()}`;
      shortLabel = label;
    }
    
    return { timestamp: parseInt(ts), label, shortLabel, value: val };
  }).sort((a, b) => a.timestamp - b.timestamp);
  
  const maxVal = Math.max(...dailyData.map(d => d.value), 60);
  
  let chartHtml = `<div class="bar-chart-wrapper">`;
  
  dailyData.forEach((day, i) => {
    const heightPercent = (day.value / maxVal) * 100;
    const readableTime = day.value > 0 ? formatDuration(day.value) : (t.notRead || "未阅读");
    
    chartHtml += `
      <div class="chart-bar-col" style="animation-delay: ${i * 20}ms">
        <div class="chart-bar-tooltip"><strong>${day.label}</strong><br>${readableTime}</div>
        <div class="chart-bar-fill" style="height: ${Math.max(heightPercent, 2)}%;"></div>
        <div class="chart-bar-label">${day.shortLabel}</div>
      </div>
    `;
  });
  
  chartHtml += `</div>`;
  el.barChartContainer.innerHTML = chartHtml;
}

// Category preferences
function renderCategoryPreferences(preferCategory) {
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  
  if (!preferCategory || preferCategory.length === 0) {
    el.preferCategoryContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="pie-chart"></i>
        <p>${t.noCategory || '无品类偏好数据'}</p>
      </div>
    `;
    return;
  }
  
  const sorted = [...preferCategory].sort((a, b) => b.val - a.val);
  
  let prefHtml = `<div class="pref-list">`;
  
  sorted.slice(0, 5).forEach(cat => {
    const progressPercent = cat.val <= 1 ? (cat.val * 100).toFixed(0) : cat.val;
    const timeText = formatDuration(cat.readingTime);
    let categoryName = cat.categoryTitle;
    if (categoryName === '有声书') {
      categoryName = t.audiobook || '有声书';
    }
    const countSuffix = (t.catBooksCount || "({count}本)").replace('{count}', cat.readingCount);
    
    prefHtml += `
      <div class="pref-item">
        <div class="pref-header">
          <span class="pref-title">${categoryName}</span>
          <span class="pref-value">${timeText} ${countSuffix}</span>
        </div>
        <div class="pref-bar-bg">
          <div class="pref-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>
      </div>
    `;
  });
  
  prefHtml += `</div>`;
  el.preferCategoryContainer.innerHTML = prefHtml;
}

// Ranking list
function renderLongestReads(readLongest) {
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  
  if (!readLongest || readLongest.length === 0) {
    el.dashRankList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="trophy"></i>
        <p>${t.noRank || '无书籍阅读排行'}</p>
      </div>
    `;
    return;
  }
  
  let rankHtml = '';
  
  readLongest.forEach((item, index) => {
    const isAlbum = !!item.albumInfo;
    const title = isAlbum ? item.albumInfo.name : item.book.title;
    const author = isAlbum ? item.albumInfo.authorName : item.book.author;
    const cover = isAlbum ? item.albumInfo.cover : item.book.cover;
    const id = isAlbum ? item.albumInfo.albumId : item.book.bookId;
    const durationText = formatDuration(item.readTime);
    const tags = item.tags && item.tags.length > 0 ? `<span class="badge" style="margin-left:6px; font-size:9px; padding:1px 5px;">${item.tags[0]}</span>` : '';
    const albumPrefix = t.audiobookPrefix || '[有声书] ';
    
    rankHtml += `
      <div class="rank-item" onclick="openBookDetails('${id}', ${isAlbum})">
        <div class="rank-number">${index + 1}</div>
        <img class="rank-cover" src="${cover}" alt="${title}" onerror="this.src='https://res.weread.qq.com/wrepub/CB_9bJBOnBOBEl972B71F03W5Ao_parsecover'">
        <div class="rank-info">
          <div class="rank-title">${title} ${tags}</div>
          <div class="rank-author">${isAlbum ? albumPrefix : ''}${author}</div>
        </div>
        <div class="rank-time">${durationText}</div>
      </div>
    `;
  });
  
  el.dashRankList.innerHTML = rankHtml;
}

// 3. Bookshelf
function renderBookshelf() {
  if (!state.shelfData) return;
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  
  const searchVal = el.shelfSearchInput.value.toLowerCase().trim();
  const filterBtn = document.querySelector('.filter-btn.active');
  const filterType = filterBtn ? filterBtn.getAttribute('data-filter') : 'all';
  
  const books = state.shelfData.books || [];
  const albums = state.shelfData.albums || [];
  
  const mpCount = state.shelfData.mp ? 1 : 0;
  const secretBooksCount = books.filter(b => b.secret === 1).length;
  const secretAlbumsCount = albums.filter(a => a.albumInfoExtra && a.albumInfoExtra.secret === 1).length;
  const totalSecret = secretBooksCount + secretAlbumsCount + mpCount;
  
  const finishedBooksCount = books.filter(b => b.finishReading === 1).length;
  const finishedAlbumsCount = albums.filter(a => a.albumInfo && a.albumInfo.finish === 1).length;
  const totalFinished = finishedBooksCount + finishedAlbumsCount;
  
  const totalItemsCount = books.length + albums.length + mpCount;
  const totalReading = totalItemsCount - totalFinished;
  
  el.countAll.textContent = totalItemsCount;
  el.countReading.textContent = totalReading;
  el.countFinished.textContent = totalFinished;
  el.countSecret.textContent = totalSecret;
  
  let items = [];
  
  books.forEach(b => {
    items.push({
      id: b.bookId,
      title: b.title,
      author: b.author,
      cover: b.cover,
      category: b.category || (t.uncategorized || "未分类"),
      finishReading: b.finishReading === 1,
      secret: b.secret === 1,
      readUpdateTime: b.readUpdateTime || 0,
      isTop: b.isTop === 1,
      isAlbum: false
    });
  });
  
  albums.forEach(a => {
    const info = a.albumInfo || {};
    const extra = a.albumInfoExtra || {};
    items.push({
      id: info.albumId,
      title: info.name,
      author: info.authorName,
      cover: info.cover,
      category: t.audiobook || "有声书",
      finishReading: info.finish === 1,
      secret: extra.secret === 1,
      readUpdateTime: extra.lectureReadUpdateTime || 0,
      isTop: extra.isTop === 1,
      isAlbum: true
    });
  });
  
  items.sort((a, b) => {
    if (a.isTop && !b.isTop) return -1;
    if (!a.isTop && b.isTop) return 1;
    return b.readUpdateTime - a.readUpdateTime;
  });
  
  if (searchVal) {
    items = items.filter(item =>
      item.title.toLowerCase().includes(searchVal) ||
      item.author.toLowerCase().includes(searchVal)
    );
  }
  
  if (filterType === 'in-progress') {
    items = items.filter(item => !item.finishReading);
  } else if (filterType === 'finished') {
    items = items.filter(item => item.finishReading);
  } else if (filterType === 'secret') {
    items = items.filter(item => item.secret);
  }
  
  if (items.length === 0) {
    el.bookshelfGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 60px;">
        <i data-lucide="library-big"></i>
        <p>${t.bookshelfEmpty || '未找到符合筛选条件的书籍'}</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  let gridHtml = '';
  
  if (state.shelfData.mp && (filterType === 'all' || filterType === 'secret') && !searchVal) {
    gridHtml += `
      <div class="book-card">
        <div class="book-card-cover-wrapper">
          <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, var(--blue-700), var(--blue-900)); color:var(--blue-200);">
            <i data-lucide="bookmark" style="width:36px; height:36px; margin-bottom:8px;"></i>
            <span style="font-size:11px; font-weight:600; color:var(--blue-300)">${t.mpCategory || '文章收藏'}</span>
          </div>
          <div class="book-card-badge"><i data-lucide="lock"></i></div>
        </div>
        <div class="book-card-info">
          <div class="book-card-title">${t.mpTitle || '公众号文章收藏'}</div>
          <div class="book-card-author">${t.mpAuthor || '微信公众号文章'}</div>
          <div class="book-card-footer">
            <span class="book-card-category">${t.mpCategory || '文章收藏'}</span>
            <span class="book-card-percentage">${t.mpSecret || '私密'}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  items.forEach(item => {
    const topBadge = item.isTop ? `<div class="book-card-badge" style="left:8px; right:auto; background:var(--primary); color:var(--text-inverted); border:none;"><i data-lucide="pin"></i></div>` : '';
    const secretBadge = item.secret ? `<div class="book-card-badge" style="right:8px; left:auto;"><i data-lucide="lock"></i></div>` : '';
    const progressText = item.finishReading ? (t.filterFinished || "已读完") : (t.filterReading || "在读");
    const progressColor = item.finishReading ? "var(--text-tertiary)" : "var(--primary)";
    const progressPercent = item.finishReading ? 100 : 0;
    const albumPrefix = t.audiobookPrefix || '[有声书] ';
    
    gridHtml += `
      <div class="book-card" onclick="openBookDetails('${item.id}', ${item.isAlbum})">
        <div class="book-card-cover-wrapper">
          <img class="book-card-cover" src="${item.cover}" alt="${item.title}" onerror="this.src='https://res.weread.qq.com/wrepub/CB_9bJBOnBOBEl972B71F03W5Ao_parsecover'">
          ${topBadge}
          ${secretBadge}
          <div class="book-card-progress">
            <div class="book-card-progress-bar" style="width: ${progressPercent}%;"></div>
          </div>
        </div>
        <div class="book-card-info">
          <div class="book-card-title">${item.title}</div>
          <div class="book-card-author">${item.isAlbum ? albumPrefix : ''}${item.author}</div>
          <div class="book-card-footer">
            <span class="book-card-category">${item.category.split('-')[0]}</span>
            <span class="book-card-percentage" style="color: ${progressColor}">${progressText}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  el.bookshelfGrid.innerHTML = gridHtml;
  lucide.createIcons();
}

// 4. Notebooks
function renderNotebooksList() {
  if (!state.notebooksData) return;
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  
  const books = state.notebooksData.books || [];
  el.notesTotalBooks.textContent = state.notebooksData.totalBookCount || books.length;
  
  if (books.length === 0) {
    el.notebooksGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 60px;">
        <i data-lucide="notebook-pen"></i>
        <p>${t.notesEmpty || '暂无读书笔记数据'}</p>
      </div>
    `;
    return;
  }
  
  let gridHtml = '';
  
  books.forEach(item => {
    const book = item.book || {};
    const totalCount = (item.reviewCount || 0) + (item.noteCount || 0) + (item.bookmarkCount || 0);
    const notesSuffix = t.notebookCountSuffix || ' 笔记';
    const highlightsSuffix = t.highlightCountSuffix || ' 划线';
    const thoughtsSuffix = t.thoughtCountSuffix || ' 想法';
    
    gridHtml += `
      <div class="glass-card notebook-card" onclick="openNotesViewer('${item.bookId}', '${book.title.replace(/'/g, "\\'")}', '${book.author.replace(/'/g, "\\'")}')">
        <div class="notebook-cover-wrapper">
          <img class="notebook-cover" src="${book.cover}" alt="${book.title}" onerror="this.src='https://res.weread.qq.com/wrepub/CB_9bJBOnBOBEl972B71F03W5Ao_parsecover'">
        </div>
        <div class="notebook-details">
          <h4 class="notebook-title">${book.title}</h4>
          <span class="notebook-author">${book.author}</span>
          
          <div class="notebook-meta-stats">
            <span class="notebook-meta-badge total">
              <i data-lucide="pen-line"></i>
              <span>${totalCount}${notesSuffix}</span>
            </span>
            <span class="notebook-meta-badge highlight" title="高亮划线数">
              <i data-lucide="highlighter"></i>
              <span>${item.noteCount || 0}${highlightsSuffix}</span>
            </span>
            <span class="notebook-meta-badge review" title="想法点评数">
              <i data-lucide="message-circle"></i>
              <span>${item.reviewCount || 0}${thoughtsSuffix}</span>
            </span>
          </div>
        </div>
      </div>
    `;
  });
  
  el.notebooksGrid.innerHTML = gridHtml;
  lucide.createIcons();
}

// 5. Recommendations
function renderRecommendations() {
  if (!state.recommendData || !state.recommendData.books) return;
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  const isZh = lang === 'zh';
  
  const books = state.recommendData.books;
  
  if (books.length === 0) {
    el.recommendGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 60px;">
        <i data-lucide="wand-sparkles"></i>
        <p>${t.noRecommend || '未加载到推荐好书'}</p>
      </div>
    `;
    return;
  }
  
  let gridHtml = '';
  
  books.forEach(b => {
    const ratingText = b.newRating ? (t.ratingText || '{rating}% 推荐值').replace('{rating}', Math.round(b.newRating)) : (t.noRating || '暂无评分');
    const reasonText = b.reason ? `<div style="font-size:11px; color:var(--primary); margin-top:6px; font-weight:600;">✦ ${b.reason}</div>` : '';
    const introText = b.intro || (isZh ? "暂无书籍简介。" : "No description available.");
    
    gridHtml += `
      <div class="glass-card recommend-item-card" onclick="openBookDetails('${b.bookId}', false)">
        <div class="recommend-body-top">
          <img class="recommend-cover" src="${b.cover}" alt="${b.title}" onerror="this.src='https://res.weread.qq.com/wrepub/CB_9bJBOnBOBEl972B71F03W5Ao_parsecover'">
          <div class="recommend-meta-info">
            <h4 class="recommend-title">${b.title}</h4>
            <span class="recommend-author">${b.author}</span>
            <span class="recommend-rating">${ratingText}</span>
            ${reasonText}
          </div>
        </div>
        <p class="recommend-intro">${introText}</p>
      </div>
    `;
  });
  
  el.recommendGrid.innerHTML = gridHtml;
  lucide.createIcons();
}

// ========================== MODALS ==========================

async function openBookDetails(bookId, isAlbum) {
  showTopBar(true);
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  
  try {
    if (isAlbum) {
      const album = state.shelfData.albums.find(a => a.albumInfo.albumId === bookId);
      if (album) {
        renderAlbumDetails(album.albumInfo, album.albumInfoExtra);
      } else {
        showToast(t.missingAudioInfo || "未找到有声书信息", "error");
      }
      return;
    }
    
    const [info, progress] = await Promise.all([
      callApi('/book/info', { bookId }),
      callApi('/book/getprogress', { bookId })
    ]);
    
    if (info) {
      state.currentBookDetails = info;
      state.currentBookProgress = progress;
      renderBookDetailsModal(info, progress);
    } else {
      showToast(t.detailsFetchFailed || "获取书籍详情失败", "error");
    }
  } catch (err) {
    console.error("Error fetching book detail:", err);
  } finally {
    showTopBar(false);
  }
}

function renderBookDetailsModal(info, progress) {
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  const isZh = lang === 'zh';
  
  const ratingText = info.newRating 
    ? (t.ratingTextDetailed || "{rating}% 好评率 ({count}人评分)").replace('{rating}', info.newRating).replace('{count}', info.newRatingCount || 0) 
    : (t.noRating || '暂无评分');
  const wordCountStr = info.wordCount 
    ? (t.wordCountText || "{count} 万字").replace('{count}', isZh ? Math.round(info.wordCount / 10000) : Math.round(info.wordCount / 1000).toLocaleString()) 
    : (t.wordCountEmpty || '未统计');
  const pubText = info.publisher 
    ? (t.pubTextFormat || "{publisher} / {time}").replace('{publisher}', info.publisher).replace('{time}', info.publishTime || (t.unknownPublisher || "未知")) 
    : (t.unknownPublisher || '未知出版社');
  
  let progressText = t.progressNotStarted || '未开始';
  let progressPercent = 0;
  let totalReadTimeText = isZh ? '0 小时 0 分钟' : '0 mins';
  let finishTimeText = '';
  
  if (progress && progress.book) {
    const p = progress.book;
    progressPercent = p.progress || 0;
    progressText = progressPercent === 100 ? (t.progressFinished || "已读完") : (t.progressPercent || "{percent}%").replace('{percent}', progressPercent);
    totalReadTimeText = formatDuration(p.recordReadingTime);
    
    if (progressPercent === 100 && p.finishTime) {
      const finishLabel = t.finishTimeLabel || '读完时间：';
      finishTimeText = `<p class="book-details-desc-text"><strong>${finishLabel}</strong>${formatDate(p.finishTime)}</p>`;
    }
  }
  
  const pubLabel = t.publisherLabel || '出版社：';
  const progLabel = t.progressLabel || '阅读进度：';
  const totalTimeLabel = t.totalTimeLabel || '累计时长：';
  const isbnLabel = t.isbnLabel || 'ISBN：';
  const isbnVal = info.isbn || (t.isbnNone || '无');
  const introTitle = t.introTitle || '图书简介';
  const introText = info.intro || (isZh ? "暂无简介。" : "No description available.");
  const openInAppText = t.openInApp || '在微信读书 App 中打开';
  const closeText = t.close || '关闭';
  
  let modalHtml = `
    <div class="book-details-modal-wrapper">
      <img class="book-details-cover" src="${info.cover}" alt="${info.title}" onerror="this.src='https://res.weread.qq.com/wrepub/CB_9bJBOnBOBEl972B71F03W5Ao_parsecover'">
      <div class="book-details-info">
        <h2 class="book-details-title">${info.title}</h2>
        <p class="book-details-author">${info.author} ${info.translator ? `(${isZh ? '译者' : 'Translator'}: ${info.translator})` : ''}</p>
        
        <div class="book-details-meta">
          <span class="badge" style="background-color: var(--primary-ghost); color: var(--primary); border-color: var(--primary-ring)">${ratingText}</span>
          <span class="badge">${info.category || (isZh ? "文学" : "Literature")}</span>
          <span class="badge">${wordCountStr}</span>
        </div>
        
        <div style="margin-top: 10px;">
          <p class="book-details-desc-text"><strong>${pubLabel}</strong>${pubText}</p>
          <p class="book-details-desc-text"><strong>${progLabel}</strong><span style="color:var(--primary); font-weight:600;">${progressText}</span></p>
          <p class="book-details-desc-text"><strong>${totalTimeLabel}</strong>${totalReadTimeText}</p>
          ${finishTimeText}
          <p class="book-details-desc-text"><strong>${isbnLabel}</strong>${isbnVal}</p>
        </div>
      </div>
    </div>
    
    <div class="book-details-desc-box">
      <h4 class="book-details-desc-title">${introTitle}</h4>
      <p class="book-details-desc-text">${introText}</p>
    </div>
    
    <div class="book-details-action-bar">
      <a class="btn btn-primary" href="weread://reading?bId=${info.bookId}">
        <i data-lucide="book-open-text"></i>
        <span>${openInAppText}</span>
      </a>
      <button class="btn btn-secondary" onclick="closeBookDetailModal()">
        <span>${closeText}</span>
      </button>
    </div>
  `;
  
  el.bookDetailBody.innerHTML = modalHtml;
  el.bookDetailModal.classList.add('active');
  lucide.createIcons();
}

function renderAlbumDetails(info, extra) {
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  const isZh = lang === 'zh';
  
  const statusText = info.finishStatus === '已完结' ? (t.finishStatusFinished || '已完结') : (info.finishStatus === '连载中' ? (t.finishStatusOngoing || '连载中') : (info.finishStatus || '连载中'));
  const countStr = info.trackCount ? (t.trackCountText || "{count}集 ({status})").replace('{count}', info.trackCount).replace('{status}', statusText) : (t.trackCountEmpty || '未统计');
  const progressText = info.finish === 1 ? (t.listeningStatusFinished || '已听完') : (t.listeningStatusListening || '在听');
  const secretText = extra.secret === 1 ? (t.secretListening || '私密收听') : (t.publicListening || '公开收听');
  const audiobookText = t.audiobook || '有声书';
  
  const hostLabel = t.hostLabel || '主播/演播：';
  const listenStatusLabel = t.listenStatusLabel || '收听状态：';
  const finishStatusLabel = t.finishStatusLabel || '完结状态：';
  const updateTimeLabel = t.updateTimeLabel || '最新更新：';
  const albumIntroTitle = t.albumIntroTitle || '专辑简介';
  const introText = info.intro || (isZh ? "暂无简介。" : "No description available.");
  const listenInAppText = t.listenInApp || '在微信读书收听';
  const closeText = t.close || '关闭';
  
  let modalHtml = `
    <div class="book-details-modal-wrapper">
      <img class="book-details-cover" src="${info.cover}" alt="${info.name}" onerror="this.src='https://res.weread.qq.com/wrepub/CB_9bJBOnBOBEl972B71F03W5Ao_parsecover'">
      <div class="book-details-info">
        <h2 class="book-details-title">${info.name}</h2>
        <p class="book-details-author">${hostLabel}${info.authorName || (isZh ? "微信读书" : "WeRead")}</p>
        
        <div class="book-details-meta">
          <span class="badge" style="background-color: var(--primary-ghost); color: var(--primary); border-color: var(--primary-ring)">[${audiobookText}]</span>
          <span class="badge">${countStr}</span>
          <span class="badge">${secretText}</span>
        </div>
        
        <div style="margin-top: 10px;">
          <p class="book-details-desc-text"><strong>${listenStatusLabel}</strong><span style="color:var(--primary); font-weight:600;">${progressText}</span></p>
          <p class="book-details-desc-text"><strong>${finishStatusLabel}</strong>${statusText}</p>
          <p class="book-details-desc-text"><strong>${updateTimeLabel}</strong>${formatDate(info.updateTime)}</p>
        </div>
      </div>
    </div>
    
    <div class="book-details-desc-box">
      <h4 class="book-details-desc-title">${albumIntroTitle}</h4>
      <p class="book-details-desc-text">${introText}</p>
    </div>
    
    <div class="book-details-action-bar">
      <a class="btn btn-primary" href="weread://reading?bId=${info.albumId}">
        <i data-lucide="headphones"></i>
        <span>${listenInAppText}</span>
      </a>
      <button class="btn btn-secondary" onclick="closeBookDetailModal()">
        <span>${closeText}</span>
      </button>
    </div>
  `;
  
  el.bookDetailBody.innerHTML = modalHtml;
  el.bookDetailModal.classList.add('active');
  lucide.createIcons();
}

function closeBookDetailModal() {
  el.bookDetailModal.classList.remove('active');
}

// ========================== NOTES VIEWER ==========================

async function openNotesViewer(bookId, title, author) {
  showTopBar(true);
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  
  el.notesViewerTitle.textContent = title;
  el.notesViewerAuthor.textContent = author;
  
  try {
    const [bookmarks, reviews] = await Promise.all([
      callApi('/book/bookmarklist', { bookId }),
      callApi('/review/list/mine', { bookid: bookId, count: 100 })
    ]);
    
    if (bookmarks || reviews) {
      renderNotesList(bookId, bookmarks, reviews);
      el.notesViewerModal.classList.add('active');
    } else {
      showToast(t.notesFetchFailed || "无法加载笔记内容", "error");
    }
  } catch (error) {
    console.error("Error loading book notes:", error);
    showToast(t.notesDataFetchFailed || "获取笔记数据失败", "error");
  } finally {
    showTopBar(false);
  }
}

function renderNotesList(bookId, bookmarks, reviewsData) {
  const lang = settingsState.language;
  const t = i18n[lang] || {};
  const isZh = lang === 'zh';
  
  const underlines = (bookmarks && bookmarks.updated) || [];
  const thoughts = (reviewsData && reviewsData.reviews) || [];
  const chapters = (bookmarks && bookmarks.chapters) || [];
  
  if (underlines.length === 0 && thoughts.length === 0) {
    el.notesViewerBody.innerHTML = `
      <div class="empty-state" style="padding: 40px;">
        <i data-lucide="message-circle"></i>
        <p>${t.emptyChapterNotes || '这本书没有记录任何划线或个人想法。'}</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  const chapterMap = {};
  chapters.forEach(ch => {
    chapterMap[ch.chapterUid] = ch.title;
  });
  
  const chaptersGroup = {};
  
  const getChapterNode = (uid, defaultTitle) => {
    if (!chaptersGroup[uid]) {
      const fallbackTitle = (t.chapterFallback || "章节 {chUid}").replace('{chUid}', uid);
      chaptersGroup[uid] = {
        title: chapterMap[uid] || defaultTitle || fallbackTitle,
        notes: []
      };
    }
    return chaptersGroup[uid];
  };
  
  underlines.forEach(line => {
    const chUid = line.chapterUid;
    const fallbackTitle = (t.chapterFallback || "章节 {chUid}").replace('{chUid}', chUid);
    const node = getChapterNode(chUid, fallbackTitle);
    node.notes.push({
      id: line.bookmarkId,
      type: 'underline',
      text: line.markText,
      createTime: line.createTime,
      range: line.range,
      color: line.colorStyle,
      thought: null
    });
  });
  
  thoughts.forEach(tNode => {
    const rev = tNode.review || {};
    const chUid = rev.chapterUid;
    const chName = rev.chapterName;
    const range = rev.range;
    
    if (range && chUid) {
      const node = getChapterNode(chUid, chName);
      const matchedUnderline = node.notes.find(n => n.type === 'underline' && n.range === range);
      
      if (matchedUnderline) {
        matchedUnderline.thought = {
          id: rev.reviewId,
          content: rev.content,
          createTime: rev.createTime
        };
        return;
      }
    }
    
    const finalUid = chUid || 'book_review';
    const finalTitle = chName || (chUid ? (t.chapterFallback || "章节 {chUid}").replace('{chUid}', chUid) : (t.overallReviewTitle || '整本书评 / 个人点评'));
    const node = getChapterNode(finalUid, finalTitle);
    
    node.notes.push({
      id: rev.reviewId,
      type: 'thought',
      text: rev.content,
      createTime: rev.createTime,
      range: range,
      star: rev.star,
      isFinish: rev.isFinish === 1
    });
  });
  
  const sortedChapters = Object.entries(chaptersGroup).map(([uid, chData]) => {
    chData.notes.sort((a, b) => a.createTime - b.createTime);
    return { uid, title: chData.title, notes: chData.notes };
  });
  
  const sortRank = (uid) => {
    if (uid === 'book_review') return -1;
    const parsed = parseInt(uid);
    return isNaN(parsed) ? 999999 : parsed;
  };
  
  sortedChapters.sort((a, b) => {
    if (a.uid === 'book_review') return -1;
    if (b.uid === 'book_review') return 1;
    return sortRank(a.uid) - sortRank(b.uid);
  });
  
  let notesHtml = '';
  
  sortedChapters.forEach(ch => {
    notesHtml += `
      <div class="notes-chapter-group">
        <h3 class="notes-chapter-title">
          <i data-lucide="hash"></i>
          <span>${ch.title}</span>
        </h3>
    `;
    
    ch.notes.forEach(note => {
      const formattedDate = formatDate(note.createTime);
      
      if (note.type === 'underline') {
        let rangeStart = 0;
        let rangeEnd = 0;
        if (note.range && note.range.includes('-')) {
          const parts = note.range.split('-');
          rangeStart = parts[0];
          rangeEnd = parts[1];
        }
        
        const deepLink = `weread://bestbookmark?bookId=${bookId}&chapterUid=${ch.uid}&rangeStart=${rangeStart}&rangeEnd=${rangeEnd}`;
        const myThoughtLabel = t.myThoughtPrefix || '我的想法：';
        const createTimeLabel = t.createTimePrefix || '创建时间：';
        const locateText = t.locateInApp || '在 App 中定位';
        
        notesHtml += `
          <div class="note-item-box">
            <p class="note-mark-text">${note.text}</p>
            ${note.thought ? `
              <div class="note-thought-text">
                <strong>${myThoughtLabel}</strong>${note.thought.content}
              </div>
            ` : ''}
            <div class="note-meta">
              <span>${createTimeLabel}${formattedDate}</span>
              <a class="note-deep-link" href="${deepLink}">
                <i data-lucide="external-link" style="width:10px;height:10px;"></i>
                ${locateText}
              </a>
            </div>
          </div>
        `;
      } else if (note.type === 'thought') {
        const starText = t.thoughtTypeStar || ' 评分: ';
        const starRating = note.star && note.star > 0 ? `${starText}${'★'.repeat(note.star)}` : '';
        const finishText = t.thoughtTypeFinish || '读完点评';
        const finishTag = note.isFinish ? ` <span class="badge" style="font-size:9px; padding:1px 5px; margin-left:4px;">${finishText}</span>` : '';
        const reviewTitle = t.thoughtTypeReview || '想法/书评';
        const createTimeLabel = t.createTimePrefix || '创建时间：';
        
        notesHtml += `
          <div class="note-item-box" style="border-left-color: var(--accent)">
            <div class="note-thought-text" style="background:transparent; border:none; padding:0;">
              <strong>${reviewTitle}${starRating}${finishTag}：</strong>
              <p style="margin-top:6px; color:var(--text-primary); font-style:normal">${note.text}</p>
            </div>
            <div class="note-meta">
              <span>${createTimeLabel}${formattedDate}</span>
            </div>
          </div>
        `;
      }
    });
    
    notesHtml += `</div>`;
  });
  
  el.notesViewerBody.innerHTML = notesHtml;
  lucide.createIcons();
}

function closeNotesViewerModal() {
  el.notesViewerModal.classList.remove('active');
}

// ========================== UTILITIES ==========================

function formatDuration(seconds) {
  const isZh = settingsState.language === 'zh';
  if (!seconds || seconds <= 0) return isZh ? "0 分钟" : "0 mins";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return isZh ? `${hours} 小时 ${minutes} 分钟` : `${hours}h ${minutes}m`;
  }
  return isZh ? `${minutes} 分钟` : `${minutes} mins`;
}

function formatDate(timestamp) {
  if (!timestamp) return "--";
  const date = new Date(timestamp * 1000);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
