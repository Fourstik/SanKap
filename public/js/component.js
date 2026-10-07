// components.js
// Shared nav and footer injected into every page.
// Change here = updates everywhere.

// ── Detect active page ────────────────────────────────────
const currentPage = window.location.pathname.split('/').pop() || 'index.html';

function isActive(page) {
  if (page === 'index.html' && (currentPage === 'index.html' || currentPage === '')) return 'active';
  if (page !== 'index.html' && currentPage === page) return 'active';
  return '';
}

// ── Nav HTML ──────────────────────────────────────────────
function renderNav() {
  return `
  <nav class="nav" id="mainNav">
    <a href="index.html" class="nav__logo">
      <span class="nav__pin">📍</span>
      <span>San<em>Kap</em></span>
    </a>

    <button class="nav__burger" id="burger" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>

    <ul class="nav__links" id="navLinks" role="list">
      <li><a href="index.html"       class="nav__link ${isActive('index.html')}">Home</a></li>
      <li><a href="browse.html" class="nav__link ${isActive('browse.html')}">Browse</a></li>
      <li><a href="about.html"       class="nav__link ${isActive('about.html')}">About</a></li>
      <li><a href="manage.html" id="adminLink" class="nav__link nav__link--manage ${isActive('manage.html')}">Admin</a></li>
    </ul>
  </nav>
  `;
}

// ── Footer HTML ───────────────────────────────────────────
function renderFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer__inner">
        <div class="footer__brand">
          <span class="footer__logo">📍 San<em>Kap</em></span>
          <span class="footer__tagline">Find Dining in Pampanga.</span>
        </div>
        <div class="footer__bottom" style="text-align: right;">
          <p style="font-size: 0.75rem; color: rgba(255,255,255,.4);">6ADDBASE Final Project &middot; WD-303 &middot; Instructor: Raphael P. Aguipo</p>
        </div>
      </div>
      <div class="footer__bottom" style="color: rgba(255,255,255,0.6);">
        <p>&copy; 2026 SanKap &middot; <span style="color: var(--amber-300); font-weight: 500;">Incognito</span> &middot; <span style="color: var(--amber-300); font-weight: 500;">Jose</span> &middot; <span style="color: var(--amber-300); font-weight: 500;">Montoya</span></p>
      </div>
    </div>
  </footer>
  `;
}

// ── Inject into page ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const navSlot    = document.getElementById('nav-placeholder');
  const footerSlot = document.getElementById('footer-placeholder');

  if (navSlot)    navSlot.innerHTML    = renderNav();
  if (footerSlot) footerSlot.innerHTML = renderFooter();

  // ── Burger toggle ───────────────────────────────────────
  const burger   = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');

  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
      burger.classList.toggle('is-open', open);
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!burger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        burger.setAttribute('aria-expanded', false);
        burger.classList.remove('is-open');
      }
    });
  }

    // ── Admin password popup ────────────────────────────────
  const ADMIN_KEY = 'sankap_admin_pw'; 

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal__box" role="dialog" aria-modal="true" aria-labelledby="adminModalTitle">
      <h2 class="modal__title" id="adminModalTitle">Admin access</h2>
      <p class="modal__text">Enter the admin password to add, edit, or delete restaurants.</p>
      <form id="adminForm" novalidate>
        <input type="password" id="adminPassword" class="modal__input"
               placeholder="Password" autocomplete="current-password" />
        <p class="modal__error" id="adminError" role="alert"></p>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" id="adminCancel">Cancel</button>
          <button type="submit" class="btn btn--primary" id="adminSubmit">Unlock</button>
        </div>
      </form>
    </div>`;
  document.body.append(modal);

  const adminForm   = document.getElementById('adminForm');
  const adminInput  = document.getElementById('adminPassword');
  const adminError  = document.getElementById('adminError');
  const adminSubmit = document.getElementById('adminSubmit');

  function openAdminModal() {
    adminInput.value = '';
    adminError.textContent = '';
    modal.classList.add('is-open');
    adminInput.focus();
  }
  function closeAdminModal() {
    modal.classList.remove('is-open');
  }

  // Clicking Admin: already unlocked -> go through; otherwise show the popup
  const adminLink = document.getElementById('adminLink');
  if (adminLink) {
    adminLink.addEventListener('click', (e) => {
      if (sessionStorage.getItem(ADMIN_KEY)) return;
      e.preventDefault();
      if (navLinks) navLinks.classList.remove('open'); // close mobile menu
      if (burger) { burger.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); }
      openAdminModal();
    });
  }

  document.getElementById('adminCancel').addEventListener('click', closeAdminModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAdminModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAdminModal(); });

  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = adminInput.value;
    if (!password) { adminError.textContent = 'Please enter the password.'; return; }

    adminSubmit.disabled = true;
    adminSubmit.textContent = 'Checking...';
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'x-admin-password': password },
      });
      if (res.ok) {
        sessionStorage.setItem(ADMIN_KEY, password);
        window.location.href = 'manage.html';
        return;
      }
      adminError.textContent = res.status === 429
        ? 'Too many failed attempts. Try again in 15 minutes.'
        : 'Incorrect password.';
      adminInput.select();
    } catch (err) {
      adminError.textContent = "Couldn't reach the server. Please try again.";
    }
    adminSubmit.disabled = false;
    adminSubmit.textContent = 'Unlock';
  });



  // ── Transparent → solid nav on scroll ──────────────────
  const nav = document.getElementById('mainNav');
  if (nav) {
    const heroExists = document.querySelector('.hero');

    const updateNav = () => {
      if (heroExists) {
        // Transparent over hero, solid after
        if (window.scrollY > 80) {
          nav.classList.add('nav--scrolled');
        } else {
          nav.classList.remove('nav--scrolled');
        }
      } else {
        // Non-hero pages: always solid
        nav.classList.add('nav--scrolled');
      }
    };

    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav(); // run on load
  }
});