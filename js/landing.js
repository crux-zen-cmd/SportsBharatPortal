/* ==========================================================================
   LANDING PAGE CONTROLLER - DYNAMIC DATA BINDING & INTERACTIVITY
   ========================================================================== */

import { SportsPortal } from './firebase-config.js';

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
  await loadNewsCarousel();
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
   SPORTS LOADER
   ========================================================================== */
async function loadSportsGrid() {
  const grid = document.getElementById('sports-grid');
  if (!grid) return;

  try {
    const sportsList = await SportsPortal.db.getCollection('sports');
    grid.innerHTML = sportsList.map(sport => `
      <div class="sport-card glass-card" onclick="quickFilterSport('${sport.title}')">
        <span class="sport-card-icon">${sport.icon || '🏆'}</span>
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

  if (comps.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">No competitions match your selected filters.</div>`;
    return;
  }

  grid.innerHTML = comps.map(c => {
    const statusBadge = c.status === 'upcoming' 
      ? '<span class="badge badge-success">Upcoming</span>' 
      : c.status === 'ongoing' 
      ? '<span class="badge badge-warning">Ongoing</span>' 
      : '<span class="badge badge-danger">Completed</span>';

    const priceText = c.regFee === "0" ? '<span class="comp-price free">FREE</span>' : `<span class="comp-price">₹${c.regFee}</span>`;

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
            <div class="info-item">🏆 Sport: <strong>${c.sportType}</strong></div>
            <div class="info-item">🏟️ Venue: <strong>${c.venue}</strong></div>
          </div>
          <div class="comp-footer">
            ${priceText}
            <a href="pages/auth/register.html" class="btn btn-primary">Register Now</a>
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
   NEWS CAROUSEL CONTROLLER
   ========================================================================== */
async function loadNewsCarousel() {
  const track = document.getElementById('news-track');
  const dotsContainer = document.getElementById('carousel-dots');
  if (!track) return;

  try {
    const newsList = await SportsPortal.db.getCollection('news');
    track.innerHTML = newsList.map(item => `
      <div class="news-item">
        <div class="news-image">
          <img src="${item.imageUrl}" alt="${item.title}" />
        </div>
        <div class="news-content">
          <span class="news-date">📢 Announcement · ${item.date}</span>
          <h3 class="news-title">${item.title}</h3>
          <p class="news-excerpt">${item.excerpt}</p>
          <a href="pages/auth/login.html" class="btn btn-ghost">Read Full Release</a>
        </div>
      </div>
    `).join('');

    // Setup Dots
    dotsContainer.innerHTML = newsList.map((_, idx) => `
      <div class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="goToSlide(${idx})"></div>
    `).join('');

    // Carousel state
    let currentIndex = 0;
    const slides = newsList.length;

    const updateCarousel = (index) => {
      track.style.transform = `translateX(-${index * 100}%)`;
      document.querySelectorAll('.carousel-dot').forEach((dot, idx) => {
        dot.classList.toggle('active', idx === index);
      });
      currentIndex = index;
    };

    window.goToSlide = (index) => updateCarousel(index);

    document.getElementById('news-next').addEventListener('click', () => {
      let nextIdx = (currentIndex + 1) % slides;
      updateCarousel(nextIdx);
    });

    document.getElementById('news-prev').addEventListener('click', () => {
      let prevIdx = (currentIndex - 1 + slides) % slides;
      updateCarousel(prevIdx);
    });

    // Auto-advance
    setInterval(() => {
      let nextIdx = (currentIndex + 1) % slides;
      updateCarousel(nextIdx);
    }, 6000);

  } catch (err) {
    console.error("Error setting up news carousel", err);
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
