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
      <span>Saan, <em>Kap?</em></span>
    </a>

    <button class="nav__burger" id="burger" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>

    <ul class="nav__links" id="navLinks" role="list">
      <li><a href="index.html"       class="nav__link ${isActive('index.html')}">Home</a></li>
      <li><a href="restaurants.html" class="nav__link ${isActive('restaurants.html')}">Browse</a></li>
      <li><a href="about.html"       class="nav__link ${isActive('about.html')}">About</a></li>
      <li><a href="manage.html"      class="nav__link nav__link--manage ${isActive('manage.html')}">Manage</a></li>
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
          <span class="footer__logo">📍 Saan, <em>Kap?</em></span>
          <p class="footer__tagline">Your Pampanga dining guide.</p>
        </div>
        <div class="footer__links">
          <a href="index.html">Home</a>
          <a href="restaurants.html">Browse</a>
          <a href="about.html">About</a>
          <a href="manage.html">Manage</a>
        </div>
      </div>
      <div class="footer__bottom">
        <p>6ADDBASE Final Project &middot; WD-303 &middot; Instructor: Raphael P. Aguipo</p>
        <p style="margin-top:.35rem; opacity:.6;">
          Incognito &middot; Jose &middot; Montoya
        </p>
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