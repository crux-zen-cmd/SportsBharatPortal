/* ==========================================================================
   LANDING PAGE CONTROLLER - DYNAMIC DATA BINDING & INTERACTIVITY
   ========================================================================== */

import { SportsPortal } from './firebase-config.js';
import { fetchLiveNews, fetchTickerHeadlines, timeAgo, getCategoryIcon, getCategoryColor } from './news-service.js';
import { translations } from './translations.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Hide Page Loader
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('fade-out');
    }, 600);
  }

  // Bind Theme Toggle
  setupThemeToggle();

  // Bind Accessibility & Language Controls
  setupAccessibilityControls();

  // Scroll Event - Navbar Styling & Scrollspy
  const navbar = document.getElementById('main-navbar');
  const sections = document.querySelectorAll('header[id], section[id]');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  window.addEventListener('scroll', () => {
    // Navbar styling
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Scrollspy logic
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= (sectionTop - 200)) { // 200px offset for the fixed navbar and visual buffer
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // Mobile Menu Controls
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !isExpanded);
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });
  }

  // Load dynamically from Simulated DB / Fallback
  await loadSportsGrid();
  await loadCompetitions();
  await loadLiveNewsPreview();
  await loadLandingTicker();
  animateCounters();
});

/* ==========================================================================
   THEME MANAGER
   ========================================================================== */
function setupThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  toggleBtn.querySelector('.theme-icon').textContent = currentTheme === 'dark' ? '☀️' : '🌙';

  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    toggleBtn.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });
}

/* ==========================================================================
   ACCESSIBILITY & LANGUAGE CONTROLS (GIGW COMPLIANCE)
   ========================================================================== */
function setupAccessibilityControls() {
  // --- Font Resizing ---
  const htmlEl = document.documentElement;
  const fontDecBtn = document.getElementById('font-decrease');
  const fontNormBtn = document.getElementById('font-normal');
  const fontIncBtn = document.getElementById('font-increase');

  const savedFontSize = localStorage.getItem('fontSize');
  if (savedFontSize) {
    htmlEl.style.fontSize = savedFontSize;
    updateFontButtons(savedFontSize);
  }

  function updateFontButtons(size) {
    [fontDecBtn, fontNormBtn, fontIncBtn].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    if (size === '14px' && fontDecBtn) fontDecBtn.classList.add('active');
    else if (size === '18px' && fontIncBtn) fontIncBtn.classList.add('active');
    else if (fontNormBtn) fontNormBtn.classList.add('active');
  }

  if (fontDecBtn) {
    fontDecBtn.addEventListener('click', () => {
      htmlEl.style.fontSize = '14px';
      localStorage.setItem('fontSize', '14px');
      updateFontButtons('14px');
    });
  }
  if (fontNormBtn) {
    fontNormBtn.addEventListener('click', () => {
      htmlEl.style.fontSize = '16px';
      localStorage.setItem('fontSize', '16px');
      updateFontButtons('16px');
    });
  }
  if (fontIncBtn) {
    fontIncBtn.addEventListener('click', () => {
      htmlEl.style.fontSize = '18px';
      localStorage.setItem('fontSize', '18px');
      updateFontButtons('18px');
    });
  }

  // --- High Contrast Mode ---
  const contrastToggleBtn = document.getElementById('contrast-toggle');
  const savedContrast = localStorage.getItem('contrast') || 'normal';
  
  if (savedContrast === 'high') {
    htmlEl.setAttribute('data-contrast', 'high');
  }

  if (contrastToggleBtn) {
    contrastToggleBtn.addEventListener('click', () => {
      const isHigh = htmlEl.getAttribute('data-contrast') === 'high';
      if (isHigh) {
        htmlEl.removeAttribute('data-contrast');
        localStorage.setItem('contrast', 'normal');
      } else {
        htmlEl.setAttribute('data-contrast', 'high');
        localStorage.setItem('contrast', 'high');
      }
    });
  }

  // --- Bilingual Language Translation ---
  const btnEn = document.getElementById('lang-en');
  const btnHi = document.getElementById('lang-hi');
  const savedLang = localStorage.getItem('lang') || 'en';

  // Apply initially
  translatePage(savedLang);

  if (btnEn) {
    btnEn.addEventListener('click', () => {
      translatePage('en');
    });
  }
  if (btnHi) {
    btnHi.addEventListener('click', () => {
      translatePage('hi');
    });
  }
}

function translatePage(lang) {
  const htmlEl = document.documentElement;
  htmlEl.setAttribute('lang', lang);
  
  const elements = document.querySelectorAll('[data-trn]');
  elements.forEach(el => {
    const key = el.getAttribute('data-trn');
    if (translations[lang] && translations[lang][key]) {
      if (el.tagName === 'INPUT') {
        el.setAttribute('placeholder', translations[lang][key]);
      } else {
        el.textContent = translations[lang][key];
      }
    }
  });

  // Specifically translate search input placeholder if available
  const searchInput = document.getElementById('comp-search');
  if (searchInput && translations[lang]['comp-search-placeholder']) {
    searchInput.setAttribute('placeholder', translations[lang]['comp-search-placeholder']);
  }

  // Update active states on language buttons
  const btnEn = document.getElementById('lang-en');
  const btnHi = document.getElementById('lang-hi');
  if (btnEn && btnHi) {
    if (lang === 'hi') {
      btnEn.classList.remove('active');
      btnEn.style.fontWeight = 'normal';
      btnHi.classList.add('active');
      btnHi.style.fontWeight = 'bold';
    } else {
      btnHi.classList.remove('active');
      btnHi.style.fontWeight = 'normal';
      btnEn.classList.add('active');
      btnEn.style.fontWeight = 'bold';
    }
  }

  localStorage.setItem('lang', lang);

  // Re-render components to respect language
  if (typeof allCompetitions !== 'undefined' && allCompetitions.length > 0) {
    renderFilteredCompetitions(allCompetitions);
  }
}

/* ==========================================================================
   SPORTS LOADER
   ========================================================================== */
async function loadSportsGrid() {
  const grid = document.getElementById('sports-grid');
  if (!grid) return;

  try {
    const sportsList = await SportsPortal.db.getCollection('sports');
    grid.innerHTML = sportsList.map(sport => `
      <div class="sport-card glass-card" onclick="quickFilterSport('${sport.title}')">
        <span class="sport-card-icon">${sport.icon || '<img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Ashoka Stambh" style="height:32px;width:auto;">'}</span>
        <h3 class="sport-card-title">${sport.title}</h3>
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading sports grid", err);
  }
}

/* ==========================================================================
   COMPETITIONS RENDERER & FILTERS
   ========================================================================== */
let allCompetitions = [];

async function loadCompetitions() {
  const grid = document.getElementById('competitions-grid');
  if (!grid) return;

  // Insert loading skeletons first
  grid.innerHTML = Array(3).fill().map(() => `
    <div class="glass-card competition-card">
      <div class="skeleton" style="height: 200px; border-radius: 12px 12px 0 0;"></div>
      <div style="padding: 1.5rem;">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 80%;"></div>
      </div>
    </div>
  `).join('');

  try {
    const comps = await SportsPortal.db.getCollection('competitions');
    allCompetitions = comps;
    renderFilteredCompetitions(comps);

    // Setup input filters listeners
    const searchInput = document.getElementById('comp-search');
    const sportSelect = document.getElementById('filter-sport');
    const statusSelect = document.getElementById('filter-status');
    const stateSelect = document.getElementById('filter-state');

    const filterHandler = () => {
      const query = searchInput.value.toLowerCase();
      const sport = sportSelect.value;
      const status = statusSelect.value;
      const state = stateSelect.value;

      const filtered = allCompetitions.filter(c => {
        const matchesQuery = c.title.toLowerCase().includes(query) || c.venue.toLowerCase().includes(query);
        const matchesSport = !sport || c.sportType === sport;
        const matchesStatus = !status || c.status === status;
        const matchesState = !state || c.state === state;
        return matchesQuery && matchesSport && matchesStatus && matchesState;
      });
      renderFilteredCompetitions(filtered);
    };

    [searchInput, sportSelect, statusSelect, stateSelect].forEach(element => {
      if (element) element.addEventListener('input', filterHandler);
    });

  } catch (err) {
    grid.innerHTML = `<div class="error-msg">Failed to load competitions. Please try again later.</div>`;
    console.error(err);
  }
}

function renderFilteredCompetitions(comps) {
  const grid = document.getElementById('competitions-grid');
  if (!grid) return;

  const currentLang = localStorage.getItem('lang') || 'en';
  const isHi = currentLang === 'hi';

  if (comps.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">${isHi ? 'आपके द्वारा चुने गए फ़िल्टर से कोई प्रतियोगिता मेल नहीं खाती।' : 'No competitions match your selected filters.'}</div>`;
    return;
  }

  grid.innerHTML = comps.map(c => {
    const statusText = c.status === 'upcoming' 
      ? (isHi ? 'आगामी' : 'Upcoming') 
      : c.status === 'ongoing' 
      ? (isHi ? 'जारी है' : 'Ongoing') 
      : (isHi ? 'पूरा हुआ' : 'Completed');
    const statusClass = c.status === 'upcoming' 
      ? 'badge-success' 
      : c.status === 'ongoing' 
      ? 'badge-warning' 
      : 'badge-danger';
    const statusBadge = `<span class="badge ${statusClass}">${statusText}</span>`;

    const priceText = c.regFee === "0" 
      ? `<span class="comp-price free">${isHi ? 'निःशुल्क' : 'FREE'}</span>` 
      : `<span class="comp-price">₹${c.regFee}</span>`;

    return `
      <article class="glass-card competition-card" data-id="${c.id}">
        <div class="comp-header">
          <img src="${c.bannerUrl}" class="comp-banner" alt="${c.title}" loading="lazy" />
          <div class="comp-badge">${statusBadge}</div>
        </div>
        <div class="comp-body">
          <div class="comp-meta">
            <span>📅 ${c.dateTime.split('T')[0]}</span>
            <span>📍 ${c.city}, ${c.state}</span>
          </div>
          <h3 class="comp-title">${c.title}</h3>
          <div class="comp-info">
            <div class="info-item"><img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Ashoka Stambh" style="height:16px;width:auto;vertical-align:middle;margin-right:4px;"> ${isHi ? 'खेल' : 'Sport'}: <strong>${c.sportType}</strong></div>
            <div class="info-item">🏟️ ${isHi ? 'स्थान' : 'Venue'}: <strong>${c.venue}</strong></div>
          </div>
          <div class="comp-footer">
            ${priceText}
            <a href="pages/auth/register.html" class="btn btn-primary">${isHi ? 'अभी पंजीकरण करें' : 'Register Now'}</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

window.quickFilterSport = (sportName) => {
  const sportSelect = document.getElementById('filter-sport');
  if (sportSelect) {
    sportSelect.value = sportName;
    sportSelect.dispatchEvent(new Event('input'));
    document.getElementById('competitions').scrollIntoView({ behavior: 'smooth' });
  }
};

/* ==========================================================================
   LIVE NEWS PREVIEW — Landing Page (replaces old carousel)
   ========================================================================== */
async function loadLiveNewsPreview() {
  const container = document.getElementById('live-news-preview');
  if (!container) return;

  try {
    const articles = await fetchLiveNews('all', 6);

    if (articles.length === 0) {
      container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No live news available right now.</div>';
      return;
    }

    container.innerHTML = articles.slice(0, 3).map(article => {
      const catIcon = getCategoryIcon(article.category);
      const catColor = getCategoryColor(article.category);
      const time = timeAgo(article.pubDate);
      const title = article.title.replace(/\s*-\s*[^-]+$/, '').trim();
      const imgSrc = article.thumbnail || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=60';

      return `
        <article class="live-preview-card" onclick="window.open('${article.link}', '_blank')">
          <div class="lp-card-img-wrap">
            <img src="${imgSrc}" alt="${escapeHtmlLanding(title)}" class="lp-card-img" loading="lazy"
                 onerror="this.src='https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=60'" />
            ${article.isLive ? '<span class="lp-live-badge"><span class="lp-live-dot"></span>LIVE</span>' : ''}
          </div>
          <div class="lp-card-body">
            <div class="lp-card-meta">
              <span class="lp-card-category" style="color: ${catColor};">${catIcon} Sports</span>
              <span class="lp-card-time">${time}</span>
            </div>
            <h3 class="lp-card-title">${escapeHtmlLanding(title)}</h3>
            <div class="lp-card-footer">
              <span class="lp-card-source">${escapeHtmlLanding(article.source)}</span>
              <span class="lp-card-read">Read →</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    console.error('Error loading live news preview', err);
  }
}

function escapeHtmlLanding(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ==========================================================================
   LANDING TICKER
   ========================================================================== */
async function loadLandingTicker() {
  const track = document.getElementById('landing-ticker-track');
  if (!track) return;

  try {
    const headlines = await fetchTickerHeadlines();
    const tickerContent = headlines.map(h => {
      const clean = h.replace(/\s*-\s*[^-]+$/, '').trim();
      return `<span class="ticker-item"><span class="ticker-dot"></span>${escapeHtmlLanding(clean)}</span>`;
    }).join('');
    track.innerHTML = tickerContent + tickerContent;
  } catch {
    track.innerHTML = '<span class="ticker-item">Live sports updates loading...</span>';
  }
}

/* ==========================================================================
   INTERACTIVE COUNTERS
   ========================================================================== */
function animateCounters() {
  const stats = document.querySelectorAll('.stat-number');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute('data-target'));
        let count = 0;
        const duration = 2000; // 2 seconds
        const step = Math.ceil(target / (duration / 16)); // ~60fps

        const counter = setInterval(() => {
          count += step;
          if (count >= target) {
            entry.target.textContent = target.toLocaleString();
            clearInterval(counter);
          } else {
            entry.target.textContent = count.toLocaleString();
          }
        }, 16);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => observer.observe(stat));
}
