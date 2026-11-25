(function () {
  const API_URL =
    'https://script.google.com/macros/s/AKfycbygTCIxrX1eWcEpFbudgIK1gt4Li_PDlUR0w9_s7c-g_vtxjpQOaYxkIf7Fum4JXctT/exec';
  const CACHE_PREFIX = 'bpd_dashboard_cache_2026_';
  const UK_MONTHS = [
    'Січень',
    'Лютий',
    'Березень',
    'Квітень',
    'Травень',
    'Червень',
    'Липень',
    'Серпень',
    'Вересень',
    'Жовтень',
    'Листопад',
    'Грудень'
  ];
  const CHART_COLORS = [
    '#2563EB',
    '#059669',
    '#D97706',
    '#7C3AED',
    '#E11D48',
    '#0891B2',
    '#65A30D',
    '#EA580C',
    '#4F46E5',
    '#BE185D'
  ];

  const TAB_ORDER = [
    'bvpd',
    'bppd',
    'dkp',
    'journal2026',
    'terminations',
    'replacements',
    'ukrposhta',
    'poa'
  ];

  const TAB_CONFIG = {
    bvpd: {
      title: 'БВПД 2026',
      subtitle: 'Реєстрація звернень про надання безоплатної вторинної правничої допомоги',
      showDiscipline: true,
      slices: [
        { id: 'status', label: 'За статусом особи', subtitle: 'Розподіл за статусом особи', path: 'extra.status' },
        { id: 'category', label: 'За категорією права', subtitle: 'Розподіл за категорією права', path: 'extra.category' },
        { id: 'bureau', label: 'За бюро', subtitle: 'Розподіл за бюро відділу', path: 'byBureau' }
      ]
    },
    bppd: {
      title: 'БППД 2026',
      subtitle: 'Надання безоплатної первинної правничої допомоги у розрізі видів',
      showDiscipline: false,
      slices: [
        { id: 'category', label: 'За категорією права', subtitle: 'Розподіл за категорією права', path: 'extra.category' },
        { id: 'type', label: 'За видом БППД', subtitle: 'Розподіл за видом БППД', path: 'extra.type' },
        { id: 'bureau', label: 'За бюро', subtitle: 'Розподіл за бюро відділу', path: 'byBureau' }
      ]
    },
    dkp: {
      title: 'ДКП',
      subtitle: 'Консультування в установах виконання покарань та на виїзних точках ДКП',
      showDiscipline: false,
      slices: [
        { id: 'pointName', label: 'За назвою ДКП', subtitle: 'Розподіл за назвою точки ДКП', path: 'extra.pointName' },
        { id: 'category', label: 'За категорією права', subtitle: 'Розподіл за категорією права', path: 'extra.category' },
        { id: 'bureau', label: 'За бюро', subtitle: 'Розподіл за бюро відділу', path: 'byBureau' }
      ]
    },
    journal2026: {
      title: 'Журнал 2026',
      subtitle: 'Контроль реєстрації, завантаження карток у КІАС та скан-копій',
      showDiscipline: true,
      slices: [
        { id: 'state', label: 'За станом', subtitle: 'Розподіл за станом розгляду', path: 'extra.state' },
        { id: 'assigned', label: 'За уповноваженим', subtitle: 'Розподіл за уповноваженим', path: 'extra.assigned' },
        { id: 'inKias', label: 'Завантажено в КІАС', subtitle: 'Стан завантаження в КІАС', path: 'extra.inKias' },
        { id: 'hasScan', label: 'Наявність скану', subtitle: 'Стан завантаження скан-копій', path: 'extra.hasScan' }
      ]
    },
    terminations: {
      title: 'Журнал припинення',
      subtitle: 'Облік рішень про припинення надання безоплатної вторинної правничої допомоги',
      showDiscipline: false,
      slices: [
        { id: 'notes', label: 'За примітками', subtitle: 'Розподіл за примітками', path: 'extra.notes' }
      ]
    },
    replacements: {
      title: 'Журнал Замін',
      subtitle: 'Облік замін адвокатів та юристів за дорученнями',
      showDiscipline: false,
      slices: [
        { id: 'replacedWith', label: 'На кого замінено', subtitle: 'Розподіл за виконавцем заміни', path: 'extra.replacedWith' },
        { id: 'notes', label: 'За примітками', subtitle: 'Розподіл за примітками', path: 'extra.notes' }
      ]
    },
    ukrposhta: {
      title: 'Реєстр Укрпошта',
      subtitle: 'Облік поштових відправлень, витрат на марки та статусів доставки',
      showDiscipline: false,
      slices: [
        { id: 'byStatus', label: 'За статусом відправлення', subtitle: 'Розподіл за статусом відправлення', path: 'byStatus' },
        { id: 'byStampType', label: 'За номіналом марок', subtitle: 'Розподіл за номіналом марок', path: 'byStampType' }
      ]
    },
    poa: {
      title: 'Довіреності 2026',
      subtitle: 'Реєстр виданих довіреностей на представництво інтересів',
      showDiscipline: false,
      slices: [
        { id: 'handedOver', label: 'Видано на руки', subtitle: 'Стан видачі довіреностей на руки', path: 'extra.handedOver' }
      ]
    }
  };

  // State
  let selectedFrom = '';
  let selectedTo = '';
  let selectedBureau = '';
  let activePeriodLabel = 'Весь 2026 рік';
  let activeTab = 'bvpd';
  let activeSlice = 'status';
  let currentData = null;
  let knownBureaus = new Set();
  let requestSeq = 0;
  let activeAbortController = null;
  let isLoading = false;
  const charts = { bar: null, doughnut: null, line: null };

  // DOM Elements
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeLabel = document.getElementById('theme-label');

  const errorBanner = document.getElementById('error-banner');
  const errorMessageText = document.getElementById('error-message-text');
  const retryFetchBtn = document.getElementById('retry-fetch-btn');

  const statusBadge = document.getElementById('status-badge');
  const statusDot = document.getElementById('status-dot');
  const statusPeriodLabel = document.getElementById('status-period-label');
  const lastUpdatedLabel = document.getElementById('last-updated-label');
  const openReportBtn = document.getElementById('open-report-btn');
  const refreshDataBtn = document.getElementById('refresh-data-btn');
  const refreshIcon = document.getElementById('refresh-icon');

  const presetBtns = Array.from(document.querySelectorAll('.preset-btn'));
  const dateFromInput = document.getElementById('date-from');
  const dateToInput = document.getElementById('date-to');
  const applyDatesBtn = document.getElementById('apply-dates-btn');
  const bureauFilterGroup = document.getElementById('bureau-filter-group');
  const bureauIndicator = document.getElementById('bureau-indicator');

  const journalTabBtns = Array.from(document.querySelectorAll('.journal-tab'));
  const journalTitleEl = document.getElementById('journal-title');
  const journalSubtitleEl = document.getElementById('journal-subtitle');
  const bureauBadgesEl = document.getElementById('bureau-badges');
  const kpiGridEl = document.getElementById('kpi-grid');
  const disciplinePanelEl = document.getElementById('discipline-panel');

  const barSkeletonEl = document.getElementById('bar-chart-skeleton');
  const barWrapperEl = document.getElementById('bar-chart-wrapper');
  const barCanvas = document.getElementById('bar-chart-canvas');
  const barEmptyEl = document.getElementById('bar-chart-empty');

  const doughnutSubtitleEl = document.getElementById('doughnut-subtitle');
  const doughnutSliceBtnsEl = document.getElementById('doughnut-slice-buttons');
  const doughnutSkeletonEl = document.getElementById('doughnut-skeleton');
  const doughnutContentWrap = document.getElementById('doughnut-content-wrap');
  const doughnutCanvas = document.getElementById('doughnut-chart-canvas');
  const doughnutTotalEl = document.getElementById('doughnut-total');
  const doughnutLegendEl = document.getElementById('doughnut-legend');
  const doughnutEmptyEl = document.getElementById('doughnut-empty');

  const lineCardEl = document.getElementById('line-chart-card');
  const lineSubtitleEl = document.getElementById('line-chart-subtitle');
  const linePeakBadgeEl = document.getElementById('line-peak-badge');
  const lineSkeletonEl = document.getElementById('line-chart-skeleton');
  const lineCanvasWrap = document.getElementById('line-chart-canvas-wrap');
  const lineCanvas = document.getElementById('line-chart-canvas');

  const employeeSearchInput = document.getElementById('employee-search');
  const tableSkeletonEl = document.getElementById('table-skeleton');
  const ratingTableWrap = document.getElementById('rating-table-wrap');
  const ratingTheadEl = document.getElementById('rating-thead');
  const ratingTbodyEl = document.getElementById('rating-tbody');
  const tableEmptyEl = document.getElementById('table-empty-state');

  const reportModal = document.getElementById('report-modal');
  const reportModalSubtitle = document.getElementById('report-modal-subtitle');
  const closeReportBtn = document.getElementById('close-report-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const copyReportBtn = document.getElementById('copy-report-btn');
  const copyReportLabel = document.getElementById('copy-report-label');
  const printReportBtn = document.getElementById('print-report-btn');

  // Utilities
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtNum(n) {
    return Number(n || 0).toLocaleString('uk-UA');
  }

  function fmtMoney(n) {
    return Number(n || 0).toLocaleString('uk-UA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function fmtPct(part, total) {
    if (!total || total <= 0) return '0.0';
    return ((Number(part || 0) / Number(total)) * 100).toFixed(1);
  }

  function formatDateISO(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function formatDateUA(isoStr) {
    if (!isoStr || isoStr.indexOf('-') === -1) return isoStr || '';
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  function getNested(obj, path) {
    if (!obj || !path) return {};
    return path.split('.').reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : null;
    }, obj) || {};
  }

  function sortEntriesDesc(obj, excludeUnspecified) {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj)
      .filter(function (entry) {
        const key = String(entry[0] || '').trim();
        const val = Number(entry[1] || 0);
        if (val <= 0) return false;
        if (excludeUnspecified && (!key || key === 'Не вказано')) return false;
        return true;
      })
      .sort(function (a, b) {
        if (b[1] !== a[1]) return b[1] - a[1];
        return String(a[0]).localeCompare(String(b[0]), 'uk', { numeric: true });
      });
  }

  function getMaxEntry(obj) {
    const clean = sortEntriesDesc(obj, true);
    if (clean.length > 0) return { key: clean[0][0], value: clean[0][1] };
    const fallback = sortEntriesDesc(obj, false);
    if (fallback.length > 0) return { key: fallback[0][0] || 'Не вказано', value: fallback[0][1] };
    return { key: '—', value: 0 };
  }

  function getCaseInsensitiveSum(obj, targetLower) {
    if (!obj || typeof obj !== 'object') return 0;
    let sum = 0;
    Object.keys(obj).forEach(function (k) {
      if (String(k).trim().toLowerCase() === targetLower) {
        sum += Number(obj[k] || 0);
      }
    });
    return sum;
  }

  function parseMonthKey(key) {
    const m = String(key || '').match(/^(\d{1,2})\.(\d{4})$/);
    if (!m) return null;
    const month = parseInt(m[1], 10);
    const year = parseInt(m[2], 10);
    if (month < 1 || month > 12) return null;
    return { month: month, year: year, sortVal: year * 12 + month };
  }

  function sortMonthEntries(byMonth) {
    if (!byMonth || typeof byMonth !== 'object') return [];
    return Object.entries(byMonth)
      .filter(function (entry) {
        return Number(entry[1] || 0) > 0;
      })
      .sort(function (a, b) {
        const pa = parseMonthKey(a[0]);
        const pb = parseMonthKey(b[0]);
        if (pa && pb) return pa.sortVal - pb.sortVal;
        if (pa) return -1;
        if (pb) return 1;
        return String(a[0]).localeCompare(String(b[0]));
      });
  }

  function formatMonthLabel(key, shortForm) {
    const parsed = parseMonthKey(key);
    if (!parsed) return String(key);
    const full = UK_MONTHS[parsed.month - 1];
    if (shortForm) {
      return full.slice(0, 3) + ' ' + parsed.year;
    }
    return full + ' ' + parsed.year;
  }

  function getBppdTypes(bppd) {
    const typeMap = (bppd && bppd.extra && bppd.extra.type) || {};
    return Object.keys(typeMap).sort(function (a, b) {
      if (a === 'Не вказано') return 1;
      if (b === 'Не вказано') return -1;
      const diff = Number(typeMap[b] || 0) - Number(typeMap[a] || 0);
      return diff !== 0 ? diff : a.localeCompare(b, 'uk');
    });
  }

  function getShortBppdHeader(typeName) {
    if (typeName === 'Правова інформація') return 'Правова інф.';
    if (typeName === 'Надання консультацій і роз\'яснень') return 'Консультації';
    if (typeName === 'Складення документів непроцесуального характеру') return 'Документи';
    return typeName;
  }

  // Theme Sync
  function applyTheme(isDark) {
    if (isDark) {
      root.classList.add('dark');
      themeIcon.textContent = 'light_mode';
      themeLabel.textContent = 'Світла тема';
      themeToggle.setAttribute('aria-pressed', 'true');
    } else {
      root.classList.remove('dark');
      themeIcon.textContent = 'dark_mode';
      themeLabel.textContent = 'Темна тема';
      themeToggle.setAttribute('aria-pressed', 'false');
    }
  }

  let initialDark = root.classList.contains('dark');
  try {
    const savedTheme = localStorage.getItem('bpd-portal-theme');
    if (savedTheme === 'dark') initialDark = true;
    else if (savedTheme === 'light') initialDark = false;
  } catch (e) {}
  applyTheme(initialDark);

  themeToggle.addEventListener('click', function () {
    const isDark = !root.classList.contains('dark');
    applyTheme(isDark);
    try {
      localStorage.setItem('bpd-portal-theme', isDark ? 'dark' : 'light');
    } catch (e) {}
    if (currentData && !isLoading) {
      renderCharts();
    }
  });

  function getChartTheme() {
    const isDark = root.classList.contains('dark');
    return {
      isDark: isDark,
      textColor: isDark ? '#BDD0BD' : '#354735',
      titleColor: isDark ? '#F4FAF4' : '#111611',
      gridColor: isDark ? 'rgba(189, 208, 189, 0.12)' : 'rgba(53, 71, 53, 0.10)',
      surfaceBg: isDark ? '#172017' : '#FFFFFF',
      tooltipBg: isDark ? '#212E21' : '#111611',
      barColor: isDark ? '#60A5FA' : '#2563EB',
      lineColor: isDark ? '#60A5FA' : '#2563EB',
      lineFill: isDark ? 'rgba(96, 165, 250, 0.18)' : 'rgba(37, 99, 235, 0.14)'
    };
  }

  // Caching & Status Helpers
  function getCacheKey(from, to, bureau) {
    return CACHE_PREFIX + (from || 'all') + '_' + (to || 'all') + '_' + (bureau || 'all');
  }

  function clearAllDashboardCache() {
    try {
      const keysToDelete = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.indexOf(CACHE_PREFIX) === 0) {
          keysToDelete.push(k);
        }
      }
      keysToDelete.forEach(function (k) {
        sessionStorage.removeItem(k);
      });
    } catch (e) {}
  }

  function setStatusState(mode, labelText, updatedAtText) {
    if (mode === 'loading') {
      statusBadge.className =
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-light-info-container dark:bg-dark-info-container text-light-on-info-container dark:text-dark-on-info-container font-label text-label-md';
      statusDot.className = 'w-2 h-2 rounded-full bg-info animate-pulse shrink-0';
    } else if (mode === 'error') {
      statusBadge.className =
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-light-danger-container dark:bg-dark-danger-container text-light-on-danger-container dark:text-dark-on-danger-container font-label text-label-md';
      statusDot.className = 'w-2 h-2 rounded-full bg-danger shrink-0';
    } else {
      statusBadge.className =
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-light-success-container dark:bg-dark-success-container text-light-on-success-container dark:text-dark-on-success-container font-label text-label-md';
      statusDot.className = 'w-2 h-2 rounded-full bg-success shrink-0';
    }
    statusPeriodLabel.textContent = labelText;
    if (updatedAtText !== undefined) {
      lastUpdatedLabel.textContent = updatedAtText ? 'Оновлено: ' + updatedAtText : 'Оновлено: —';
    }
  }

  function showSkeletonKpis() {
    let html = '';
    for (let i = 0; i < 4; i++) {
      html +=
        '<article class="h-full bg-light-surface dark:bg-dark-surface border border-light-outline-variant dark:border-dark-outline-variant rounded-md p-gutter-md md:p-gutter-lg shadow-sm flex flex-col justify-between gap-gutter-sm animate-pulse">' +
        '<div class="h-3.5 w-28 rounded bg-light-surface-container dark:bg-dark-surface-container"></div>' +
        '<div class="h-8 w-20 rounded bg-light-surface-container dark:bg-dark-surface-container"></div>' +
        '<div class="h-4 w-36 rounded bg-light-surface-container dark:bg-dark-surface-container"></div>' +
        '</article>';
    }
    kpiGridEl.innerHTML = html;
  }

  function setLoadingState(loading) {
    isLoading = loading;
    refreshDataBtn.disabled = loading;
    if (loading) {
      refreshIcon.classList.add('animate-spin');
      errorBanner.classList.add('hidden');
      openReportBtn.disabled = true;
      setStatusState('loading', 'Завантаження з Google Таблиці...');
      showSkeletonKpis();
      disciplinePanelEl.classList.add('hidden');

      barSkeletonEl.classList.remove('hidden');
      barWrapperEl.classList.add('hidden');
      barEmptyEl.classList.add('hidden');

      doughnutSkeletonEl.classList.remove('hidden');
      doughnutContentWrap.classList.add('hidden');
      doughnutContentWrap.classList.remove('flex');
      doughnutEmptyEl.classList.add('hidden');

      lineCardEl.classList.remove('hidden');
      lineSkeletonEl.classList.remove('hidden');
      lineCanvasWrap.classList.add('hidden');
      linePeakBadgeEl.classList.add('hidden');

      tableSkeletonEl.classList.remove('hidden');
      ratingTableWrap.classList.add('hidden');
      tableEmptyEl.classList.add('hidden');
    } else {
      refreshIcon.classList.remove('animate-spin');
      barSkeletonEl.classList.add('hidden');
      doughnutSkeletonEl.classList.add('hidden');
      lineSkeletonEl.classList.add('hidden');
      tableSkeletonEl.classList.add('hidden');
      openReportBtn.disabled = !currentData;
    }
  }

  // Bureau Discovery & Rendering
  function collectBureaus(data) {
    ['bvpd', 'bppd', 'dkp', 'journal2026'].forEach(function (sectionKey) {
      const sec = data && data[sectionKey];
      if (!sec) return;
      [sec.allBureaus, sec.byBureau].forEach(function (map) {
        if (!map || typeof map !== 'object') return;
        Object.keys(map).forEach(function (name) {
          const clean = String(name || '').trim();
          if (clean && clean !== 'Не вказано') {
            knownBureaus.add(clean);
          }
        });
      });
    });
  }

  function getSortedBureaus() {
    return Array.from(knownBureaus).sort(function (a, b) {
      return a.localeCompare(b, 'uk', { numeric: true });
    });
  }

  function renderBureauFilter() {
    const bureaus = getSortedBureaus();
    const items = [{ value: '', label: 'Усі бюро' }].concat(
      bureaus.map(function (b) {
        return { value: b, label: b };
      })
    );

    bureauFilterGroup.innerHTML = items
      .map(function (item) {
        const on = item.value === selectedBureau;
        const cls = on
          ? 'bureau-btn px-3 py-1.5 rounded-sm bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface shadow-sm font-label text-label-md transition-colors duration-state-change'
          : 'bureau-btn px-3 py-1.5 rounded-sm text-light-on-surface-variant dark:text-dark-on-surface-variant hover:text-light-on-surface dark:hover:text-dark-on-surface font-label text-label-md transition-colors duration-state-change';
        return (
          '<button type="button" data-bureau="' +
          escapeHtml(item.value) +
          '" aria-pressed="' +
          (on ? 'true' : 'false') +
          '" class="' +
          cls +
          '">' +
          escapeHtml(item.label) +
          '</button>'
        );
      })
      .join('');

    bureauIndicator.textContent = selectedBureau
      ? 'Активний фільтр: ' + selectedBureau
      : 'Відображаються дані по всьому відділу';
  }

  bureauFilterGroup.addEventListener('click', function (e) {
    const btn = e.target.closest('.bureau-btn');
    if (!btn) return;
    const nextBureau = btn.getAttribute('data-bureau') || '';
    if (nextBureau === selectedBureau) return;
    selectedBureau = nextBureau;
    renderBureauFilter();
    loadData();
  });

  // Data Loading
  async function loadData(options) {
    const forceRefresh = Boolean(options && options.forceRefresh);
    if (typeof window.bpdIsAuthenticated === 'function' && !window.bpdIsAuthenticated()) {
      return;
    }

    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }

    const seq = ++requestSeq;
    const cacheKey = getCacheKey(selectedFrom, selectedTo, selectedBureau);

    if (forceRefresh) {
      clearAllDashboardCache();
    } else {
      try {
        const cachedRaw = sessionStorage.getItem(cacheKey);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed && parsed.bvpd) {
            errorBanner.classList.add('hidden');
            currentData = parsed;
            collectBureaus(parsed);
            renderBureauFilter();
            setLoadingState(false);
            setStatusState('live', 'Живі дані (' + activePeriodLabel + ')', parsed.updatedAt || '');
            renderAll();
            return;
          }
        }
      } catch (e) {}
    }

    setLoadingState(true);

    const params = new URLSearchParams();
    if (selectedFrom) params.set('from', selectedFrom);
    if (selectedTo) params.set('to', selectedTo);
    if (selectedBureau) params.set('bureau', selectedBureau);
    if (forceRefresh) params.set('t', String(Date.now()));

    const queryString = params.toString();
    const requestUrl = queryString ? API_URL + '?' + queryString : API_URL;

    const controller = new AbortController();
    activeAbortController = controller;

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ' ' + (response.statusText || ''));
      }
      const data = await response.json();
      if (!data || typeof data !== 'object' || !data.bvpd) {
        throw new Error('Отримано некоректну структуру JSON від сервера.');
      }
      if (seq !== requestSeq) return;

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {}

      currentData = data;
      collectBureaus(data);
      renderBureauFilter();
      setLoadingState(false);
      setStatusState('live', 'Живі дані (' + activePeriodLabel + ')', data.updatedAt || '');
      renderAll();
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      if (seq !== requestSeq) return;

      setLoadingState(false);
      setStatusState('error', 'Помилка завантаження');
      errorMessageText.textContent =
        (err && err.message ? err.message : 'Невідома помилка мережі.') +
        ' Перевірте підключення до інтернету та спробуйте оновити дані.';
      errorBanner.classList.remove('hidden');

      if (currentData) {
        openReportBtn.disabled = false;
        renderAll();
      }
    } finally {
      if (activeAbortController === controller) {
        activeAbortController = null;
      }
    }
  }

  // KPI Calculation per Section 4.G
  function buildKpisForTab(tabKey, data) {
    const sec = data[tabKey] || {};
    const total = Number(sec.total || 0);
    const byLawyer = sec.byLawyer || {};
    const lawyersCount = Object.keys(byLawyer).filter(function (k) {
      return k && k !== 'Не вказано' && Number(byLawyer[k] || 0) > 0;
    }).length;
    const bureauLeader = getMaxEntry(sec.byBureau);

    if (tabKey === 'bvpd') {
      const statusLeader = getMaxEntry(sec.extra && sec.extra.status);
      const avgLawyer = lawyersCount > 0 ? Math.round(total / lawyersCount) : 0;
      return [
        { label: 'ВСЬОГО ЗАЯВ БВПД', value: fmtNum(total), sub: 'Активних юристів: ' + fmtNum(lawyersCount), accent: '' },
        { label: 'ЛІДЕР ЗА БЮРО', value: fmtNum(bureauLeader.value), sub: bureauLeader.key + ' (' + fmtNum(bureauLeader.value) + ')', accent: 'text-info' },
        { label: 'НАЙЧАСТІШИЙ СТАТУС', value: fmtNum(statusLeader.value), sub: statusLeader.key + ' (' + fmtNum(statusLeader.value) + ')', accent: '' },
        { label: 'СЕРЕДНЄ НА ЮРИСТА', value: fmtNum(avgLawyer), sub: 'Заяв на 1 працівника', accent: '' }
      ];
    }

    if (tabKey === 'bppd') {
      const typeLeader = getMaxEntry(sec.extra && sec.extra.type);
      const avgLawyer = lawyersCount > 0 ? Math.round(total / lawyersCount) : 0;
      return [
        { label: 'ВСЬОГО КОНСУЛЬТАЦІЙ', value: fmtNum(total), sub: 'Працівників у звіті: ' + fmtNum(lawyersCount), accent: '' },
        { label: 'ЛІДЕР ЗА БЮРО', value: fmtNum(bureauLeader.value), sub: bureauLeader.key + ' (' + fmtNum(bureauLeader.value) + ')', accent: 'text-info' },
        { label: 'ОСНОВНИЙ ВИД БППД', value: fmtNum(typeLeader.value), sub: typeLeader.key + ' (' + fmtPct(typeLeader.value, total) + '%)', accent: '' },
        { label: 'СЕРЕДНЄ НА ЮРИСТА', value: fmtNum(avgLawyer), sub: 'Консультацій на 1 працівника', accent: '' }
      ];
    }

    if (tabKey === 'dkp') {
      const pointNames = (sec.extra && sec.extra.pointName) || {};
      const pointsCount = Object.keys(pointNames).filter(function (k) {
        return k && k !== 'Не вказано' && Number(pointNames[k] || 0) > 0;
      }).length;
      const avgPerPoint = pointsCount > 0 ? Number((total / pointsCount).toFixed(1)) : 0;
      return [
        { label: 'ЗВЕРНЕНЬ НА ДКП', value: fmtNum(total), sub: 'Задіяно працівників: ' + fmtNum(lawyersCount), accent: 'text-accent-purple' },
        { label: 'УСТАНОВ / ТОЧОК ДКП', value: fmtNum(pointsCount), sub: 'Активних точок доступу', accent: '' },
        { label: 'ЛІДЕР ЗА БЮРО', value: fmtNum(bureauLeader.value), sub: bureauLeader.key + ' (' + fmtNum(bureauLeader.value) + ')', accent: 'text-info' },
        { label: 'СЕРЕДНЄ НА ТОЧКУ', value: fmtNum(avgPerPoint), sub: 'Звернень на 1 установу ДКП', accent: '' }
      ];
    }

    if (tabKey === 'journal2026') {
      const inKiasYes = getCaseInsensitiveSum(sec.extra && sec.extra.inKias, 'так');
      const hasScanYes = getCaseInsensitiveSum(sec.extra && sec.extra.hasScan, 'так');
      return [
        { label: 'ВСЬОГО У ЖУРНАЛІ', value: fmtNum(total), sub: 'Працівників у реєстрі: ' + fmtNum(lawyersCount), accent: '' },
        { label: 'ЗАВАНТАЖЕНО В КІАС', value: fmtNum(inKiasYes), sub: fmtPct(inKiasYes, total) + '% від загальної кількості', accent: 'text-success' },
        { label: 'ЗАВАНТАЖЕНО СКАНІВ', value: fmtNum(hasScanYes), sub: fmtPct(hasScanYes, total) + '% від загальної кількості', accent: 'text-warning' },
        { label: 'ЛІДЕР ЗА БЮРО', value: fmtNum(bureauLeader.value), sub: bureauLeader.key + ' (' + fmtNum(bureauLeader.value) + ')', accent: 'text-info' }
      ];
    }

    if (tabKey === 'ukrposhta') {
      const stampsTotal = Number(sec.stampsTotal || 0);
      const totalCost = Number(sec.totalCost || 0);
      const avgStamps = total > 0 ? (stampsTotal / total).toFixed(1) : '0.0';
      const costBreakdown = sortEntriesDesc(sec.costByStampType, false)
        .map(function (entry) {
          return entry[0] + ': ' + fmtMoney(entry[1]) + ' грн';
        })
        .join(' • ');
      const receivedCount = getCaseInsensitiveSum(sec.byStatus, 'отримано');
      return [
        { label: 'ПОШТОВИХ ВІДПРАВЛЕНЬ', value: fmtNum(total), sub: 'Виконавців: ' + fmtNum(lawyersCount), accent: '' },
        { label: 'ВИКОРИСТАНО МАРОК', value: fmtNum(stampsTotal) + ' шт.', sub: 'Середнє: ' + avgStamps + ' на лист', accent: '' },
        { label: 'ВИТРАТИ НА ПОШТУ', value: fmtMoney(totalCost) + ' грн', sub: costBreakdown || 'Без розбивки за номіналом', accent: 'text-accent-purple' },
        { label: 'СТАТУС «ОТРИМАНО»', value: fmtNum(receivedCount), sub: fmtPct(receivedCount, total) + '% доставлено', accent: 'text-success' }
      ];
    }

    // terminations, replacements, poa
    const lawyerLeader = getMaxEntry(byLawyer);
    const monthKeys2026 = Object.keys(sec.byMonth || {}).filter(function (k) {
      return /\.2026$/.test(k) && Number(sec.byMonth[k] || 0) > 0;
    });
    const activeMonthsCount =
      monthKeys2026.length > 0
        ? monthKeys2026.length
        : Object.keys(sec.byMonth || {}).filter(function (k) {
            return Number(sec.byMonth[k] || 0) > 0;
          }).length;

    return [
      { label: 'ВСЬОГО ЗАПИСІВ', value: fmtNum(total), sub: TAB_CONFIG[tabKey].title, accent: '' },
      { label: 'ЗАДІЯНО ПРАЦІВНИКІВ', value: fmtNum(lawyersCount), sub: 'Із зафіксованими записами', accent: '' },
      { label: 'ЛІДЕР ЗА КІЛЬКІСТЮ', value: fmtNum(lawyerLeader.value), sub: lawyerLeader.key + ' (' + fmtNum(lawyerLeader.value) + ')', accent: 'text-info' },
      { label: 'АКТИВНИХ МІСЯЦІВ У 2026 Р.', value: fmtNum(activeMonthsCount), sub: 'Місяців із зафіксованими даними', accent: '' }
    ];
  }

  // Render Bureau Badges, KPIs, Discipline
  function renderHeaderAndKpis() {
    const cfg = TAB_CONFIG[activeTab];
    const sec = currentData[activeTab] || {};
    journalTitleEl.textContent = cfg.title;
    journalSubtitleEl.textContent = cfg.subtitle;

    const bureauEntries = sortEntriesDesc(sec.byBureau, true);
    if (bureauEntries.length > 0) {
      bureauBadgesEl.innerHTML = bureauEntries
        .map(function (entry) {
          return (
            '<span class="px-3 py-1 rounded-full bg-light-surface dark:bg-dark-surface border border-light-outline-variant dark:border-dark-outline-variant font-label text-label-md text-light-on-surface dark:text-dark-on-surface">' +
            escapeHtml(entry[0]) +
            ': ' +
            fmtNum(entry[1]) +
            '</span>'
          );
        })
        .join('');
    } else {
      bureauBadgesEl.innerHTML =
        '<span class="px-3 py-1 rounded-full bg-light-surface dark:bg-dark-surface border border-light-outline-variant dark:border-dark-outline-variant font-label text-label-md text-light-on-surface dark:text-dark-on-surface">Всього: ' +
        fmtNum(sec.total || 0) +
        '</span>';
    }

    const kpis = buildKpisForTab(activeTab, currentData);
    kpiGridEl.innerHTML = kpis
      .map(function (k) {
        return (
          '<article class="h-full bg-light-surface dark:bg-dark-surface border border-light-outline-variant dark:border-dark-outline-variant rounded-md p-gutter-md md:p-gutter-lg shadow-sm flex flex-col justify-between gap-gutter-sm">' +
          '<span class="font-label text-label-sm uppercase tracking-wider text-light-on-surface-variant dark:text-dark-on-surface-variant" data-design-text-token="label-sm">' +
          escapeHtml(k.label) +
          '</span>' +
          '<span class="font-headline text-display-kpi-mobile md:text-display-kpi ' +
          (k.accent || 'text-light-on-surface dark:text-dark-on-surface') +
          ' tabular-nums">' +
          escapeHtml(k.value) +
          '</span>' +
          '<span class="font-body text-body-md text-light-on-surface-variant dark:text-dark-on-surface-variant break-words">' +
          escapeHtml(k.sub) +
          '</span>' +
          '</article>'
        );
      })
      .join('');
  }

  function renderDiscipline() {
    const cfg = TAB_CONFIG[activeTab];
    const discipline = currentData && currentData.journal2026 && currentData.journal2026.discipline;
    if (!cfg.showDiscipline || !discipline) {
      disciplinePanelEl.classList.add('hidden');
      disciplinePanelEl.innerHTML = '';
      return;
    }

    const missingKias = Number(discipline.missingKiasTotal || 0);
    const missingScan = Number(discipline.missingScanTotal || 0);
    disciplinePanelEl.classList.remove('hidden');

    if (missingKias === 0 && missingScan === 0) {
      disciplinePanelEl.className =
        'bg-light-success-container dark:bg-dark-success-container border border-success/30 rounded-md p-gutter-md md:p-gutter-lg flex items-center gap-gutter-sm';
      disciplinePanelEl.innerHTML =
        '<span class="material-symbols-outlined text-[24px] text-success shrink-0" aria-hidden="true">verified</span>' +
        '<div class="flex flex-col gap-0.5">' +
        '<h3 class="font-title text-title-md text-light-on-success-container dark:text-dark-on-success-container">Контроль виконавської дисципліни (Журнал 2026)</h3>' +
        '<p class="font-body text-body-md text-light-on-success-container dark:text-dark-on-success-container">Усі справи завантажені в КІАС та мають скан-копії.</p>' +
        '</div>';
      return;
    }

    disciplinePanelEl.className =
      'bg-light-danger-container dark:bg-dark-danger-container border border-light-danger-border dark:border-dark-danger-border rounded-md p-gutter-md md:p-gutter-lg flex flex-col gap-gutter-md';

    const risks = discipline.risksByLawyer || {};
    const riskPillsHtml = Object.entries(risks)
      .sort(function (a, b) {
        return Number((b[1] && b[1].total) || 0) - Number((a[1] && a[1].total) || 0);
      })
      .map(function (entry) {
        const lawyerName = entry[0] && String(entry[0]).trim() ? entry[0] : 'Не вказано';
        const info = entry[1] || {};
        const badges = [];
        if (Number(info.noKias || 0) > 0) {
          badges.push(
            '<span class="px-1.5 py-0.5 rounded bg-danger text-on-danger text-label-sm">КІАС (' +
              fmtNum(info.noKias) +
              ')</span>'
          );
        }
        if (Number(info.noScan || 0) > 0) {
          badges.push(
            '<span class="px-1.5 py-0.5 rounded bg-warning text-on-warning text-label-sm">Скан (' +
              fmtNum(info.noScan) +
              ')</span>'
          );
        }
        return (
          '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-light-surface dark:bg-dark-surface border border-light-danger-border dark:border-dark-danger-border font-label text-label-md text-light-on-surface dark:text-dark-on-surface">' +
          '<span>' +
          escapeHtml(lawyerName) +
          ':</span>' +
          badges.join('') +
          '</span>'
        );
      })
      .join('');

    const missingItems = Array.isArray(discipline.missingItems) ? discipline.missingItems : [];
    const rowsHtml = missingItems
      .map(function (item) {
        const kiasBadge = item.noKias
          ? '<span class="px-2 py-0.5 rounded-full bg-danger text-on-danger font-label text-label-sm whitespace-nowrap">Немає в КІАС</span>'
          : '<span class="px-2 py-0.5 rounded-full bg-success text-on-success font-label text-label-sm whitespace-nowrap">Завантажено</span>';
        const scanBadge = item.noScan
          ? '<span class="px-2 py-0.5 rounded-full bg-warning text-on-warning font-label text-label-sm whitespace-nowrap">Немає скану</span>'
          : '<span class="px-2 py-0.5 rounded-full bg-success text-on-success font-label text-label-sm whitespace-nowrap">Завантажено</span>';

        return (
          '<tr>' +
          '<td class="px-3 py-2.5 text-light-on-surface dark:text-dark-on-surface whitespace-nowrap">№ ' +
          escapeHtml(item.rowNum) +
          '</td>' +
          '<td class="px-3 py-2.5 text-light-on-surface-variant dark:text-dark-on-surface-variant whitespace-nowrap">' +
          escapeHtml(item.date || '—') +
          '</td>' +
          '<td class="px-3 py-2.5 text-light-on-surface-variant dark:text-dark-on-surface-variant whitespace-nowrap">' +
          escapeHtml(item.rkzk || '—') +
          '</td>' +
          '<td class="px-3 py-2.5 font-medium text-light-on-surface dark:text-dark-on-surface">' +
          escapeHtml(item.lawyer || 'Не вказано') +
          '</td>' +
          '<td class="px-3 py-2.5 text-light-on-surface-variant dark:text-dark-on-surface-variant whitespace-nowrap">' +
          escapeHtml(item.bureau || '—') +
          '</td>' +
          '<td class="px-3 py-2.5">' +
          kiasBadge +
          '</td>' +
          '<td class="px-3 py-2.5">' +
          scanBadge +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    disciplinePanelEl.innerHTML =
      '<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-gutter-sm">' +
      '<div class="flex items-start gap-gutter-sm">' +
      '<span class="material-symbols-outlined text-[24px] text-danger shrink-0 mt-0.5" aria-hidden="true">warning</span>' +
      '<div class="flex flex-col gap-0.5">' +
      '<h3 class="font-title text-title-md text-light-on-danger-container dark:text-dark-on-danger-container">Контроль виконавської дисципліни (Журнал 2026)</h3>' +
      '<p class="font-body text-body-md text-light-on-danger-container dark:text-dark-on-danger-container tabular-nums">Не завантажено в КІАС: ' +
      fmtNum(missingKias) +
      ' • Відсутній скан: ' +
      fmtNum(missingScan) +
      '</p>' +
      '</div>' +
      '</div>' +
      '<div class="flex flex-wrap items-center gap-gutter-sm">' +
      riskPillsHtml +
      '</div>' +
      '</div>' +
      (missingItems.length > 0
        ? '<details class="group">' +
          '<summary class="cursor-pointer list-none inline-flex items-center gap-gutter-xs font-label text-label-md text-light-on-danger-container dark:text-dark-on-danger-container hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger rounded select-none">' +
          '<span class="material-symbols-outlined text-[18px] transition-transform group-open:rotate-180" aria-hidden="true">expand_more</span>' +
          '<span>Показати детальний перелік справ (' +
          fmtNum(missingItems.length) +
          '): рядок таблиці, дата заяви та № РКЗК</span>' +
          '</summary>' +
          '<div class="mt-gutter-md overflow-x-auto rounded border border-light-danger-border dark:border-dark-danger-border bg-light-surface dark:bg-dark-surface">' +
          '<table class="w-full min-w-[680px] text-left border-collapse">' +
          '<thead>' +
          '<tr class="bg-light-surface-container dark:bg-dark-surface-container border-b border-light-outline-variant dark:border-dark-outline-variant">' +
          '<th class="px-3 py-2.5 font-label text-label-md text-light-on-surface dark:text-dark-on-surface">Рядок</th>' +
          '<th class="px-3 py-2.5 font-label text-label-md text-light-on-surface dark:text-dark-on-surface">Дата заяви</th>' +
          '<th class="px-3 py-2.5 font-label text-label-md text-light-on-surface dark:text-dark-on-surface">№ РКЗК (КІАС)</th>' +
          '<th class="px-3 py-2.5 font-label text-label-md text-light-on-surface dark:text-dark-on-surface">ПІБ юриста</th>' +
          '<th class="px-3 py-2.5 font-label text-label-md text-light-on-surface dark:text-dark-on-surface">Бюро</th>' +
          '<th class="px-3 py-2.5 font-label text-label-md text-light-on-surface dark:text-dark-on-surface">КІАС</th>' +
          '<th class="px-3 py-2.5 font-label text-label-md text-light-on-surface dark:text-dark-on-surface">Скан-копія</th>' +
          '</tr>' +
          '</thead>' +
          '<tbody class="divide-y divide-light-outline-variant dark:divide-dark-outline-variant font-body text-body-md tabular-nums">' +
          rowsHtml +
          '</tbody>' +
          '</table>' +
          '</div>' +
          '</details>'
        : '');
  }

  // Charts (Chart.js v4.4.1)
  function destroyChart(key) {
    if (charts[key]) {
      charts[key].destroy();
      charts[key] = null;
    }
  }

  function renderBarChart() {
    destroyChart('bar');
    const sec = currentData[activeTab] || {};
    const entries = sortEntriesDesc(sec.byLawyer, false).map(function (e) {
      return [e[0] && String(e[0]).trim() ? e[0] : 'Не вказано', e[1]];
    });

    if (entries.length === 0 || typeof Chart === 'undefined') {
      barWrapperEl.classList.add('hidden');
      barEmptyEl.classList.remove('hidden');
      return;
    }

    barEmptyEl.classList.add('hidden');
    barWrapperEl.classList.remove('hidden');
    const dynamicHeight = Math.max(240, entries.length * 30 + 36);
    barWrapperEl.style.height = dynamicHeight + 'px';

    const theme = getChartTheme();
    charts.bar = new Chart(barCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: entries.map(function (e) {
          return e[0];
        }),
        datasets: [
          {
            label: 'Кількість записів',
            data: entries.map(function (e) {
              return e[1];
            }),
            backgroundColor: theme.barColor,
            borderRadius: 4,
            barThickness: 18
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            padding: 10
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: theme.textColor, precision: 0 },
            grid: { color: theme.gridColor }
          },
          y: {
            ticks: { color: theme.titleColor, font: { family: 'Inter', size: 12 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  function renderDoughnutSliceButtons() {
    const cfg = TAB_CONFIG[activeTab];
    const validIds = cfg.slices.map(function (s) {
      return s.id;
    });
    if (validIds.indexOf(activeSlice) === -1) {
      activeSlice = validIds[0];
    }

    doughnutSliceBtnsEl.innerHTML = cfg.slices
      .map(function (slice) {
        const on = slice.id === activeSlice;
        const cls = on
          ? 'slice-btn px-2.5 py-1 rounded bg-info text-on-info font-label text-label-sm transition-colors duration-state-change'
          : 'slice-btn px-2.5 py-1 rounded bg-light-surface-container dark:bg-dark-surface-container text-light-on-surface-variant dark:text-dark-on-surface-variant hover:bg-light-surface-container-high dark:hover:bg-dark-surface-container-high font-label text-label-sm transition-colors duration-state-change';
        return (
          '<button type="button" data-slice="' +
          escapeHtml(slice.id) +
          '" aria-pressed="' +
          (on ? 'true' : 'false') +
          '" class="' +
          cls +
          '">' +
          escapeHtml(slice.label) +
          '</button>'
        );
      })
      .join('');
  }

  function renderDoughnutChart() {
    destroyChart('doughnut');
    const cfg = TAB_CONFIG[activeTab];
    const sliceCfg =
      cfg.slices.find(function (s) {
        return s.id === activeSlice;
      }) || cfg.slices[0];

    doughnutSubtitleEl.textContent = sliceCfg.subtitle;
    const sec = currentData[activeTab] || {};
    const rawMap = getNested(sec, sliceCfg.path);
    const sorted = sortEntriesDesc(rawMap, false).slice(0, 10);

    if (sorted.length === 0 || typeof Chart === 'undefined') {
      doughnutContentWrap.classList.add('hidden');
      doughnutContentWrap.classList.remove('flex');
      doughnutEmptyEl.classList.remove('hidden');
      return;
    }

    doughnutEmptyEl.classList.add('hidden');
    doughnutContentWrap.classList.remove('hidden');
    doughnutContentWrap.classList.add('flex');

    const total = sorted.reduce(function (sum, entry) {
      return sum + Number(entry[1] || 0);
    }, 0);
    doughnutTotalEl.textContent = fmtNum(total);

    const theme = getChartTheme();
    const colors = sorted.map(function (_, idx) {
      return CHART_COLORS[idx % CHART_COLORS.length];
    });

    charts.doughnut = new Chart(doughnutCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: sorted.map(function (e) {
          return e[0];
        }),
        datasets: [
          {
            data: sorted.map(function (e) {
              return e[1];
            }),
            backgroundColor: colors,
            borderColor: theme.surfaceBg,
            borderWidth: 2,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            padding: 10,
            callbacks: {
              label: function (ctx) {
                const val = Number(ctx.raw || 0);
                return ' ' + ctx.label + ': ' + fmtNum(val) + ' (' + fmtPct(val, total) + '%)';
              }
            }
          }
        }
      }
    });

    doughnutLegendEl.innerHTML = sorted
      .map(function (entry, idx) {
        const label = entry[0] || 'Не вказано';
        const val = entry[1];
        const color = colors[idx];
        return (
          '<div class="flex items-center justify-between gap-2 px-2 py-1 rounded bg-light-surface-container-low dark:bg-dark-surface-container-low" title="' +
          escapeHtml(label + ': ' + fmtNum(val)) +
          '">' +
          '<span class="flex items-center gap-1.5 min-w-0">' +
          '<span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:' +
          color +
          '"></span>' +
          '<span class="truncate text-light-on-surface dark:text-dark-on-surface">' +
          escapeHtml(label) +
          '</span>' +
          '</span>' +
          '<span class="font-label text-label-sm text-light-on-surface-variant dark:text-dark-on-surface-variant tabular-nums shrink-0">' +
          fmtPct(val, total) +
          '%</span>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderLineChart() {
    destroyChart('line');
    const sec = currentData[activeTab] || {};
    const sortedMonths = sortMonthEntries(sec.byMonth);

    if (sortedMonths.length === 0 || typeof Chart === 'undefined') {
      lineCardEl.classList.add('hidden');
      return;
    }

    lineCardEl.classList.remove('hidden');
    lineCanvasWrap.classList.remove('hidden');

    const fullLabels = sortedMonths.map(function (e) {
      return formatMonthLabel(e[0], false);
    });
    const values = sortedMonths.map(function (e) {
      return Number(e[1] || 0);
    });
    const maxVal = Math.max.apply(null, values);
    const peakIdx = values.indexOf(maxVal);

    lineSubtitleEl.textContent =
      'Щомісячна кількість записів (' + fullLabels[0] + ' — ' + fullLabels[fullLabels.length - 1] + ')';
    linePeakBadgeEl.textContent = 'Пік: ' + fullLabels[peakIdx] + ' (' + fmtNum(maxVal) + ')';
    linePeakBadgeEl.classList.remove('hidden');

    const theme = getChartTheme();
    charts.line = new Chart(lineCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: fullLabels,
        datasets: [
          {
            label: TAB_CONFIG[activeTab].title,
            data: values,
            borderColor: theme.lineColor,
            backgroundColor: theme.lineFill,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: theme.lineColor,
            pointBorderColor: theme.surfaceBg,
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            padding: 10
          }
        },
        scales: {
          x: {
            ticks: { color: theme.textColor, font: { family: 'Inter', size: 11 } },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: { color: theme.textColor, precision: 0 },
            grid: { color: theme.gridColor }
          }
        }
      }
    });
  }

  function renderCharts() {
    renderBarChart();
    renderDoughnutSliceButtons();
    renderDoughnutChart();
    renderLineChart();
  }

  // Rating Table
  function renderRatingTable() {
    if (!currentData) return;
    const sec = currentData[activeTab] || {};
    const total = Number(sec.total || 0);
    const query = employeeSearchInput.value.trim().toLowerCase();

    const allRows = sortEntriesDesc(sec.byLawyer, false).map(function (entry) {
      return {
        name: entry[0] && String(entry[0]).trim() ? entry[0] : 'Не вказано',
        total: Number(entry[1] || 0)
      };
    });

    const filteredRows = allRows.filter(function (row) {
      return !query || row.name.toLowerCase().indexOf(query) !== -1;
    });

    const isBppd = activeTab === 'bppd';
    const bppdTypes = isBppd ? getBppdTypes(sec) : [];
    const byLawyerAndType = (isBppd && sec.byLawyerAndType) || {};

    if (isBppd) {
      const typeHeaders = bppdTypes
        .map(function (t) {
          return (
            '<th class="px-3 py-3 font-label text-label-md text-right whitespace-nowrap" title="' +
            escapeHtml(t) +
            '">' +
            escapeHtml(getShortBppdHeader(t)) +
            '</th>'
          );
        })
        .join('');
      ratingTheadEl.innerHTML =
        '<tr>' +
        '<th class="px-3 py-3 font-label text-label-md sticky left-0 bg-light-surface-container dark:bg-dark-surface-container">№</th>' +
        '<th class="px-3 py-3 font-label text-label-md sticky left-10 bg-light-surface-container dark:bg-dark-surface-container">ПІБ працівника / юриста</th>' +
        typeHeaders +
        '<th class="px-3 py-3 font-label text-label-md text-right">Разом</th>' +
        '<th class="px-3 py-3 font-label text-label-md text-right">Частка (%)</th>' +
        '<th class="px-3 py-3 font-label text-label-md hidden md:table-cell w-40">Візуалізація</th>' +
        '</tr>';
    } else {
      ratingTheadEl.innerHTML =
        '<tr>' +
        '<th class="px-3 py-3 font-label text-label-md">№</th>' +
        '<th class="px-3 py-3 font-label text-label-md">ПІБ працівника / юриста</th>' +
        '<th class="px-3 py-3 font-label text-label-md text-right">Разом</th>' +
        '<th class="px-3 py-3 font-label text-label-md text-right">Частка (%)</th>' +
        '<th class="px-3 py-3 font-label text-label-md hidden md:table-cell w-48">Візуалізація</th>' +
        '</tr>';
    }

    if (filteredRows.length === 0) {
      ratingTableWrap.classList.add('hidden');
      ratingTbodyEl.innerHTML = '';
      tableEmptyEl.classList.remove('hidden');
      return;
    }

    tableEmptyEl.classList.add('hidden');
    ratingTableWrap.classList.remove('hidden');

    const leaderVal = (allRows[0] && allRows[0].total) || 1;
    const denominator = total > 0 ? total : allRows.reduce(function (s, r) { return s + r.total; }, 0);

    ratingTbodyEl.innerHTML = filteredRows
      .map(function (row, idx) {
        const barW = Math.max(4, Math.round((row.total / leaderVal) * 100));
        const pctStr = fmtPct(row.total, denominator) + '%';

        if (isBppd) {
          const lawyerMap = byLawyerAndType[row.name] || {};
          const typeCells = bppdTypes
            .map(function (t) {
              return '<td class="px-3 py-2.5 text-right">' + fmtNum(lawyerMap[t] || 0) + '</td>';
            })
            .join('');
          return (
            '<tr>' +
            '<td class="px-3 py-2.5 sticky left-0 bg-light-surface dark:bg-dark-surface">' +
            (idx + 1) +
            '</td>' +
            '<td class="px-3 py-2.5 font-medium sticky left-10 bg-light-surface dark:bg-dark-surface whitespace-nowrap">' +
            escapeHtml(row.name) +
            '</td>' +
            typeCells +
            '<td class="px-3 py-2.5 text-right font-semibold text-info">' +
            fmtNum(row.total) +
            '</td>' +
            '<td class="px-3 py-2.5 text-right">' +
            pctStr +
            '</td>' +
            '<td class="px-3 py-2.5 hidden md:table-cell"><div class="h-2 rounded-full bg-light-surface-container dark:bg-dark-surface-container overflow-hidden"><div class="h-full bg-info rounded-full" style="width:' +
            barW +
            '%"></div></div></td>' +
            '</tr>'
          );
        }

        return (
          '<tr>' +
          '<td class="px-3 py-2.5">' +
          (idx + 1) +
          '</td>' +
          '<td class="px-3 py-2.5 font-medium whitespace-nowrap">' +
          escapeHtml(row.name) +
          '</td>' +
          '<td class="px-3 py-2.5 text-right font-semibold text-info">' +
          fmtNum(row.total) +
          '</td>' +
          '<td class="px-3 py-2.5 text-right">' +
          pctStr +
          '</td>' +
          '<td class="px-3 py-2.5 hidden md:table-cell"><div class="h-2 rounded-full bg-light-surface-container dark:bg-dark-surface-container overflow-hidden"><div class="h-full bg-info rounded-full" style="width:' +
          barW +
          '%"></div></div></td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function renderAll() {
    if (!currentData) return;
    renderHeaderAndKpis();
    renderDiscipline();
    renderCharts();
    renderRatingTable();
  }

  // Full Analytical Report (Modal + CSV + Copy + Print)
  function buildReportModel(data) {
    const bureaus = getSortedBureaus();
    const journalSec = data.journal2026 || {};
    const inKiasYes = getCaseInsensitiveSum(journalSec.extra && journalSec.extra.inKias, 'так');
    const hasScanYes = getCaseInsensitiveSum(journalSec.extra && journalSec.extra.hasScan, 'так');
    const ukr = data.ukrposhta || {};
    const costBreakdown = sortEntriesDesc(ukr.costByStampType, false)
      .map(function (e) {
        return e[0] + ': ' + fmtMoney(e[1]) + ' грн';
      })
      .join(', ');

    const section1Rows = TAB_ORDER.map(function (key) {
      const sec = data[key] || {};
      const row = {
        name: TAB_CONFIG[key].title,
        bureaus: {},
        total: Number(sec.total || 0),
        detail: ''
      };
      bureaus.forEach(function (b) {
        row.bureaus[b] = sec.byBureau && sec.byBureau[b] !== undefined ? Number(sec.byBureau[b]) : null;
      });
      if (key === 'journal2026') {
        row.detail =
          'У КІАС: ' +
          fmtNum(inKiasYes) +
          ' (' +
          fmtPct(inKiasYes, row.total) +
          '%), скани: ' +
          fmtNum(hasScanYes) +
          ' (' +
          fmtPct(hasScanYes, row.total) +
          '%)';
      } else if (key === 'ukrposhta') {
        row.detail =
          'Марок: ' +
          fmtNum(ukr.stampsTotal || 0) +
          ' шт., витрати: ' +
          fmtMoney(ukr.totalCost || 0) +
          ' грн' +
          (costBreakdown ? ' (' + costBreakdown + ')' : '');
      }
      return row;
    });

    // Section 2: Union of employees across bvpd, bppd, dkp
    const bvpdMap = (data.bvpd && data.bvpd.byLawyer) || {};
    const bppdMap = (data.bppd && data.bppd.byLawyer) || {};
    const dkpMap = (data.dkp && data.dkp.byLawyer) || {};
    const bppdByType = (data.bppd && data.bppd.byLawyerAndType) || {};
    const bppdTypes = getBppdTypes(data.bppd);

    const lawyerSet = new Set();
    [bvpdMap, bppdMap, dkpMap].forEach(function (m) {
      Object.keys(m).forEach(function (name) {
        if (name && name !== 'Не вказано') lawyerSet.add(name);
      });
    });

    const section2Rows = Array.from(lawyerSet)
      .map(function (name) {
        const bvpdVal = Number(bvpdMap[name] || 0);
        const bppdVal = Number(bppdMap[name] || 0);
        const dkpVal = Number(dkpMap[name] || 0);
        const typeCounts = {};
        bppdTypes.forEach(function (t) {
          typeCounts[t] = Number((bppdByType[name] && bppdByType[name][t]) || 0);
        });
        return {
          name: name,
          bvpd: bvpdVal,
          typeCounts: typeCounts,
          bppdTotal: bppdVal,
          dkp: dkpVal,
          grandTotal: bvpdVal + bppdVal + dkpVal
        };
      })
      .sort(function (a, b) {
        if (b.grandTotal !== a.grandTotal) return b.grandTotal - a.grandTotal;
        return a.name.localeCompare(b.name, 'uk');
      });

    const section2Totals = {
      bvpd: section2Rows.reduce(function (s, r) { return s + r.bvpd; }, 0),
      typeCounts: {},
      bppdTotal: section2Rows.reduce(function (s, r) { return s + r.bppdTotal; }, 0),
      dkp: section2Rows.reduce(function (s, r) { return s + r.dkp; }, 0),
      grandTotal: section2Rows.reduce(function (s, r) { return s + r.grandTotal; }, 0)
    };
    bppdTypes.forEach(function (t) {
      section2Totals.typeCounts[t] = section2Rows.reduce(function (s, r) {
        return s + (r.typeCounts[t] || 0);
      }, 0);
    });

    function buildBreakdown(map) {
      const entries = sortEntriesDesc(map, false);
      const total = entries.reduce(function (s, e) {
        return s + Number(e[1] || 0);
      }, 0);
      return { entries: entries, total: total };
    }

    return {
      bureaus: bureaus,
      section1Rows: section1Rows,
      bppdTypes: bppdTypes,
      section2Rows: section2Rows,
      section2Totals: section2Totals,
      section3: buildBreakdown(data.bvpd && data.bvpd.extra && data.bvpd.extra.category),
      section4: buildBreakdown(data.bvpd && data.bvpd.extra && data.bvpd.extra.status),
      section5: buildBreakdown(data.bppd && data.bppd.extra && data.bppd.extra.category)
    };
  }

  function renderBreakdownSectionHtml(title, colLabel, breakdown) {
    const rowsHtml = breakdown.entries
      .map(function (entry) {
        const label = entry[0] || 'Не вказано';
        const val = entry[1];
        return (
          '<tr>' +
          '<td class="px-3 py-2">' +
          escapeHtml(label) +
          '</td>' +
          '<td class="px-3 py-2 text-right">' +
          fmtNum(val) +
          '</td>' +
          '<td class="px-3 py-2 text-right">' +
          fmtPct(val, breakdown.total) +
          '%</td>' +
          '</tr>'
        );
      })
      .join('');

    return (
      '<h3 class="font-title text-title-md text-light-on-surface dark:text-dark-on-surface">' +
      escapeHtml(title) +
      '</h3>' +
      '<div class="overflow-x-auto border border-light-outline-variant dark:border-dark-outline-variant rounded">' +
      '<table class="w-full text-left border-collapse tabular-nums">' +
      '<thead class="bg-light-surface-container dark:bg-dark-surface-container">' +
      '<tr>' +
      '<th class="px-3 py-2 font-label text-label-md">' +
      escapeHtml(colLabel) +
      '</th>' +
      '<th class="px-3 py-2 font-label text-label-md text-right">Кількість</th>' +
      '<th class="px-3 py-2 font-label text-label-md text-right">%</th>' +
      '</tr>' +
      '</thead>' +
      '<tbody class="divide-y divide-light-outline-variant dark:divide-dark-outline-variant">' +
      rowsHtml +
      '<tr class="report-total-row bg-light-surface-container dark:bg-dark-surface-container font-semibold">' +
      '<td class="px-3 py-2">Всього</td>' +
      '<td class="px-3 py-2 text-right text-info">' +
      fmtNum(breakdown.total) +
      '</td>' +
      '<td class="px-3 py-2 text-right">' +
      (breakdown.total > 0 ? '100.0%' : '0.0%') +
      '</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>' +
      '</div>'
    );
  }

  function renderReportModal() {
    if (!currentData) return;
    const model = buildReportModel(currentData);
    const bureauLabel = selectedBureau ? 'Бюро: ' + selectedBureau : 'Усі бюро відділу';
    reportModalSubtitle.textContent =
      'Період: ' +
      activePeriodLabel +
      ' • ' +
      bureauLabel +
      (currentData.updatedAt ? ' • Оновлено: ' + currentData.updatedAt : '');

    // Section 1
    const s1Headers = model.bureaus
      .map(function (b) {
        return '<th class="px-3 py-2 font-label text-label-md text-right whitespace-nowrap">' + escapeHtml(b) + '</th>';
      })
      .join('');
    const s1Body = model.section1Rows
      .map(function (row) {
        const bCells = model.bureaus
          .map(function (b) {
            const v = row.bureaus[b];
            return '<td class="px-3 py-2 text-right">' + (v !== null ? fmtNum(v) : '—') + '</td>';
          })
          .join('');
        return (
          '<tr>' +
          '<td class="px-3 py-2 font-medium whitespace-nowrap">' +
          escapeHtml(row.name) +
          '</td>' +
          bCells +
          '<td class="px-3 py-2 text-right font-semibold text-info">' +
          fmtNum(row.total) +
          '</td>' +
          '<td class="px-3 py-2 text-light-on-surface-variant dark:text-dark-on-surface-variant">' +
          escapeHtml(row.detail || '—') +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    document.getElementById('report-section-1').innerHTML =
      '<h3 class="font-title text-title-md text-light-on-surface dark:text-dark-on-surface">1. Зведені показники за напрямками діяльності відділу</h3>' +
      '<div class="overflow-x-auto border border-light-outline-variant dark:border-dark-outline-variant rounded">' +
      '<table class="w-full text-left border-collapse tabular-nums">' +
      '<thead class="bg-light-surface-container dark:bg-dark-surface-container">' +
      '<tr>' +
      '<th class="px-3 py-2 font-label text-label-md">Напрямок / Журнал</th>' +
      s1Headers +
      '<th class="px-3 py-2 font-label text-label-md text-right">Разом</th>' +
      '<th class="px-3 py-2 font-label text-label-md">Деталізація (КІАС / Скани / Витрати)</th>' +
      '</tr>' +
      '</thead>' +
      '<tbody class="divide-y divide-light-outline-variant dark:divide-dark-outline-variant">' +
      s1Body +
      '</tbody>' +
      '</table>' +
      '</div>';

    // Section 2
    const s2TypeHeaders = model.bppdTypes
      .map(function (t) {
        return (
          '<th class="px-3 py-2 font-label text-label-md text-right whitespace-nowrap" title="' +
          escapeHtml(t) +
          '">' +
          escapeHtml(getShortBppdHeader(t)) +
          '</th>'
        );
      })
      .join('');

    const s2Rows = model.section2Rows
      .map(function (row, idx) {
        const typeCells = model.bppdTypes
          .map(function (t) {
            return '<td class="px-3 py-2 text-right">' + fmtNum(row.typeCounts[t] || 0) + '</td>';
          })
          .join('');
        return (
          '<tr>' +
          '<td class="px-3 py-2">' +
          (idx + 1) +
          '</td>' +
          '<td class="px-3 py-2 font-medium whitespace-nowrap">' +
          escapeHtml(row.name) +
          '</td>' +
          '<td class="px-3 py-2 text-right">' +
          fmtNum(row.bvpd) +
          '</td>' +
          typeCells +
          '<td class="px-3 py-2 text-right font-medium">' +
          fmtNum(row.bppdTotal) +
          '</td>' +
          '<td class="px-3 py-2 text-right">' +
          fmtNum(row.dkp) +
          '</td>' +
          '<td class="px-3 py-2 text-right font-semibold text-info">' +
          fmtNum(row.grandTotal) +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    const s2TotalTypeCells = model.bppdTypes
      .map(function (t) {
        return '<td class="px-3 py-2 text-right">' + fmtNum(model.section2Totals.typeCounts[t] || 0) + '</td>';
      })
      .join('');

    document.getElementById('report-section-2').innerHTML =
      '<h3 class="font-title text-title-md text-light-on-surface dark:text-dark-on-surface">2. Показники роботи працівників (БВПД, БППД у розрізі видів, ДКП)</h3>' +
      '<div class="overflow-x-auto border border-light-outline-variant dark:border-dark-outline-variant rounded">' +
      '<table class="w-full text-left border-collapse tabular-nums">' +
      '<thead class="bg-light-surface-container dark:bg-dark-surface-container">' +
      '<tr>' +
      '<th class="px-3 py-2 font-label text-label-md">№</th>' +
      '<th class="px-3 py-2 font-label text-label-md">ПІБ працівника</th>' +
      '<th class="px-3 py-2 font-label text-label-md text-right">БВПД</th>' +
      s2TypeHeaders +
      '<th class="px-3 py-2 font-label text-label-md text-right whitespace-nowrap">БППД (разом)</th>' +
      '<th class="px-3 py-2 font-label text-label-md text-right">ДКП</th>' +
      '<th class="px-3 py-2 font-label text-label-md text-right">Разом</th>' +
      '</tr>' +
      '</thead>' +
      '<tbody class="divide-y divide-light-outline-variant dark:divide-dark-outline-variant">' +
      s2Rows +
      '<tr class="report-total-row bg-light-surface-container dark:bg-dark-surface-container font-semibold">' +
      '<td class="px-3 py-2"></td>' +
      '<td class="px-3 py-2">РАЗОМ ПО ВІДДІЛУ</td>' +
      '<td class="px-3 py-2 text-right text-info">' +
      fmtNum(model.section2Totals.bvpd) +
      '</td>' +
      s2TotalTypeCells +
      '<td class="px-3 py-2 text-right text-info">' +
      fmtNum(model.section2Totals.bppdTotal) +
      '</td>' +
      '<td class="px-3 py-2 text-right text-info">' +
      fmtNum(model.section2Totals.dkp) +
      '</td>' +
      '<td class="px-3 py-2 text-right text-info">' +
      fmtNum(model.section2Totals.grandTotal) +
      '</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>' +
      '</div>';

    document.getElementById('report-section-3').innerHTML = renderBreakdownSectionHtml(
      '3. Надання БВПД за категоріями права',
      'Категорія права',
      model.section3
    );
    document.getElementById('report-section-4').innerHTML = renderBreakdownSectionHtml(
      "4. Категорії клієнтів (суб'єктів права на БВПД)",
      "Суб'єкт права",
      model.section4
    );
    document.getElementById('report-section-5').innerHTML = renderBreakdownSectionHtml(
      '5. Надання БППД за категоріями права',
      'Категорія права',
      model.section5
    );
  }

  function csvCell(val) {
    const str = String(val == null ? '' : val);
    if (/[;"\n\r]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function buildCsvContent(data) {
    const model = buildReportModel(data);
    const lines = [];
    const addRow = function (cols) {
      lines.push(cols.map(csvCell).join(';'));
    };

    addRow(['Повний аналітичний звіт Одеського відділу БПД']);
    addRow(['Період', activePeriodLabel, 'Бюро', selectedBureau || 'Усі бюро', 'Оновлено', data.updatedAt || '']);
    lines.push('');

    // Table 1
    addRow(['1. Зведені показники за напрямками діяльності відділу']);
    addRow(['Напрямок / Журнал'].concat(model.bureaus, ['Разом', 'Деталізація']));
    model.section1Rows.forEach(function (row) {
      const bVals = model.bureaus.map(function (b) {
        return row.bureaus[b] !== null ? row.bureaus[b] : '';
      });
      addRow([row.name].concat(bVals, [row.total, row.detail]));
    });
    lines.push('');

    // Table 2
    addRow(['2. Показники роботи працівників (БВПД, БППД у розрізі видів, ДКП)']);
    addRow(['№', 'ПІБ працівника', 'БВПД'].concat(model.bppdTypes, ['БППД (разом)', 'ДКП', 'Разом']));
    model.section2Rows.forEach(function (row, idx) {
      const tVals = model.bppdTypes.map(function (t) {
        return row.typeCounts[t] || 0;
      });
      addRow([idx + 1, row.name, row.bvpd].concat(tVals, [row.bppdTotal, row.dkp, row.grandTotal]));
    });
    const tTotalVals = model.bppdTypes.map(function (t) {
      return model.section2Totals.typeCounts[t] || 0;
    });
    addRow(
      ['', 'РАЗОМ ПО ВІДДІЛУ', model.section2Totals.bvpd].concat(tTotalVals, [
        model.section2Totals.bppdTotal,
        model.section2Totals.dkp,
        model.section2Totals.grandTotal
      ])
    );
    lines.push('');

    // Tables 3, 4, 5
    function addBreakdownCsv(heading, colName, bd) {
      addRow([heading]);
      addRow([colName, 'Кількість', '%']);
      bd.entries.forEach(function (e) {
        addRow([e[0] || 'Не вказано', e[1], fmtPct(e[1], bd.total) + '%']);
      });
      addRow(['Всього', bd.total, bd.total > 0 ? '100.0%' : '0.0%']);
      lines.push('');
    }

    addBreakdownCsv('3. Надання БВПД за категоріями права', 'Категорія права', model.section3);
    addBreakdownCsv("4. Категорії клієнтів (суб'єктів права на БВПД)", "Суб'єкт права", model.section4);
    addBreakdownCsv('5. Надання БППД за категоріями права', 'Категорія права', model.section5);

    return '\uFEFF' + lines.join('\r\n');
  }

  // Event Listeners
  journalTabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const nextTab = btn.getAttribute('data-tab');
      if (!nextTab || nextTab === activeTab) return;
      activeTab = nextTab;
      employeeSearchInput.value = '';
      journalTabBtns.forEach(function (t) {
        const on = t === btn;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.className = on
          ? 'journal-tab px-3 py-2.5 rounded bg-info text-on-info font-label text-label-md text-center transition-colors duration-state-change'
          : 'journal-tab px-3 py-2.5 rounded bg-light-surface dark:bg-dark-surface border border-light-outline-variant dark:border-dark-outline-variant text-light-on-surface-variant dark:text-dark-on-surface-variant hover:bg-light-surface-container dark:hover:bg-dark-surface-container font-label text-label-md text-center transition-colors duration-state-change';
      });
      if (currentData) {
        renderAll();
      }
    });
  });

  doughnutSliceBtnsEl.addEventListener('click', function (e) {
    const btn = e.target.closest('.slice-btn');
    if (!btn) return;
    const nextSlice = btn.getAttribute('data-slice');
    if (!nextSlice || nextSlice === activeSlice) return;
    activeSlice = nextSlice;
    renderDoughnutSliceButtons();
    if (currentData) {
      renderDoughnutChart();
    }
  });

  function updatePresetButtons(activeBtn) {
    presetBtns.forEach(function (p) {
      const on = p === activeBtn;
      p.setAttribute('aria-pressed', on ? 'true' : 'false');
      p.className = on
        ? 'preset-btn px-3 py-1.5 rounded bg-info text-on-info font-label text-label-md transition-colors duration-state-change'
        : 'preset-btn px-3 py-1.5 rounded bg-light-surface-container dark:bg-dark-surface-container text-light-on-surface-variant dark:text-dark-on-surface-variant hover:bg-light-surface-container-high dark:hover:bg-dark-surface-container-high font-label text-label-md transition-colors duration-state-change';
    });
  }

  function resolvePresetRange(preset) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (preset === 'year') {
      return { from: '', to: '', label: 'Весь 2026 рік' };
    }
    if (preset === 'current-month') {
      const first = new Date(y, m, 1);
      const last = new Date(y, m + 1, 0);
      return {
        from: formatDateISO(first),
        to: formatDateISO(last),
        label: UK_MONTHS[m] + ' ' + y
      };
    }
    if (preset === 'prev-month') {
      const py = m === 0 ? y - 1 : y;
      const pm = m === 0 ? 11 : m - 1;
      const first = new Date(py, pm, 1);
      const last = new Date(py, pm + 1, 0);
      return {
        from: formatDateISO(first),
        to: formatDateISO(last),
        label: UK_MONTHS[pm] + ' ' + py
      };
    }
    if (preset === 'q1') return { from: '2026-01-01', to: '2026-03-31', label: 'I квартал 2026' };
    if (preset === 'q2') return { from: '2026-04-01', to: '2026-06-30', label: 'II квартал 2026' };
    if (preset === 'q3') return { from: '2026-07-01', to: '2026-09-30', label: 'III квартал 2026' };
    if (preset === 'q4') return { from: '2026-10-01', to: '2026-12-31', label: 'IV квартал 2026' };
    return { from: '', to: '', label: 'Весь 2026 рік' };
  }

  presetBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const range = resolvePresetRange(btn.getAttribute('data-preset'));
      selectedFrom = range.from;
      selectedTo = range.to;
      activePeriodLabel = range.label;
      dateFromInput.value = selectedFrom;
      dateToInput.value = selectedTo;
      updatePresetButtons(btn);
      loadData();
    });
  });

  applyDatesBtn.addEventListener('click', function () {
    selectedFrom = dateFromInput.value;
    selectedTo = dateToInput.value;
    updatePresetButtons(null);
    if (selectedFrom && selectedTo) {
      activePeriodLabel = formatDateUA(selectedFrom) + ' — ' + formatDateUA(selectedTo);
    } else if (selectedFrom) {
      activePeriodLabel = 'Від ' + formatDateUA(selectedFrom);
    } else if (selectedTo) {
      activePeriodLabel = 'До ' + formatDateUA(selectedTo);
    } else {
      activePeriodLabel = 'Весь 2026 рік';
    }
    loadData();
  });

  employeeSearchInput.addEventListener('input', function () {
    if (currentData) renderRatingTable();
  });

  refreshDataBtn.addEventListener('click', function () {
    loadData({ forceRefresh: true });
  });

  retryFetchBtn.addEventListener('click', function () {
    loadData({ forceRefresh: true });
  });

  // Modal Events
  function closeReportModal() {
    reportModal.classList.add('hidden');
  }

  openReportBtn.addEventListener('click', function () {
    if (!currentData) return;
    renderReportModal();
    reportModal.classList.remove('hidden');
  });

  closeReportBtn.addEventListener('click', closeReportModal);

  reportModal.addEventListener('click', function (e) {
    if (e.target === reportModal) closeReportModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !reportModal.classList.contains('hidden')) {
      closeReportModal();
    }
  });

  copyReportBtn.addEventListener('click', async function () {
    const panelBody = document.getElementById('report-modal-body');
    const text =
      document.getElementById('report-modal-title').innerText +
      '\n' +
      reportModalSubtitle.innerText +
      '\n\n' +
      panelBody.innerText;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch (err) {}
      document.body.removeChild(ta);
    }
    copyReportLabel.textContent = 'Скопійовано!';
    setTimeout(function () {
      copyReportLabel.textContent = 'Копіювати текст';
    }, 2000);
  });

  printReportBtn.addEventListener('click', function () {
    try {
      window.print();
    } catch (e) {}
  });

  exportCsvBtn.addEventListener('click', function () {
    if (!currentData) return;
    const csv = buildCsvContent(currentData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Zvit_BPD_Odesa_' + (selectedFrom || '2026') + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Initial Load (only after auth passes)
  window.addEventListener('bpd:authenticated', function () {
    loadData();
  });

  if (typeof window.bpdIsAuthenticated !== 'function' || window.bpdIsAuthenticated()) {
    loadData();
  }
})();
