(function () {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeLabel = document.getElementById('theme-label');

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
    const saved = localStorage.getItem('bpd-portal-theme');
    if (saved === 'dark') initialDark = true;
    else if (saved === 'light') initialDark = false;
  } catch (e) {}
  applyTheme(initialDark);

  themeToggle.addEventListener('click', function () {
    const isDark = !root.classList.contains('dark');
    applyTheme(isDark);
    try {
      localStorage.setItem('bpd-portal-theme', isDark ? 'dark' : 'light');
    } catch (e) {}
  });

  const searchForm = document.getElementById('tool-search-form');
  const searchInput = document.getElementById('tool-search-input');
  const filterChips = Array.from(document.querySelectorAll('.filter-chip'));
  const toolCards = Array.from(document.querySelectorAll('.tool-card'));
  const emptyState = document.getElementById('empty-state');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');

  let activeCategory = 'all';

  const activeClasses = [
    'bg-light-primary', 'dark:bg-dark-primary',
    'text-light-on-primary', 'dark:text-dark-on-primary'
  ];
  const inactiveClasses = [
    'bg-light-surface', 'dark:bg-dark-surface',
    'border', 'border-light-outline-variant', 'dark:border-dark-outline-variant',
    'text-light-on-surface-variant', 'dark:text-dark-on-surface-variant',
    'hover:bg-light-surface-container', 'dark:hover:bg-dark-surface-container'
  ];

  function updateChipStyles() {
    filterChips.forEach(function (chip) {
      const isSelected = chip.getAttribute('data-filter') === activeCategory;
      chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      if (isSelected) {
        chip.classList.remove.apply(chip.classList, inactiveClasses);
        chip.classList.add.apply(chip.classList, activeClasses);
      } else {
        chip.classList.remove.apply(chip.classList, activeClasses);
        chip.classList.add.apply(chip.classList, inactiveClasses);
      }
    });
  }

  function filterTools() {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    toolCards.forEach(function (card) {
      const category = card.getAttribute('data-category');
      const searchable = (card.getAttribute('data-search') || '').toLowerCase();
      const matchesCategory = activeCategory === 'all' || category === activeCategory;
      const matchesQuery = !query || searchable.indexOf(query) !== -1;

      if (matchesCategory && matchesQuery) {
        card.classList.remove('hidden');
        visibleCount += 1;
      } else {
        card.classList.add('hidden');
      }
    });

    if (visibleCount === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
    }
  }

  filterChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      activeCategory = chip.getAttribute('data-filter');
      updateChipStyles();
      filterTools();
    });
  });

  searchInput.addEventListener('input', filterTools);
  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    filterTools();
  });

  resetFiltersBtn.addEventListener('click', function () {
    activeCategory = 'all';
    searchInput.value = '';
    updateChipStyles();
    filterTools();
  });
})();
