// manage.js — admin page: list, add, edit, delete
(function () {
  const ADMIN_KEY = 'sankap_admin_pw'; // same key component.js saves after login

  // No password saved: back to the homepage before anything shows
  if (!sessionStorage.getItem(ADMIN_KEY)) {
    window.location.replace('index.html');
    return;
  }

  const CUISINES = ['American', 'Cafe', 'Chinese', 'Filipino', 'Indian', 'Italian',
    'Japanese', 'Korean', 'Mexican', 'Seafood', 'Vegetarian'];
  const LOCATIONS = ['Angeles City', 'Clark', 'Mabalacat', 'San Fernando'];
  const OTHER = '__other__';

  const $ = (id) => document.getElementById(id);
  const formModal = $('formModal');
  const deleteModal = $('deleteModal');
  const state = { all: [], search: '', editingId: null, deleteTarget: null };

  function leave() {
    sessionStorage.removeItem(ADMIN_KEY);
    window.location.replace('index.html');
  }

  // Every write goes through here so the password header is always sent
  async function api(path, method, body) {
    const res = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': sessionStorage.getItem(ADMIN_KEY) || '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* no JSON body */ }
    if (res.status === 401) { leave(); throw new Error('Session expired'); }
    if (!res.ok) throw new Error((data && data.message) || 'Something went wrong');
    return data;
  }

  // ---------- Notifications ----------

  // Small corner toast (used for errors)
  function showToast(text, isError) {
    let box = document.getElementById('toastBox');
    if (!box) {
      box = el('div', 'toast-box');
      box.id = 'toastBox';
      box.setAttribute('role', 'status');
      document.body.append(box);
    }
    const toast = el('div', 'toast' + (isError ? ' toast--error' : ''));
    toast.append(el('span', 'toast__icon', isError ? '!' : '✓'), el('span', 'toast__text', text));
    box.append(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, isError ? 6000 : 3500);
  }

  // Big centered success popup
  let successTimer;
  function hideSuccess() {
    const o = document.getElementById('successOverlay');
    if (o) o.classList.remove('is-visible');
  }
  function showSuccess(text) {
    let overlay = document.getElementById('successOverlay');
    if (!overlay) {
      overlay = el('div', 'success-overlay');
      overlay.id = 'successOverlay';
      overlay.setAttribute('role', 'status');
      const card = el('div', 'success-card');
      card.append(
        el('div', 'success-card__icon', '✓'),
        el('h2', 'success-card__title', 'Success!'),
        el('p', 'success-card__text', '')
      );
      overlay.append(card);
      overlay.addEventListener('click', hideSuccess);
      document.body.append(overlay);
    }
    overlay.querySelector('.success-card__text').textContent = text;
    void overlay.offsetWidth; // lets the animation replay on repeat successes
    overlay.classList.add('is-visible');
    clearTimeout(successTimer);
    successTimer = setTimeout(hideSuccess, 2200);
  }
  function showMessage(text, isError) {
    if (isError) showToast(text, true);
    else showSuccess(text);
  }

  // ---------- Table ----------
  function buildRow(r) {
    const tr = el('tr');
    const cuisineCell = el('td');
    cuisineCell.append(badgeFor(r.cuisine));
    const edit = el('button', 'btn btn--ghost btn--sm', 'Edit');
    const del = el('button', 'btn btn--danger btn--sm', 'Delete');
    [[edit, 'edit'], [del, 'delete']].forEach(([btn, action]) => {
      btn.type = 'button';
      btn.dataset.action = action;
      btn.dataset.id = r.restaurant_id;
    });
    const actions = el('div', 'table__actions');
    actions.append(edit, del);
    const actionsCell = el('td');
    actionsCell.append(actions);

    tr.append(
      el('td', '', String(r.restaurant_id)),
      el('td', 'table__name', r.name),
      cuisineCell,
      el('td', '', r.address),
      el('td', '', r.rating.toFixed(1)),
      el('td', '', r.contact),
      actionsCell
    );
    return tr;
  }

  function renderTable() {
    const q = state.search.trim().toLowerCase();
    const rows = state.all.filter((r) =>
      !q || [r.name, r.cuisine, r.address, r.contact].some((v) => v.toLowerCase().includes(q))
    );
    $('manageCount').textContent = rows.length === state.all.length
      ? `${rows.length} restaurants`
      : `${rows.length} of ${state.all.length} restaurants`;

    const body = $('tableBody');
    if (!rows.length) {
      const td = el('td', 'table__empty', 'No restaurants found');
      td.colSpan = 7;
      const tr = el('tr');
      tr.append(td);
      body.replaceChildren(tr);
      return;
    }
    body.replaceChildren(...rows.map(buildRow));
  }

  async function loadList() {
    try {
      const res = await fetch('/api/restaurants?sort=name_asc');
      if (!res.ok) throw new Error('Request failed');
      state.all = await res.json();
      renderTable();
    } catch (e) {
      $('manageCount').textContent = 'Something went wrong';
      showMessage("Couldn't load restaurants.", true);
    }
  }

  // ---------- Modals ----------
  function closeModals() {
    formModal.classList.remove('is-open');
    deleteModal.classList.remove('is-open');
  }

  function fillSelect(select, list, placeholder) {
    select.replaceChildren(new Option(placeholder, ''), ...list.map((v) => new Option(v, v)));
  }

  function openForm(r) {
    state.editingId = r ? r.restaurant_id : null;
    $('formTitle').textContent = r ? 'Edit restaurant' : 'Add restaurant';
    $('formSave').textContent = r ? 'Save changes' : 'Add restaurant';
    $('fName').value = r ? r.name : '';
    $('fCuisine').value = r ? r.cuisine : '';
    $('fCuisineOther').value = '';
    $('fCuisineOther').classList.add('hidden');
    $('fAddress').value = r ? r.address : '';
    $('fRating').value = r ? r.rating : '';
    $('fContact').value = r ? r.contact : '';
    $('formError').textContent = '';
    formModal.classList.add('is-open');
    $('fName').focus();
  }

  function openDelete(r) {
    state.deleteTarget = r;
    $('deleteText').textContent = `“${r.name}” will be permanently removed. This can't be undone.`;
    $('deleteError').textContent = '';
    deleteModal.classList.add('is-open');
  }

  // Same rules the server enforces (the server is still the real check)
  function validate(d) {
    if (!d.name) return 'Name is required';
    if (!d.cuisine) return 'Please choose a cuisine';
    if (!d.address) return 'Please choose a location';
    const r = Number(d.rating);
    if (d.rating === '' || Number.isNaN(r) || r < 0 || r > 5) return 'Rating must be between 0 and 5';
    if (!/^09\d{9}$/.test(d.contact)) return 'Contact must be 11 digits starting with 09';
    return null;
  }

  // ---------- Events ----------
  $('addBtn').addEventListener('click', () => openForm(null));
  $('logoutBtn').addEventListener('click', leave);
  $('manageSearch').addEventListener('input', (e) => { state.search = e.target.value; renderTable(); });

  $('tableBody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const r = state.all.find((x) => x.restaurant_id === Number(btn.dataset.id));
    if (!r) return;
    if (btn.dataset.action === 'edit') openForm(r);
    else openDelete(r);
  });

  $('formCancel').addEventListener('click', closeModals);
  $('deleteCancel').addEventListener('click', closeModals);
  $('fCuisine').addEventListener('change', () => {
    const other = $('fCuisine').value === OTHER;
    $('fCuisineOther').classList.toggle('hidden', !other);
    if (other) $('fCuisineOther').focus();
  });
  formModal.addEventListener('click', (e) => { if (e.target === formModal) closeModals(); });
  deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeModals(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });

  $('restaurantForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const chosen = $('fCuisine').value;
    const data = {
      name: $('fName').value.trim(),
      cuisine: chosen === OTHER ? $('fCuisineOther').value.trim() : chosen,
      address: $('fAddress').value,
      rating: $('fRating').value.trim(),
      contact: $('fContact').value.trim(),
    };
    if (chosen === OTHER && !data.cuisine) {
      $('formError').textContent = 'Please enter the cuisine';
      return;
    }
    const problem = validate(data);
    if (problem) { $('formError').textContent = problem; return; }
    data.rating = Number(data.rating);

    const save = $('formSave');
    save.disabled = true;
    const editing = state.editingId !== null;
    try {
      await api(editing ? `/api/restaurants/${state.editingId}` : '/api/restaurants',
        editing ? 'PUT' : 'POST', data);
      closeModals();
      await loadCuisineOptions();
      await loadList();
      showMessage(editing
        ? `“${data.name}” was updated successfully.`
        : `“${data.name}” was added successfully!`);
    } catch (err) {
      $('formError').textContent = err.message;
    }
    save.disabled = false;
  });

  $('deleteConfirm').addEventListener('click', async () => {
    const r = state.deleteTarget;
    if (!r) return;
    const btn = $('deleteConfirm');
    btn.disabled = true;
    try {
      await api(`/api/restaurants/${r.restaurant_id}`, 'DELETE');
      closeModals();
      await loadList();
      showMessage(`“${r.name}” was deleted.`);
    } catch (err) {
      $('deleteError').textContent = err.message;
    }
    btn.disabled = false;
  });

  async function loadCuisineOptions() {
    let list = CUISINES;
    try {
      const res = await fetch('/api/restaurants/cuisines');
      if (res.ok) list = await res.json();
    } catch (e) { /* fall back to the built-in list */ }
    $('fCuisine').replaceChildren(
      new Option('Choose a cuisine', ''),
      ...list.map((v) => new Option(v, v)),
      new Option('Other…', OTHER)
    );
  }

  // ---------- Start ----------
  loadCuisineOptions();
  fillSelect($('fAddress'), LOCATIONS, 'Choose a location');

  (async function init() {
    // Re-check the saved password with the server before showing anything
    try {
      await api('/api/admin/login', 'POST');
    } catch (e) {
      if (e.message === 'Session expired') return; // api() already redirected
      showMessage(e.message, true);
    }
    $('manageMain').classList.remove('hidden');
    loadList();
  })();
})();