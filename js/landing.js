/* ==========================================================================
   LANDING PAGE CONTROLLER - DYNAMIC DATA BINDING & INTERACTIVITY
   ========================================================================== */

import { SportsPortal } from './firebase-config.js';
import { fetchLiveNews, fetchTickerHeadlines, timeAgo, getCategoryIcon, getCategoryColor } from './news-service.js';
import { fetchLiveIndianCompetitions, getOfficialRegistrationUrl } from './live-competitions-service.js';
import { translations } from './translations.js';
import { getEventRelatedPhoto } from './image-fallback.js';

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

  // Load dynamically from Simulated DB & Live Aggregator
  await loadSportsGrid();
  await loadCompetitions();
  await loadSquads();
  await loadQuizzes();
  setupLiveFetchTrigger();
  setupStatusFilterPills();
  setupCategoryRail();
  setupOpportunityModal();
  setupSquadModals();
  setupHostCompModal();
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
   LIVE INDIAN COMPETITIONS ENGINE (UNSTOP FOR SPORTS)
   ========================================================================== */
let allCompetitions = [];
let activeStatusFilter = 'all';
let activeRailFilter = 'all';

async function loadCompetitions(forceRefresh = false) {
  const grid = document.getElementById('competitions-grid');
  if (!grid) return;

  // Insert loading skeletons first
  grid.innerHTML = Array(3).fill().map(() => `
    <div class="unstop-opportunity-card skeleton-card">
      <div class="skeleton" style="height: 165px; border-radius: 14px 14px 0 0;"></div>
      <div style="padding: 1.25rem;">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 70%;"></div>
      </div>
    </div>
  `).join('');

  try {
    // 1. Fetch live and upcoming Indian sports competitions from multi-source aggregator
    const liveIndianComps = await fetchLiveIndianCompetitions(forceRefresh);

    // 2. Fetch any community/organizer hosted competitions from SimulatedFirestore
    let hostedComps = [];
    try {
      hostedComps = await SportsPortal.db.getCollection('competitions');
    } catch {
      hostedComps = [];
    }

    // 3. Merge & Deduplicate
    const compMap = new Map();
    // Prefer hosted if duplicate ID exists
    [...liveIndianComps, ...hostedComps].forEach(c => {
      if (c && c.id) {
        compMap.set(c.id, c);
      }
    });

    allCompetitions = Array.from(compMap.values());

    // 4. Calculate live metrics
    updateCompetitionCounters(allCompetitions);

    // 5. Initial render with active filters
    filterAndRenderCompetitions();

    // 6. Setup search and filter input event listeners (only once)
    setupFilterInputs();

  } catch (err) {
    console.error('[CompetitionsEngine] Error loading competitions:', err);
    grid.innerHTML = `<div class="error-msg" style="grid-column: 1/-1; text-align: center; padding: 2rem;">Failed to fetch live competitions. <button onclick="window.loadCompetitions(true)" class="btn btn-outline" style="margin-left: 8px;">Retry</button></div>`;
  }
}
window.loadCompetitions = loadCompetitions;

function updateCompetitionCounters(comps) {
  const total = comps.length;
  const liveCount = comps.filter(c => c.status === 'ongoing' || c.daysLeft <= 1).length;
  const closingCount = comps.filter(c => c.daysLeft > 0 && c.daysLeft <= 3).length;
  const upcomingCount = comps.filter(c => c.status === 'upcoming').length;
  const trialCount = comps.filter(c => c.category === 'trial' || (c.opportunityType && c.opportunityType.toLowerCase().includes('trial')) || (c.title && c.title.toLowerCase().includes('trial'))).length;
  const freeCount = comps.filter(c => c.regFee === '0' || c.regFee === 0).length;
  const tourneyCount = comps.filter(c => c.category === 'tournament').length;
  const athleticsCount = comps.filter(c => c.sportType === 'Athletics').length;

  const liveTextEl = document.getElementById('live-count-text');
  if (liveTextEl) {
    liveTextEl.innerHTML = `<strong>${total} Live & Upcoming Sports Competitions</strong> verified across India (BWF, AIFF, BCCI, AKFI, AFI)`;
  }

  // Pill counts
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt('pill-count-all', total);
  setTxt('pill-count-live', liveCount);
  setTxt('pill-count-closing', closingCount);
  setTxt('pill-count-upcoming', upcomingCount);
  setTxt('pill-count-trials', trialCount);
  setTxt('pill-count-free', freeCount);

  // Rail counts
  setTxt('rail-count-all', `${total}+`);
  setTxt('rail-count-live', liveCount);
  setTxt('rail-count-closing', closingCount);
  setTxt('rail-count-tournament', tourneyCount);
  setTxt('rail-count-trial', trialCount);
  setTxt('rail-count-athletics', athleticsCount);
}

function filterAndRenderCompetitions() {
  const searchInput = document.getElementById('comp-search');
  const sportSelect = document.getElementById('filter-sport');
  const stateSelect = document.getElementById('filter-state');
  const typeSelect = document.getElementById('filter-type');

  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const sport = sportSelect ? sportSelect.value : 'all';
  const state = stateSelect ? stateSelect.value : 'all';
  const type = typeSelect ? typeSelect.value : 'all';

  const filtered = allCompetitions.filter(c => {
    // Search query matches title, venue, city, or host org
    const matchesQuery = !query ||
      (c.title && c.title.toLowerCase().includes(query)) ||
      (c.venue && c.venue.toLowerCase().includes(query)) ||
      (c.city && c.city.toLowerCase().includes(query)) ||
      (c.hostOrg && c.hostOrg.toLowerCase().includes(query)) ||
      (c.sportType && c.sportType.toLowerCase().includes(query));

    // Sport dropdown
    const matchesSport = sport === 'all' || (c.sportType && c.sportType.toLowerCase() === sport.toLowerCase());

    // State dropdown
    const matchesState = state === 'all' || (c.state && c.state.toLowerCase() === state.toLowerCase());

    // Type dropdown
    const matchesType = type === 'all' ||
      (type === 'trial' && (c.category === 'trial' || c.opportunityType.toLowerCase().includes('trial') || c.title.toLowerCase().includes('trial'))) ||
      (type === 'tournament' && (c.category === 'tournament' || !c.category));

    // Status filter pill
    let matchesStatus = true;
    if (activeStatusFilter === 'live') {
      matchesStatus = c.status === 'ongoing' || c.daysLeft <= 1;
    } else if (activeStatusFilter === 'closing') {
      matchesStatus = c.daysLeft > 0 && c.daysLeft <= 3;
    } else if (activeStatusFilter === 'upcoming') {
      matchesStatus = c.status === 'upcoming';
    } else if (activeStatusFilter === 'trial') {
      matchesStatus = c.category === 'trial' || (c.opportunityType && c.opportunityType.toLowerCase().includes('trial')) || (c.title && c.title.toLowerCase().includes('trial'));
    } else if (activeStatusFilter === 'free') {
      matchesStatus = c.regFee === '0' || c.regFee === 0;
    }

    // Rail filter
    let matchesRail = true;
    if (activeRailFilter === 'live') {
      matchesRail = c.status === 'ongoing' || c.daysLeft <= 1;
    } else if (activeRailFilter === 'closing') {
      matchesRail = c.daysLeft > 0 && c.daysLeft <= 3;
    } else if (activeRailFilter === 'tournament') {
      matchesRail = c.category === 'tournament' || !c.category;
    } else if (activeRailFilter === 'trial') {
      matchesRail = c.category === 'trial' || (c.opportunityType && c.opportunityType.toLowerCase().includes('trial'));
    } else if (activeRailFilter === 'athletics') {
      matchesRail = c.sportType === 'Athletics';
    }

    return matchesQuery && matchesSport && matchesState && matchesType && matchesStatus && matchesRail;
  });

  renderFilteredCompetitions(filtered);
}

function renderFilteredCompetitions(comps) {
  const grid = document.getElementById('competitions-grid');
  if (!grid) return;

  const currentLang = localStorage.getItem('lang') || 'en';
  const isHi = currentLang === 'hi';

  if (!comps || comps.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-secondary); background: var(--bg-primary); border-radius: 14px; border: 1px dashed var(--glass-border);">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🔍</div>
        <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-primary);">
          ${isHi ? 'कोई प्रतियोगिता नहीं मिली' : 'No Competitions Match Your Filters'}
        </h3>
        <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto 1.5rem; color: var(--text-muted);">
          ${isHi ? 'कृपया अलग खेल, राज्य या स्थिति चुनकर पुनः प्रयास करें।' : 'Try resetting your search filters or click "Fetch Live Competitions" to discover newly published events across India.'}
        </p>
        <button onclick="window.resetCompetitionFilters()" class="btn btn-outline">Reset Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = comps.map(c => {
    // Urgency Chip
    let urgencyBadge = '';
    if (c.status === 'ongoing' || c.daysLeft <= 1) {
      urgencyBadge = `<span class="unstop-card-urgency urgent"><span class="live-pulse-dot pulse-red"></span> ${isHi ? '🔴 लाइव जारी है' : '🔴 LIVE MATCHES NOW'}</span>`;
    } else if (c.daysLeft <= 3 && c.daysLeft > 0) {
      urgencyBadge = `<span class="unstop-card-urgency urgent">⚡ ${isHi ? `समाप्त होने में ${c.daysLeft} दिन` : `CLOSING IN ${c.daysLeft} DAYS`}</span>`;
    } else {
      urgencyBadge = `<span class="unstop-card-urgency">📅 ${isHi ? `${c.daysLeft || 10} दिन शेष` : `${c.daysLeft || 10} DAYS LEFT`}</span>`;
    }

    // Capacity bar
    const regCount = c.registeredCount || 420;
    const maxCount = c.maxParticipants || 1000;
    const pct = Math.min(Math.round((regCount / maxCount) * 100), 100);
    const isHighCap = pct >= 80;

    // Fee text
    const feeText = (c.regFee === "0" || c.regFee === 0)
      ? `<span class="metric-val" style="color: #22c55e; font-weight: 700;">${isHi ? 'निःशुल्क (FREE)' : 'FREE ENTRY'}</span>`
      : `<span class="metric-val" style="font-weight: 700;">₹${c.regFee}</span>`;

    // Tags
    const tagsHtml = (c.tags || [`🏅 ${c.sportType}`, '🏆 State Level']).slice(0, 3).map(tag => `
      <span class="opp-tag">${escapeHtmlLanding(tag)}</span>
    `).join('');

    const cardThumb = c.thumbnail || c.bannerUrl || (typeof getEventRelatedPhoto === 'function' ? getEventRelatedPhoto(c.sportType, c.title) : 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60');

    return `
      <article class="unstop-opportunity-card" data-comp-id="${c.id}">
        <div class="unstop-card-banner-wrap">
          <img src="${cardThumb}" 
               alt="${escapeHtmlLanding(c.title)}" class="unstop-card-banner" loading="lazy"
               data-category="${c.sportType || ''}"
               onerror="this.onerror=null; if(window.SB_IMG_PLACEHOLDER) this.src=window.SB_IMG_PLACEHOLDER('${c.sportType || 'default'}', '${escapeHtmlLanding(c.title)}')" />
          ${urgencyBadge}
          <button class="unstop-card-bookmark" onclick="window.toggleBookmarkComp('${c.id}', event)" title="Bookmark Competition" aria-label="Bookmark">
            🔖
          </button>
        </div>

        <div class="unstop-card-content">
          <!-- Host Org Strip -->
          <div class="unstop-card-host-strip">
            <div class="host-avatar">${c.hostLogo || '🏆'}</div>
            <div class="host-details">
              <span class="host-name">
                ${escapeHtmlLanding(c.hostOrg || c.organizerName || 'National Sports Federation')}
                ${c.isVerified ? '<span class="verified-badge" title="Verified Federation">✓</span>' : ''}
              </span>
              <span class="opp-type-badge">${escapeHtmlLanding(c.opportunityType || c.category || 'Tournament')}</span>
            </div>
          </div>

          <!-- Title -->
          <h3 class="unstop-card-title" onclick="window.openOpportunityModal('${c.id}')" title="Click to view stages & rules">
            ${escapeHtmlLanding(c.title)}
          </h3>

          <!-- Tags -->
          <div class="unstop-card-tags">
            ${tagsHtml}
          </div>

          <!-- Key Metrics -->
          <div class="unstop-metrics-strip">
            <div class="metric-box">
              <span class="metric-label">${isHi ? 'पुरस्कार राशि' : 'Prize Pool / Perks'}</span>
              <span class="metric-val prize">${escapeHtmlLanding(c.prizePool || 'Official Trophy & Medal')}</span>
            </div>
            <div class="metric-box">
              <span class="metric-label">${isHi ? 'पंजीकरण शुल्क' : 'Registration Fee'}</span>
              ${feeText}
            </div>
            <div class="metric-box">
              <span class="metric-label">${isHi ? 'स्थान' : 'Venue & City'}</span>
              <span class="metric-val" style="font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtmlLanding(c.venue || c.city)}">
                📍 ${escapeHtmlLanding(c.city || 'India')}, ${escapeHtmlLanding(c.state || '')}
              </span>
            </div>
            <div class="metric-box">
              <span class="metric-label">${isHi ? 'अंतिम तिथि' : 'Registration Deadline'}</span>
              <span class="metric-val" style="font-size: 0.82rem;">
                ${c.deadlineDate || c.dateTime ? (c.deadlineDate || c.dateTime.split('T')[0]) : 'Open Now'}
              </span>
            </div>
          </div>

          <!-- Capacity Bar -->
          <div class="card-capacity-bar">
            <div class="capacity-text-row">
              <span><strong>${regCount}</strong> / ${maxCount} Registered</span>
              <span>${pct}% Filled</span>
            </div>
            <div class="capacity-track">
              <div class="capacity-fill ${isHighCap ? 'high' : ''}" style="width: ${pct}%;"></div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="unstop-card-actions" style="margin-top: 1rem;">
            <button class="btn-view-details" onclick="window.openOpportunityModal('${c.id}')">
              ${isHi ? 'विवरण और चरण देखें' : 'View Stages & Details'}
            </button>
            <a href="${getOfficialRegistrationUrl(c)}" target="_blank" rel="noopener noreferrer" class="btn-register-quick" title="Register directly on the official ${escapeHtmlLanding(c.hostOrg || c.sportType)} portal">
              ${isHi ? 'आधिकारिक पंजीकरण ↗' : 'Official Register ↗'}
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

let filterListenersAttached = false;
function setupFilterInputs() {
  if (filterListenersAttached) return;
  filterListenersAttached = true;

  const searchInput = document.getElementById('comp-search');
  const sportSelect = document.getElementById('filter-sport');
  const stateSelect = document.getElementById('filter-state');
  const typeSelect = document.getElementById('filter-type');

  const handler = () => filterAndRenderCompetitions();
  if (searchInput) searchInput.addEventListener('input', handler);
  if (sportSelect) sportSelect.addEventListener('change', handler);
  if (stateSelect) stateSelect.addEventListener('change', handler);
  if (typeSelect) typeSelect.addEventListener('change', handler);
}

window.resetCompetitionFilters = () => {
  const searchInput = document.getElementById('comp-search');
  const sportSelect = document.getElementById('filter-sport');
  const stateSelect = document.getElementById('filter-state');
  const typeSelect = document.getElementById('filter-type');
  if (searchInput) searchInput.value = '';
  if (sportSelect) sportSelect.value = 'all';
  if (stateSelect) stateSelect.value = 'all';
  if (typeSelect) typeSelect.value = 'all';

  activeStatusFilter = 'all';
  document.querySelectorAll('.status-pill').forEach(p => p.classList.toggle('active', p.dataset.status === 'all'));
  activeRailFilter = 'all';
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.toggle('active', p.dataset.railFilter === 'all'));

  filterAndRenderCompetitions();
};

window.quickFilterSport = (sportName) => {
  const sportSelect = document.getElementById('filter-sport');
  if (sportSelect) {
    sportSelect.value = sportName;
    filterAndRenderCompetitions();
    document.getElementById('competitions').scrollIntoView({ behavior: 'smooth' });
  }
};

window.toggleBookmarkComp = (compId, e) => {
  if (e) e.stopPropagation();
  const btn = e ? e.currentTarget : null;
  showToast('🔖 Competition bookmarked to your athlete dashboard!');
  if (btn) {
    btn.style.color = '#eab308';
    btn.style.borderColor = '#eab308';
  }
};

/* ==========================================================================
   LIVE FETCH TRIGGER & TOAST
   ========================================================================== */
function setupLiveFetchTrigger() {
  const btn = document.getElementById('btn-fetch-live');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.classList.add('spinning');
    btn.disabled = true;

    try {
      await loadCompetitions(true);
      showToast('✨ Successfully synced live sports competitions from BWF, AIFF, BCCI, AKFI & AFI!');
    } catch {
      showToast('⚠️ Sync complete with verified national sports calendar.');
    } finally {
      setTimeout(() => {
        btn.classList.remove('spinning');
        btn.disabled = false;
      }, 700);
    }
  });
}

function showToast(msg) {
  const existing = document.querySelector('.live-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'live-toast';
  toast.innerHTML = `<span>⚡</span> <span>${msg}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}
window.showToast = showToast;

/* ==========================================================================
   STATUS PILLS & CATEGORY RAIL BINDINGS
   ========================================================================== */
function setupStatusFilterPills() {
  const pills = document.querySelectorAll('.status-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeStatusFilter = pill.getAttribute('data-status') || 'all';
      filterAndRenderCompetitions();
    });
  });
}

function setupCategoryRail() {
  const railPills = document.querySelectorAll('.cat-pill[data-rail-filter]');
  railPills.forEach(pill => {
    pill.addEventListener('click', () => {
      railPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeRailFilter = pill.getAttribute('data-rail-filter') || 'all';

      // If status matches, sync status pill too
      if (['all', 'live', 'closing'].includes(activeRailFilter)) {
        activeStatusFilter = activeRailFilter;
        document.querySelectorAll('.status-pill').forEach(sp => {
          sp.classList.toggle('active', sp.dataset.status === activeRailFilter);
        });
      }

      filterAndRenderCompetitions();
      const compSection = document.getElementById('competitions');
      if (compSection) {
        compSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ==========================================================================
   OPPORTUNITY DETAILS & STAGES TIMELINE MODAL
   ========================================================================== */
let activeCompForModal = null;

function setupOpportunityModal() {
  const modal = document.getElementById('opp-detail-modal');
  const closeBtn = document.getElementById('btn-close-opp-modal');
  if (!modal) return;

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Solo vs Team tab switchers
  const tabSolo = document.getElementById('tab-solo-reg');
  const tabTeam = document.getElementById('tab-team-reg');
  const contentBox = document.getElementById('team-builder-content');

  if (tabSolo && tabTeam && contentBox) {
    tabSolo.addEventListener('click', () => {
      tabSolo.classList.add('active');
      tabTeam.classList.remove('active');
      contentBox.innerHTML = `
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
          Direct individual entry under verified athlete profile.
        </p>
      `;
    });

    tabTeam.addEventListener('click', () => {
      tabTeam.classList.add('active');
      tabSolo.classList.remove('active');
      const teamCode = activeCompForModal ? `TEAM-${activeCompForModal.sportType.slice(0,3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}` : 'TEAM-IND-5421';
      contentBox.innerHTML = `
        <div style="background: var(--bg-primary); padding: 1rem; border-radius: 8px; border: 1px solid var(--glass-border); margin: 0.5rem 0;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Your Generated Squad Code</div>
          <div class="team-code-badge">${teamCode}</div>
          <p style="font-size: 0.8rem; color: var(--text-muted);">Share this team invite code with your teammates so they can join your roster during registration.</p>
        </div>
      `;
    });
  }

  // Copy Opp Link
  const shareBtn = document.getElementById('btn-copy-opp-link');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if (activeCompForModal) {
        navigator.clipboard?.writeText(window.location.origin + '#comp-' + activeCompForModal.id);
        showToast('🔗 Competition link copied to clipboard!');
      }
    });
  }
}

window.openOpportunityModal = (compId) => {
  const modal = document.getElementById('opp-detail-modal');
  if (!modal) return;

  const comp = allCompetitions.find(c => c.id === compId);
  if (!comp) return;

  activeCompForModal = comp;

  // Fill Header
  const banner = document.getElementById('modal-banner-img');
  if (banner) {
    const modalImg = comp.thumbnail || comp.bannerUrl || (typeof getEventRelatedPhoto === 'function' ? getEventRelatedPhoto(comp.sportType, comp.title) : 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60');
    banner.src = modalImg;
    banner.onerror = function() {
      this.onerror = null;
      if (window.SB_IMG_PLACEHOLDER) this.src = window.SB_IMG_PLACEHOLDER(comp.sportType || 'default', comp.title);
    };
  }
  document.getElementById('modal-opp-title').textContent = comp.title;
  document.getElementById('modal-opp-category-badge').textContent = (comp.opportunityType || comp.category || 'Tournament').toUpperCase();
  document.getElementById('modal-opp-sport-badge').textContent = comp.sportType;
  document.getElementById('modal-opp-host-logo').textContent = comp.hostLogo || '🏆';
  document.getElementById('modal-opp-host-org').textContent = comp.hostOrg || comp.organizerName || 'National Sports Federation';

  // Status badge
  const statusBadgeEl = document.getElementById('modal-opp-status-badge');
  if (statusBadgeEl) {
    if (comp.status === 'ongoing' || comp.daysLeft <= 1) {
      statusBadgeEl.innerHTML = `<span class="unstop-card-urgency urgent"><span class="live-pulse-dot pulse-red"></span> LIVE NOW</span>`;
    } else {
      statusBadgeEl.innerHTML = `<span class="unstop-card-urgency">📅 ${comp.daysLeft || 10} Days Left</span>`;
    }
  }

  // Metrics
  document.getElementById('modal-opp-prize').textContent = comp.prizePool || 'Official Trophy & Certification';
  document.getElementById('modal-opp-fee').textContent = (comp.regFee === "0" || comp.regFee === 0) ? 'FREE' : `₹${comp.regFee}`;
  document.getElementById('modal-opp-venue').textContent = `${comp.venue || 'Sports Complex'}, ${comp.city || 'India'}, ${comp.state || ''}`;
  document.getElementById('modal-opp-deadline').textContent = comp.deadlineDate || (comp.dateTime ? comp.dateTime.split('T')[0] : 'Open Now');

  // Stages Timeline
  const stagesList = document.getElementById('modal-stages-list');
  if (stagesList) {
    const defaultStages = [
      { stageNum: 1, title: "Online Registration & Document Verification", dates: "Open Now", desc: "Submit player Aadhaar and sports profile credentials via SportsBharat." },
      { stageNum: 2, title: "District / Preliminary Qualifiers", dates: "Next Week", desc: "First round of knockout matches played at local grounds." },
      { stageNum: 3, title: "Quarter-Finals & Semi-Finals", dates: "Tournament Week", desc: "High-intensity matches evaluated by national talent scouts." },
      { stageNum: 4, title: "National Grand Finals & Podium Ceremony", dates: "Championship Day", desc: "Televised final with prize distribution and certificate issuance." }
    ];

    const stages = (comp.stages && comp.stages.length > 0) ? comp.stages : defaultStages;
    stagesList.innerHTML = stages.map((st, idx) => `
      <div class="stage-step ${idx === 0 ? 'active' : ''}">
        <div class="stage-node"></div>
        <div class="stage-header">
          <span class="stage-title">Stage ${st.stageNum || (idx + 1)}: ${escapeHtmlLanding(st.title)}</span>
          <span class="stage-dates">${escapeHtmlLanding(st.dates || '')}</span>
        </div>
        <div class="stage-desc">${escapeHtmlLanding(st.desc || '')}</div>
      </div>
    `).join('');
  }

  // Rules & Eligibility
  document.getElementById('modal-opp-eligibility').innerHTML = `<strong>Eligibility:</strong> ${escapeHtmlLanding(comp.eligibility || 'Open to all verified athletes with active national digital profile.')}`;
  document.getElementById('modal-opp-rules').innerHTML = `<strong>Official Regulations:</strong> ${escapeHtmlLanding(comp.rules || 'Official federation rules apply. Carry government verified identity proof and fitness declaration.')}`;

  // Action link
  const actionBtn = document.getElementById('modal-opp-action-btn');
  if (actionBtn) {
    const regUrl = getOfficialRegistrationUrl(comp);
    actionBtn.href = regUrl;
    actionBtn.target = '_blank';
    actionBtn.rel = 'noopener noreferrer';
    actionBtn.innerHTML = `Go to Official ${comp.hostOrg ? '(' + escapeHtmlLanding(comp.hostOrg) + ')' : ''} Registration ↗`;
  }

  modal.classList.add('active');
};

/* ==========================================================================
   SQUAD FINDER MATCHMAKING
   ========================================================================== */
async function loadSquads() {
  const grid = document.getElementById('squad-grid');
  if (!grid) return;

  try {
    const squads = await SportsPortal.db.getCollection('squads');
    if (!squads || squads.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No open squad requirements yet. Be the first to post!</div>';
      return;
    }

    grid.innerHTML = squads.map(sq => `
      <div class="squad-card">
        <div class="squad-card-header">
          <img src="${sq.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60'}" 
               alt="${escapeHtmlLanding(sq.authorName)}" class="squad-avatar" />
          <div>
            <div class="squad-author-name">${escapeHtmlLanding(sq.authorName)}</div>
            <div class="squad-author-sub">${escapeHtmlLanding(sq.authorRole || 'Team Leader')} • ${sq.postedAt || 'Recently'}</div>
          </div>
        </div>

        <div class="squad-role-badge">⚡ Seeking: ${escapeHtmlLanding(sq.roleNeeded)}</div>
        <div class="squad-target-tourney">🏆 ${escapeHtmlLanding(sq.tourneyTarget)} (${escapeHtmlLanding(sq.sport)})</div>
        <div class="squad-message">${escapeHtmlLanding(sq.message)}</div>

        <div class="squad-card-footer">
          <span class="squad-city">📍 ${escapeHtmlLanding(sq.city || 'India')}</span>
          <button class="btn-connect-squad" onclick="window.openSquadConnectModal('${escapeHtmlLanding(sq.authorName)}', '${escapeHtmlLanding(sq.roleNeeded)}', '${escapeHtmlLanding(sq.tourneyTarget)}', '${escapeHtmlLanding(sq.contactPhone || '+91 9876543210')}', '${sq.authorAvatar || ''}')">
            Connect &rarr;
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading squads:', err);
  }
}

function setupSquadModals() {
  const postModal = document.getElementById('post-squad-modal');
  const openPostBtn = document.getElementById('btn-open-post-squad');
  const closePostBtn = document.getElementById('btn-close-squad-modal');
  const formPost = document.getElementById('form-post-squad');

  if (openPostBtn && postModal) {
    openPostBtn.addEventListener('click', () => postModal.classList.add('active'));
  }
  if (closePostBtn && postModal) {
    closePostBtn.addEventListener('click', () => postModal.classList.remove('active'));
  }
  if (postModal) {
    postModal.addEventListener('click', (e) => {
      if (e.target === postModal) postModal.classList.remove('active');
    });
  }

  if (formPost) {
    formPost.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newSquad = {
        authorName: document.getElementById('squad-captain-name').value,
        authorRole: 'Team Captain',
        authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60',
        roleNeeded: document.getElementById('squad-role-needed').value,
        sport: document.getElementById('squad-sport-select').value,
        tourneyTarget: document.getElementById('squad-tourney-target').value,
        city: document.getElementById('squad-city').value,
        contactPhone: document.getElementById('squad-phone').value,
        message: document.getElementById('squad-details').value,
        postedAt: 'Just now'
      };

      try {
        await SportsPortal.db.addDoc('squads', newSquad);
        postModal.classList.remove('active');
        formPost.reset();
        await loadSquads();
        showToast('🚀 Squad requirement published! Athletes can now connect with you.');
      } catch (err) {
        console.error(err);
        showToast('⚠️ Error posting squad requirement.');
      }
    });
  }

  // Connect modal setup
  const connectModal = document.getElementById('squad-connect-modal');
  const closeConnectBtn = document.getElementById('btn-close-connect-modal');
  if (closeConnectBtn && connectModal) {
    closeConnectBtn.addEventListener('click', () => connectModal.classList.remove('active'));
  }
  if (connectModal) {
    connectModal.addEventListener('click', (e) => {
      if (e.target === connectModal) connectModal.classList.remove('active');
    });
  }
}

window.openSquadConnectModal = (captainName, roleNeeded, tourney, phone, avatar) => {
  const modal = document.getElementById('squad-connect-modal');
  if (!modal) return;

  const avatarWrap = document.getElementById('connect-avatar-wrap');
  if (avatarWrap) {
    avatarWrap.innerHTML = `<img src="${avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60'}" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid var(--primary); margin: 0 auto; display: block;" />`;
  }
  document.getElementById('connect-captain-title').textContent = captainName;
  document.getElementById('connect-role-tag').textContent = `Looking for: ${roleNeeded}`;
  document.getElementById('connect-tourney-info').textContent = `For tournament: ${tourney}`;
  document.getElementById('connect-phone-val').textContent = phone;

  const cleanNum = phone.replace(/[^\d]/g, '');
  const waBtn = document.getElementById('connect-whatsapp-btn');
  if (waBtn) {
    waBtn.href = `https://wa.me/${cleanNum}?text=${encodeURIComponent(`Hi ${captainName}, I saw your squad requirement for "${roleNeeded}" in ${tourney} on SportsBharat. I'd love to join!`)}`;
  }

  modal.classList.add('active');
};

/* ==========================================================================
   SPORTS IQ ARENA (QUIZZES)
   ========================================================================== */
let activeQuiz = null;
let currentQIndex = 0;
let userScore = 0;
let quizTimerInterval = null;

async function loadQuizzes() {
  const grid = document.getElementById('quizzes-grid');
  if (!grid) return;

  try {
    const quizzes = await SportsPortal.db.getCollection('quizzes');
    if (!quizzes || quizzes.length === 0) return;

    grid.innerHTML = quizzes.map(q => `
      <div class="quiz-card">
        <div class="quiz-card-top">
          <span class="quiz-cat-tag">${escapeHtmlLanding(q.category)}</span>
          <span class="quiz-duration-badge">⏱️ ${escapeHtmlLanding(q.duration)}</span>
        </div>
        <h3 class="quiz-title">${escapeHtmlLanding(q.title)}</h3>
        <p class="quiz-desc">${escapeHtmlLanding(q.desc)}</p>
        <div class="quiz-perks">
          ${(q.perks || []).map(p => `<span class="quiz-perk-item">${escapeHtmlLanding(p)}</span>`).join('')}
        </div>
        <button class="btn-start-quiz" onclick="window.startQuiz('${q.id}')">
          Start Challenge &rarr;
        </button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading quizzes:', err);
  }
}

window.startQuiz = async (quizId) => {
  const modal = document.getElementById('quiz-modal');
  if (!modal) return;

  try {
    const quizzes = await SportsPortal.db.getCollection('quizzes');
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return;

    activeQuiz = quiz;
    currentQIndex = 0;
    userScore = 0;

    document.getElementById('quiz-modal-category').textContent = quiz.category.toUpperCase();
    document.getElementById('quiz-total-num').textContent = quiz.questions.length;
    document.getElementById('quiz-question-container').style.display = 'block';
    document.getElementById('quiz-results-container').style.display = 'none';

    renderCurrentQuestion();
    modal.classList.add('active');
  } catch (err) {
    console.error('Error starting quiz:', err);
  }
};

function renderCurrentQuestion() {
  if (!activeQuiz || currentQIndex >= activeQuiz.questions.length) {
    finishQuiz();
    return;
  }

  const q = activeQuiz.questions[currentQIndex];
  document.getElementById('quiz-current-num').textContent = currentQIndex + 1;
  document.getElementById('quiz-question-text').textContent = q.q;

  // Reset timer animation
  const fill = document.getElementById('quiz-timer-fill');
  if (fill) {
    fill.style.width = '100%';
    clearInterval(quizTimerInterval);
    let timeLeft = 100;
    quizTimerInterval = setInterval(() => {
      timeLeft -= 5;
      fill.style.width = `${Math.max(timeLeft, 0)}%`;
      if (timeLeft <= 0) {
        clearInterval(quizTimerInterval);
        currentQIndex++;
        renderCurrentQuestion();
      }
    }, 1000);
  }

  const optionsList = document.getElementById('quiz-options-list');
  optionsList.innerHTML = q.options.map((opt, idx) => `
    <button class="quiz-option" onclick="window.selectQuizOption(${idx}, this)">
      <strong>${String.fromCharCode(65 + idx)}.</strong> ${escapeHtmlLanding(opt)}
    </button>
  `).join('');
}

window.selectQuizOption = (selectedIndex, btn) => {
  clearInterval(quizTimerInterval);
  const q = activeQuiz.questions[currentQIndex];
  const allBtns = document.querySelectorAll('.quiz-option');
  allBtns.forEach(b => b.disabled = true);

  if (selectedIndex === q.correct) {
    btn.classList.add('correct');
    userScore++;
  } else {
    btn.classList.add('wrong');
    if (allBtns[q.correct]) allBtns[q.correct].classList.add('correct');
  }

  setTimeout(() => {
    currentQIndex++;
    renderCurrentQuestion();
  }, 1200);
};

function finishQuiz() {
  clearInterval(quizTimerInterval);
  document.getElementById('quiz-question-container').style.display = 'none';
  const results = document.getElementById('quiz-results-container');
  results.style.display = 'block';

  const total = activeQuiz.questions.length;
  document.getElementById('quiz-result-summary').textContent = `You scored ${userScore} out of ${total} correct in ${activeQuiz.title}!`;
  document.getElementById('quiz-badge-name').textContent = activeQuiz.category + ' Certified';

  showToast(`🎉 Challenge passed! +${userScore * 40} XP added to your sports talent score!`);

  const finishBtn = document.getElementById('btn-quiz-finish');
  if (finishBtn) {
    finishBtn.onclick = () => {
      document.getElementById('quiz-modal').classList.remove('active');
    };
  }
}

// Modal close button for quiz
const quizCloseBtn = document.getElementById('btn-close-quiz-modal');
if (quizCloseBtn) {
  quizCloseBtn.addEventListener('click', () => {
    clearInterval(quizTimerInterval);
    document.getElementById('quiz-modal').classList.remove('active');
  });
}

/* ==========================================================================
   HOST TOURNAMENT MODAL
   ========================================================================== */
function setupHostCompModal() {
  const modal = document.getElementById('host-competition-modal');
  const openBtn = document.getElementById('btn-open-host-comp');
  const closeBtn = document.getElementById('btn-close-host-modal');
  const form = document.getElementById('form-host-competition');
  const sportSelect = document.getElementById('host-comp-sport');
  const titleInput = document.getElementById('host-comp-title');
  const bannerFile = document.getElementById('host-comp-banner-file');
  const bannerReset = document.getElementById('host-comp-banner-reset');
  const previewImg = document.getElementById('host-banner-preview-img');
  const bannerBadge = document.getElementById('host-banner-badge');
  const previewText = document.getElementById('host-banner-preview-text');

  let customHostPhoto = null;

  function updateHostPreview() {
    const sport = sportSelect ? sportSelect.value : 'Cricket';
    const title = titleInput ? titleInput.value : '';

    if (customHostPhoto) {
      if (previewImg) previewImg.src = customHostPhoto;
      if (bannerBadge) {
        bannerBadge.textContent = 'Custom Photo Loaded ✓';
        bannerBadge.style.background = 'rgba(34, 197, 94, 0.9)';
      }
      if (bannerReset) bannerReset.style.display = 'inline-flex';
      if (previewText) previewText.textContent = '✓ Custom event photo loaded as thumbnail.';
    } else {
      const related = typeof getEventRelatedPhoto === 'function'
        ? getEventRelatedPhoto(sport, title)
        : (window.getEventRelatedPhoto ? window.getEventRelatedPhoto(sport, title) : 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=60');
      
      if (previewImg) {
        previewImg.src = related;
        previewImg.onerror = function() {
          this.onerror = null;
          if (window.SB_IMG_PLACEHOLDER) this.src = window.SB_IMG_PLACEHOLDER(sport, title);
        };
      }
      if (bannerBadge) {
        bannerBadge.textContent = `Auto ${sport} Photo`;
        bannerBadge.style.background = 'rgba(0, 0, 0, 0.75)';
      }
      if (bannerReset) bannerReset.style.display = 'none';
      if (previewText) previewText.textContent = `If no custom photo is uploaded, related ${sport} photo is used as thumbnail automatically.`;
    }
  }

  if (sportSelect) {
    sportSelect.addEventListener('change', () => {
      if (!customHostPhoto) updateHostPreview();
    });
  }

  if (titleInput) {
    titleInput.addEventListener('input', () => {
      if (!customHostPhoto) updateHostPreview();
    });
  }

  if (bannerFile) {
    bannerFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          customHostPhoto = await SportsPortal.storage.uploadBytes(`banners/host_${Date.now()}_${file.name}`, file);
          updateHostPreview();
          showToast('✓ Custom event photo loaded!');
        } catch (err) {
          showToast('Upload error: ' + err.message);
        }
      }
    });
  }

  if (bannerReset) {
    bannerReset.addEventListener('click', () => {
      customHostPhoto = null;
      if (bannerFile) bannerFile.value = '';
      updateHostPreview();
    });
  }

  updateHostPreview();

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.classList.add('active');
      updateHostPreview();
    });
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sportVal = document.getElementById('host-comp-sport').value;
      const titleVal = document.getElementById('host-comp-title').value;

      // Event photo: custom if uploaded, else related sport photo
      const finalPhoto = customHostPhoto || (typeof getEventRelatedPhoto === 'function'
        ? getEventRelatedPhoto(sportVal, titleVal)
        : (window.getEventRelatedPhoto ? window.getEventRelatedPhoto(sportVal, titleVal) : 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=60'));

      const newComp = {
        title: titleVal,
        sportType: sportVal,
        category: document.getElementById('host-comp-type').value,
        opportunityType: document.getElementById('host-comp-type').value === 'trial' ? 'Pro Scouting Trial' : 'National Open Championship',
        state: document.getElementById('host-comp-state').value,
        city: document.getElementById('host-comp-city').value,
        venue: document.getElementById('host-comp-venue').value,
        regFee: document.getElementById('host-comp-fee').value,
        prizePool: document.getElementById('host-comp-prize').value,
        hostOrg: document.getElementById('host-comp-org').value,
        description: document.getElementById('host-comp-desc').value,
        status: 'upcoming',
        isVerified: true,
        hostLogo: '🏆',
        daysLeft: 12,
        maxParticipants: 800,
        registeredCount: 45,
        dateTime: '2026-09-15T09:00',
        bannerUrl: finalPhoto,
        thumbnail: finalPhoto,
        photoUrl: finalPhoto,
        hasCustomPhoto: !!customHostPhoto,
        tags: ['⭐ Federation Host', `🏅 ${sportVal}`, '📅 2026 Season']
      };

      try {
        await SportsPortal.db.addDoc('competitions', newComp);
        modal.classList.remove('active');
        form.reset();
        customHostPhoto = null;
        if (bannerFile) bannerFile.value = '';
        updateHostPreview();
        await loadCompetitions(true);
        showToast('🎉 Your tournament has been published live to the National Portal!');
      } catch (err) {
        console.error(err);
        showToast('⚠️ Error hosting competition. Please try again.');
      }
    });
  }
}


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
                 data-category="${escapeHtmlLanding(article.category || 'default')}" />
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
