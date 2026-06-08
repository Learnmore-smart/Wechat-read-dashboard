// WeChat Reading Dashboard — Frontend Application v2.0
// Premium, sleek loading experience with top progress bar + skeletons

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
  sidebarBtns: document.querySelectorAll('.menu-item'),
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

// Tab metadata
const tabMeta = {
  dashboard: { title: '阅读大盘', subtitle: '查看本月阅读统计及最近阅读偏好' },
  bookshelf: { title: '我的书架', subtitle: '管理你的书架条目，支持分类检索与私密阅读管理' },
  notes: { title: '阅读笔记', subtitle: '回顾与导出你在阅读过程中划下的段落与发表的想法' },
  recommend: { title: '发现好书', subtitle: '根据你的阅读习惯个性化推荐的优质好书与有声书' }
};

// ========================== INIT ==========================

document.addEventListener('DOMContentLoaded', async () => {
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
      
      const meta = tabMeta[tabId] || { title: '控制台', subtitle: '' };
      el.pageTitle.textContent = meta.title;
      
      if (tabId === 'dashboard') {
        const subtitleMap = {
          weekly: '查看本周阅读统计及最近阅读偏好',
          monthly: '查看本月阅读统计及最近阅读偏好',
          annually: '查看本年阅读统计及最近阅读偏好',
          overall: '查看生涯累计阅读统计及最近阅读偏好'
        };
        el.pageSubtitle.textContent = subtitleMap[state.statsMode] || meta.subtitle;
      } else {
        el.pageSubtitle.textContent = meta.subtitle;
      }
      
      state.activeTab = tabId;
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
          
          const titleMap = {
            weekly: '周度每日阅读时长 (秒)',
            monthly: '月度每日阅读时长 (秒)',
            annually: '年度每月阅读时长 (秒)',
            overall: '总计每年阅读时长 (秒)'
          };
          const titleEl = document.getElementById('activity-chart-title');
          if (titleEl) titleEl.textContent = titleMap[mode];
          
          if (state.activeTab === 'dashboard') {
            const subtitleMap = {
              weekly: '查看本周阅读统计及最近阅读偏好',
              monthly: '查看本月阅读统计及最近阅读偏好',
              annually: '查看本年阅读统计及最近阅读偏好',
              overall: '查看生涯累计阅读统计及最近阅读偏好'
            };
            el.pageSubtitle.textContent = subtitleMap[mode] || tabMeta.dashboard.subtitle;
          }
          
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
  window.addEventListener('click', (e) => {
    if (e.target === el.bookDetailModal) closeBookDetailModal();
    if (e.target === el.notesViewerModal) closeNotesViewerModal();
  });
  
  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBookDetailModal();
      closeNotesViewerModal();
    }
  });
}

// ========================== DATA LOADING ==========================

async function refreshAllData() {
  showLoading(true, "正在同步微信读书数据...");
  
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
    
    showToast("数据同步完成", "success");
  } catch (error) {
    console.error("Error loading WeChat Reading data:", error);
    showToast("同步微信读书数据失败，请检查网络或 .env 密钥配置", "error");
  } finally {
    state.isInitialLoad = false;
    showLoading(false);
  }
}

// ========================== API CALLER ==========================

async function callApi(apiName, params = {}) {
  try {
    const response = await fetch('/api/weread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_name: apiName, ...params })
    });
    
    const data = await response.json();
    if (data.errcode && data.errcode !== 0) {
      showToast(data.errmsg || `接口调用错误: ${apiName}`, "error");
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
function showLoading(show, message = "加载中...") {
  if (show) {
    el.loadingOverlay.classList.remove('fade-out');
    const textEl = el.loadingOverlay.querySelector('.loading-text');
    if (textEl) textEl.textContent = message;
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
  
  // Update header labels dynamically
  if (el.headerTimeLabel) {
    const timeLabelMap = {
      weekly: '本周时长',
      monthly: '本月时长',
      annually: '本年时长',
      overall: '累计时长'
    };
    el.headerTimeLabel.textContent = timeLabelMap[mode] || '本月时长';
  }
  
  if (el.headerDaysLabel) {
    const daysLabelMap = {
      weekly: '周有效天',
      monthly: '有效天数',
      annually: '年有效天',
      overall: '累计天数'
    };
    el.headerDaysLabel.textContent = daysLabelMap[mode] || '有效天数';
  }

  if (state.monthlyData) {
    const totalSecs = state.monthlyData.totalReadTime || 0;
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    el.headerTime.textContent = `${hours}h ${mins}m`;
    el.headerDays.textContent = `${state.monthlyData.readDays || 0}天`;
  }
  
  if (state.notebooksData) {
    el.headerNotes.textContent = `${state.notebooksData.totalNoteCount || 0}条`;
  }
}

// 2. Dashboard
function renderDashboard() {
  if (!state.monthlyData) return;
  
  const d = state.monthlyData;
  const mode = state.statsMode || 'monthly';
  
  // Update dashboard stat card titles dynamically
  if (el.dashTotalTimeLabel) {
    const totalTimeLabelMap = {
      weekly: '本周阅读时间',
      monthly: '本月阅读时间',
      annually: '本年阅读时间',
      overall: '累计阅读时间'
    };
    el.dashTotalTimeLabel.textContent = totalTimeLabelMap[mode] || '总阅读时间';
  }
  
  if (el.dashReadDaysLabel) {
    const readDaysLabelMap = {
      weekly: '本周阅读天数',
      monthly: '本月阅读天数',
      annually: '本年阅读天数',
      overall: '累计阅读天数'
    };
    el.dashReadDaysLabel.textContent = readDaysLabelMap[mode] || '累计阅读天数';
  }
  
  el.dashTotalTime.textContent = formatDuration(d.totalReadTime);
  el.dashReadDays.textContent = `${d.readDays || 0} 天`;
  
  // Calculate average
  let avgSecs = d.dayAverageReadTime;
  let avgSubtitle = "按本月自然日平均";
  
  if (state.statsMode === 'weekly') {
    avgSubtitle = "按本周自然日平均";
    if (avgSecs === undefined || avgSecs === null) {
      const now = new Date();
      const day = now.getDay();
      const elapsedDays = day === 0 ? 7 : day;
      avgSecs = Math.floor((d.totalReadTime || 0) / elapsedDays);
    }
  } else if (state.statsMode === 'monthly') {
    avgSubtitle = "按本月自然日平均";
    if (avgSecs === undefined || avgSecs === null) {
      const now = new Date();
      const elapsedDays = now.getDate();
      avgSecs = Math.floor((d.totalReadTime || 0) / elapsedDays);
    }
  } else if (state.statsMode === 'annually') {
    avgSubtitle = "按本年自然日平均";
    if (avgSecs === undefined || avgSecs === null) {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const elapsedDays = Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24));
      avgSecs = Math.floor((d.totalReadTime || 0) / elapsedDays);
    }
  } else if (state.statsMode === 'overall') {
    avgSubtitle = "按注册以来自然日平均";
    if (avgSecs === undefined || avgSecs === null) {
      if (d.registTime) {
        const elapsedDays = Math.max(1, Math.ceil((Date.now() / 1000 - d.registTime) / 86400));
        avgSecs = Math.floor((d.totalReadTime || 0) / elapsedDays);
      } else {
        avgSubtitle = "按有效阅读天数平均";
        avgSecs = Math.floor((d.totalReadTime || 0) / Math.max(1, d.readDays || 1));
      }
    }
  }

  el.dashAvgTime.textContent = `${Math.round((avgSecs || 0) / 60)} 分钟`;
  if (el.dashAvgTimeSubtitle) {
    el.dashAvgTimeSubtitle.textContent = avgSubtitle;
  }
  
  // Trend
  if (d.compare !== undefined && d.compare !== null) {
    const compVal = d.compare * 100;
    if (compVal > 0) {
      el.dashCompareTime.innerHTML = `较上周/周期 <span class="trend-up"><i data-lucide="trending-up" style="display:inline-block;width:12px;height:12px;vertical-align:middle;"></i> 增加 ${compVal.toFixed(1)}%</span>`;
    } else if (compVal < 0) {
      el.dashCompareTime.innerHTML = `较上周/周期 <span class="trend-down"><i data-lucide="trending-down" style="display:inline-block;width:12px;height:12px;vertical-align:middle;"></i> 减少 ${Math.abs(compVal).toFixed(1)}%</span>`;
    } else {
      el.dashCompareTime.textContent = `较上周/周期持平`;
    }
  } else {
    el.dashCompareTime.textContent = `首个记录周期或上期无数据`;
  }
  
  // Habits
  el.habitTimeWord.textContent = d.preferTimeWord || "数据分析积累中...";
  el.habitCategoryWord.textContent = d.preferCategoryWord || "数据分析积累中...";
  if (d.readRate !== undefined) {
    el.habitReadRate.textContent = `电子书占比 ${d.readRate}% / 听书占比 ${(100 - d.readRate)}%`;
  } else {
    el.habitReadRate.textContent = "仅文字阅读或听书比例不足";
  }

  renderDailyActivityChart(d.readTimes);
  renderCategoryPreferences(d.preferCategory);
  renderLongestReads(d.readLongest);
}

// Bar chart
function renderDailyActivityChart(readTimes) {
  if (!readTimes || Object.keys(readTimes).length === 0) {
    el.barChartContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="bar-chart-3"></i>
        <p>无阅读时长明细数据</p>
      </div>
    `;
    return;
  }
  
  const daysOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dailyData = Object.entries(readTimes).map(([ts, val]) => {
    const date = new Date(parseInt(ts) * 1000);
    let label = "";
    let shortLabel = "";
    
    if (state.statsMode === 'weekly') {
      label = daysOfWeek[date.getDay()];
      shortLabel = label;
    } else if (state.statsMode === 'monthly') {
      label = `${date.getMonth() + 1}月${date.getDate()}日`;
      shortLabel = `${date.getDate()}`;
    } else if (state.statsMode === 'annually') {
      label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      shortLabel = `${date.getMonth() + 1}月`;
    } else {
      label = `${date.getFullYear()}年`;
      shortLabel = label;
    }
    
    return { timestamp: parseInt(ts), label, shortLabel, value: val };
  }).sort((a, b) => a.timestamp - b.timestamp);
  
  const maxVal = Math.max(...dailyData.map(d => d.value), 60);
  
  let chartHtml = `<div class="bar-chart-wrapper">`;
  
  dailyData.forEach((day, i) => {
    const heightPercent = (day.value / maxVal) * 100;
    const readableTime = day.value > 0 ? formatDuration(day.value) : "未阅读";
    
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
  if (!preferCategory || preferCategory.length === 0) {
    el.preferCategoryContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="pie-chart"></i>
        <p>无品类偏好数据</p>
      </div>
    `;
    return;
  }
  
  const sorted = [...preferCategory].sort((a, b) => b.val - a.val);
  
  let prefHtml = `<div class="pref-list">`;
  
  sorted.slice(0, 5).forEach(cat => {
    const progressPercent = cat.val <= 1 ? (cat.val * 100).toFixed(0) : cat.val;
    const timeText = formatDuration(cat.readingTime);
    
    prefHtml += `
      <div class="pref-item">
        <div class="pref-header">
          <span class="pref-title">${cat.categoryTitle}</span>
          <span class="pref-value">${timeText} (${cat.readingCount}本)</span>
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
  if (!readLongest || readLongest.length === 0) {
    el.dashRankList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="trophy"></i>
        <p>无书籍阅读排行</p>
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
    
    rankHtml += `
      <div class="rank-item" onclick="openBookDetails('${id}', ${isAlbum})">
        <div class="rank-number">${index + 1}</div>
        <img class="rank-cover" src="${cover}" alt="${title}" onerror="this.src='https://res.weread.qq.com/wrepub/CB_9bJBOnBOBEl972B71F03W5Ao_parsecover'">
        <div class="rank-info">
          <div class="rank-title">${title} ${tags}</div>
          <div class="rank-author">${isAlbum ? '[有声书] ' : ''}${author}</div>
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
      category: b.category || "未分类",
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
      category: "有声书",
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
        <p>未找到符合筛选条件的书籍</p>
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
            <span style="font-size:11px; font-weight:600; color:var(--blue-300)">收藏夹</span>
          </div>
          <div class="book-card-badge"><i data-lucide="lock"></i></div>
        </div>
        <div class="book-card-info">
          <div class="book-card-title">公众号文章收藏</div>
          <div class="book-card-author">微信公众号文章</div>
          <div class="book-card-footer">
            <span class="book-card-category">文章收藏</span>
            <span class="book-card-percentage">私密</span>
          </div>
        </div>
      </div>
    `;
  }
  
  items.forEach(item => {
    const topBadge = item.isTop ? `<div class="book-card-badge" style="left:8px; right:auto; background:var(--primary); color:var(--text-inverted); border:none;"><i data-lucide="pin"></i></div>` : '';
    const secretBadge = item.secret ? `<div class="book-card-badge" style="right:8px; left:auto;"><i data-lucide="lock"></i></div>` : '';
    const progressText = item.finishReading ? "已读完" : "在读";
    const progressColor = item.finishReading ? "var(--text-tertiary)" : "var(--primary)";
    const progressPercent = item.finishReading ? 100 : 0;
    
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
          <div class="book-card-author">${item.isAlbum ? '[有声书] ' : ''}${item.author}</div>
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
  
  const books = state.notebooksData.books || [];
  el.notesTotalBooks.textContent = state.notebooksData.totalBookCount || books.length;
  
  if (books.length === 0) {
    el.notebooksGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 60px;">
        <i data-lucide="notebook-pen"></i>
        <p>暂无读书笔记数据</p>
      </div>
    `;
    return;
  }
  
  let gridHtml = '';
  
  books.forEach(item => {
    const book = item.book || {};
    const totalCount = (item.reviewCount || 0) + (item.noteCount || 0) + (item.bookmarkCount || 0);
    
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
              <span>${totalCount}笔记</span>
            </span>
            <span class="notebook-meta-badge" title="高亮划线数">
              <i data-lucide="highlighter"></i>
              <span>${item.noteCount || 0}</span>
            </span>
            <span class="notebook-meta-badge" title="想法点评数">
              <i data-lucide="message-circle"></i>
              <span>${item.reviewCount || 0}</span>
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
  
  const books = state.recommendData.books;
  
  if (books.length === 0) {
    el.recommendGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 60px;">
        <i data-lucide="wand-sparkles"></i>
        <p>未加载到推荐好书</p>
      </div>
    `;
    return;
  }
  
  let gridHtml = '';
  
  books.forEach(b => {
    const ratingText = b.newRating ? `${Math.round(b.newRating)}% 推荐值` : '暂无评分';
    const reasonText = b.reason ? `<div style="font-size:11px; color:var(--primary); margin-top:6px; font-weight:600;">✦ ${b.reason}</div>` : '';
    
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
        <p class="recommend-intro">${b.intro || "暂无书籍简介。"}</p>
      </div>
    `;
  });
  
  el.recommendGrid.innerHTML = gridHtml;
  lucide.createIcons();
}

// ========================== MODALS ==========================

async function openBookDetails(bookId, isAlbum) {
  showTopBar(true);
  try {
    if (isAlbum) {
      const album = state.shelfData.albums.find(a => a.albumInfo.albumId === bookId);
      if (album) {
        renderAlbumDetails(album.albumInfo, album.albumInfoExtra);
      } else {
        showToast("未找到有声书信息", "error");
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
      showToast("获取书籍详情失败", "error");
    }
  } catch (err) {
    console.error("Error fetching book detail:", err);
  } finally {
    showTopBar(false);
  }
}

function renderBookDetailsModal(info, progress) {
  const ratingText = info.newRating ? `${info.newRating}% 好评率 (${info.newRatingCount || 0}人评分)` : '暂无评分';
  const wordCountStr = info.wordCount ? `${Math.round(info.wordCount / 10000)} 万字` : '未统计';
  const pubText = info.publisher ? `${info.publisher} / ${info.publishTime || "未知"}` : '未知出版社';
  
  let progressText = '未开始';
  let progressPercent = 0;
  let totalReadTimeText = '0 小时 0 分钟';
  let finishTimeText = '';
  
  if (progress && progress.book) {
    const p = progress.book;
    progressPercent = p.progress || 0;
    progressText = `${progressPercent}%`;
    totalReadTimeText = formatDuration(p.recordReadingTime);
    
    if (progressPercent === 100 && p.finishTime) {
      progressText = "已读完";
      finishTimeText = `<p class="book-details-desc-text"><strong>读完时间：</strong>${formatDate(p.finishTime)}</p>`;
    }
  }
  
  let modalHtml = `
    <div class="book-details-modal-wrapper">
      <img class="book-details-cover" src="${info.cover}" alt="${info.title}" onerror="this.src='https://res.weread.qq.com/wrepub/CB_9bJBOnBOBEl972B71F03W5Ao_parsecover'">
      <div class="book-details-info">
        <h2 class="book-details-title">${info.title}</h2>
        <p class="book-details-author">${info.author} ${info.translator ? `(译者: ${info.translator})` : ''}</p>
        
        <div class="book-details-meta">
          <span class="badge" style="background-color: var(--primary-ghost); color: var(--primary); border-color: var(--primary-ring)">${ratingText}</span>
          <span class="badge">${info.category || "文学"}</span>
          <span class="badge">${wordCountStr}</span>
        </div>
        
        <div style="margin-top: 10px;">
          <p class="book-details-desc-text"><strong>出版社：</strong>${pubText}</p>
          <p class="book-details-desc-text"><strong>阅读进度：</strong><span style="color:var(--primary); font-weight:600;">${progressText}</span></p>
          <p class="book-details-desc-text"><strong>累计时长：</strong>${totalReadTimeText}</p>
          ${finishTimeText}
          <p class="book-details-desc-text"><strong>ISBN：</strong>${info.isbn || '无'}</p>
        </div>
      </div>
    </div>
    
    <div class="book-details-desc-box">
      <h4 class="book-details-desc-title">图书简介</h4>
      <p class="book-details-desc-text">${info.intro || "暂无简介。"}</p>
    </div>
    
    <div class="book-details-action-bar">
      <a class="btn btn-primary" href="weread://reading?bId=${info.bookId}">
        <i data-lucide="book-open-text"></i>
        <span>在微信读书 App 中打开</span>
      </a>
      <button class="btn btn-secondary" onclick="closeBookDetailModal()">
        <span>关闭</span>
      </button>
    </div>
  `;
  
  el.bookDetailBody.innerHTML = modalHtml;
  el.bookDetailModal.classList.add('active');
  lucide.createIcons();
}

function renderAlbumDetails(info, extra) {
  const countStr = info.trackCount ? `${info.trackCount}集 (${info.finishStatus || "连载中"})` : '未统计';
  let progressText = '在听';
  if (info.finish === 1) progressText = '已听完';
  const secretText = extra.secret === 1 ? '私密收听' : '公开收听';
  
  let modalHtml = `
    <div class="book-details-modal-wrapper">
      <img class="book-details-cover" src="${info.cover}" alt="${info.name}" onerror="this.src='https://res.weread.qq.com/wrepub/CB_9bJBOnBOBEl972B71F03W5Ao_parsecover'">
      <div class="book-details-info">
        <h2 class="book-details-title">${info.name}</h2>
        <p class="book-details-author">主播/演播：${info.authorName || "微信读书"}</p>
        
        <div class="book-details-meta">
          <span class="badge" style="background-color: var(--primary-ghost); color: var(--primary); border-color: var(--primary-ring)">[有声书]</span>
          <span class="badge">${countStr}</span>
          <span class="badge">${secretText}</span>
        </div>
        
        <div style="margin-top: 10px;">
          <p class="book-details-desc-text"><strong>收听状态：</strong><span style="color:var(--primary); font-weight:600;">${progressText}</span></p>
          <p class="book-details-desc-text"><strong>完结状态：</strong>${info.finishStatus || "连载中"}</p>
          <p class="book-details-desc-text"><strong>最新更新：</strong>${formatDate(info.updateTime)}</p>
        </div>
      </div>
    </div>
    
    <div class="book-details-desc-box">
      <h4 class="book-details-desc-title">专辑简介</h4>
      <p class="book-details-desc-text">${info.intro || "暂无简介。"}</p>
    </div>
    
    <div class="book-details-action-bar">
      <a class="btn btn-primary" href="weread://reading?bId=${info.albumId}">
        <i data-lucide="headphones"></i>
        <span>在微信读书收听</span>
      </a>
      <button class="btn btn-secondary" onclick="closeBookDetailModal()">
        <span>关闭</span>
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
      showToast("无法加载笔记内容", "error");
    }
  } catch (error) {
    console.error("Error loading book notes:", error);
    showToast("获取笔记数据失败", "error");
  } finally {
    showTopBar(false);
  }
}

function renderNotesList(bookId, bookmarks, reviewsData) {
  const underlines = (bookmarks && bookmarks.updated) || [];
  const thoughts = (reviewsData && reviewsData.reviews) || [];
  const chapters = (bookmarks && bookmarks.chapters) || [];
  
  if (underlines.length === 0 && thoughts.length === 0) {
    el.notesViewerBody.innerHTML = `
      <div class="empty-state" style="padding: 40px;">
        <i data-lucide="message-circle"></i>
        <p>这本书没有记录任何划线或个人想法。</p>
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
      chaptersGroup[uid] = {
        title: chapterMap[uid] || defaultTitle || `章节 UID: ${uid}`,
        notes: []
      };
    }
    return chaptersGroup[uid];
  };
  
  underlines.forEach(line => {
    const chUid = line.chapterUid;
    const node = getChapterNode(chUid, `章节 ${chUid}`);
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
    const finalTitle = chName || (chUid ? `章节 ${chUid}` : '整本书评 / 个人点评');
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
  
  sortedChapters.sort((a, b) => {
    if (a.uid === 'book_review') return -1;
    if (b.uid === 'book_review') return 1;
    return parseInt(a.uid) - parseInt(b.uid);
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
        
        notesHtml += `
          <div class="note-item-box">
            <p class="note-mark-text">${note.text}</p>
            ${note.thought ? `
              <div class="note-thought-text">
                <strong>我的想法：</strong>${note.thought.content}
              </div>
            ` : ''}
            <div class="note-meta">
              <span>创建时间：${formattedDate}</span>
              <a class="note-deep-link" href="${deepLink}">
                <i data-lucide="external-link" style="width:10px;height:10px;"></i>
                在 App 中定位
              </a>
            </div>
          </div>
        `;
      } else if (note.type === 'thought') {
        const starRating = note.star && note.star > 0 ? ` 评分: ${'★'.repeat(note.star)}` : '';
        const finishTag = note.isFinish ? ` <span class="badge" style="font-size:9px; padding:1px 5px; margin-left:4px;">读完点评</span>` : '';
        
        notesHtml += `
          <div class="note-item-box" style="border-left-color: var(--accent)">
            <div class="note-thought-text" style="background:transparent; border:none; padding:0;">
              <strong>想法/书评${starRating}${finishTag}：</strong>
              <p style="margin-top:6px; color:var(--text-primary); font-style:normal">${note.text}</p>
            </div>
            <div class="note-meta">
              <span>创建时间：${formattedDate}</span>
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
  if (!seconds || seconds <= 0) return "0 分钟";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟`;
  }
  return `${minutes} 分钟`;
}

function formatDate(timestamp) {
  if (!timestamp) return "--";
  const date = new Date(timestamp * 1000);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
