// browse.js — fetch all restaurants once, filter/sort/render in the browser
(function () {
  const $ = (id) => document.getElementById(id);
  const gridView = $('gridView'), listView = $('listView'), emptyState = $('emptyState');
  const countEl = $('resultsCount'), tagsEl = $('activeFilters');
  const searchInput = $('searchInput'), searchClear = $('searchClear'), sortSelect = $('sortSelect');

  const state = {
    all: [], search: '', cuisines: new Set(), location: '',
    minRating: '', sort: 'rating-desc', view: 'grid',
  };

  const SORTS = {
    'rating-desc': (a, b) => b.rating - a.rating || a.name.localeCompare(b.name),
    'rating-asc': (a, b) => a.rating - b.rating || a.name.localeCompare(b.name),
    'name-asc': (a, b) => a.name.localeCompare(b.name),
    'name-desc': (a, b) => b.name.localeCompare(a.name),
  };

  function getFiltered() {
    const q = state.search.trim().toLowerCase();
    const min = parseFloat(state.minRating);
    return state.all
      .filter((r) => {
        if (q && !(r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q))) return false;
        if (state.cuisines.size && !state.cuisines.has(r.cuisine)) return false;
        if (state.location && r.address !== state.location) return false;
        if (!Number.isNaN(min) && r.rating < min) return false;
        return true;
      })
      .sort(SORTS[state.sort]);
  }

  function syncControls() {
    document.querySelectorAll('input[name="cuisine"]').forEach((cb) => {
      cb.checked = state.cuisines.has(cb.value);
    });
    document.querySelectorAll('input[name="location"]').forEach((rb) => {
      rb.checked = rb.value === state.location;
    });
    document.querySelectorAll('.rating-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.rating === state.minRating);
    });
    if (searchInput.value !== state.search) searchInput.value = state.search;
    searchClear.classList.toggle('visible', state.search !== '');
    sortSelect.value = state.sort;
    $('gridBtn').classList.toggle('active', state.view === 'grid');
    $('listBtn').classList.toggle('active', state.view === 'list');
  }

  function addTag(type, value, label) {
    const tag = el('span', 'filter-tag', label + ' ');
    const x = el('button', 'filter-tag__remove', '✕');
    x.type = 'button';
    x.setAttribute('aria-label', 'Remove ' + label);
    x.dataset.type = type;
    x.dataset.value = value;
    tag.append(x);
    tagsEl.append(tag);
  }

  function renderTags() {
    tagsEl.replaceChildren();
    if (state.search.trim()) addTag('search', '', '“' + state.search.trim() + '”');
    state.cuisines.forEach((c) => addTag('cuisine', c, c));
    if (state.location) addTag('location', state.location, state.location);
    if (state.minRating) addTag('rating', state.minRating, state.minRating + '+ stars');
  }

  function render() {
    const list = getFiltered();
    syncControls();
    renderTags();

    countEl.replaceChildren(
      el('strong', '', String(list.length)),
      document.createTextNode(list.length === 1 ? ' restaurant found' : ' restaurants found')
    );

    const empty = list.length === 0;
    emptyState.classList.toggle('hidden', !empty);
    gridView.classList.toggle('hidden', empty || state.view !== 'grid');
    listView.classList.toggle('hidden', empty || state.view !== 'list');
    gridView.replaceChildren(...list.map(buildCard));
    listView.replaceChildren(...list.map(buildListItem));
  }

  function clearAll() {
    state.search = '';
    state.cuisines.clear();
    state.location = '';
    state.minRating = '';
    render();
  }

  // ---------- Events ----------
  searchInput.addEventListener('input', () => { state.search = searchInput.value; render(); });
  searchClear.addEventListener('click', () => { state.search = ''; render(); searchInput.focus(); });

  $('cuisineFilters').addEventListener('change', () => {
    state.cuisines = new Set(
      [...document.querySelectorAll('input[name="cuisine"]:checked')].map((cb) => cb.value)
    );
    render();
  });

  $('locationFilters').addEventListener('change', (e) => {
    state.location = e.target.value;
    render();
  });

  $('ratingFilter').addEventListener('click', (e) => {
    const btn = e.target.closest('.rating-btn');
    if (!btn) return;
    state.minRating = btn.dataset.rating;
    render();
  });

  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; render(); });
  $('gridBtn').addEventListener('click', () => { state.view = 'grid'; render(); });
  $('listBtn').addEventListener('click', () => { state.view = 'list'; render(); });
  $('clearFilters').addEventListener('click', clearAll);
  $('emptyStateClear').addEventListener('click', clearAll);

  // Removing a tag
  tagsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-tag__remove');
    if (!btn) return;
    const { type, value } = btn.dataset;
    if (type === 'search') state.search = '';
    if (type === 'cuisine') state.cuisines.delete(value);
    if (type === 'location') state.location = '';
    if (type === 'rating') state.minRating = '';
    render();
  });

    // Restaurants with an ID above the original 30 were added through Admin
  const ORIGINAL_COUNT = 30;
  function renderRecent() {
    const recent = state.all
      .filter((r) => r.restaurant_id > ORIGINAL_COUNT)
      .sort((a, b) => b.restaurant_id - a.restaurant_id)
      .slice(0, 4);
    $('recentSection').classList.toggle('hidden', recent.length === 0);
    $('recentCards').replaceChildren(...recent.map(buildCard));
  }
  
    // Add a checkbox for any cuisine in the data that the HTML doesn't already list
  function addCustomCuisineFilters() {
    const box = $('cuisineFilters');
    const have = new Set([...box.querySelectorAll('input[name="cuisine"]')].map((i) => i.value));
    [...new Set(state.all.map((r) => r.cuisine))]
      .filter((c) => !have.has(c))
      .sort((a, b) => a.localeCompare(b))
      .forEach((c) => {
        const label = el('label', 'filter-option');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = 'cuisine';
        input.value = c;
        label.append(input, document.createTextNode(' 🍽️ ' + c));
        box.append(label);
      });
  }

  // ---------- Load data ----------
  // Homepage links: browse.html?cuisine=Filipino  /  browse.html?location=Clark
  function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const known = (name) =>
      [...document.querySelectorAll(`input[name="${name}"]`)].map((i) => i.value);

    (params.get('cuisine') || '').split(',').forEach((c) => {
      if (known('cuisine').includes(c.trim())) state.cuisines.add(c.trim());
    });
    const loc = params.get('location');
    if (loc && known('location').includes(loc)) state.location = loc;
  }

  function showError() {
    const msg = el('p', 'section-sub', "Couldn't load restaurants. Please try again later.");
    msg.style.gridColumn = '1 / -1';
    msg.style.textAlign = 'center';
    countEl.textContent = 'Something went wrong';
    gridView.replaceChildren(msg);
  }

  fetch('/api/restaurants')
    .then((res) => {
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    })
    .then((data) => {
      state.all = data;
      addCustomCuisineFilters();
      applyUrlParams();
      render();
      renderRecent();
    })
    .catch(showError);
})();