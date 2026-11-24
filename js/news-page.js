/* ==========================================================================
   NEWS PAGE CONTROLLER — Live Sports News Integration
   ========================================================================== */

import { fetchLiveNews, fetchTickerHeadlines, timeAgo, getCategoryIcon, getCategoryColor } from './news-service.js';

let currentCategory = 'all';
let isLoading = false;

document.addEventListener('DOMContentLoaded', async () => {
  setupThemeToggle();
  setupMobileMenu();
  setupNavbarScroll();
  setupCategoryFilters();
  setupRefreshButton();
  setupQuickCategoryLinks();

  // Initial load
  await loadNews('all');
  await loadTicker();

  // Auto-refresh every 3 minutes
  setInterval(() => {
    loadNews(currentCategory, true);
    loadTicker();
  }, 180000);
});

/* ==========================================================================
   THEME TOGGLE
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
   MOBILE MENU
   ========================================================================== */
function setupMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });
  }
}

/* ==========================================================================
   NAVBAR SCROLL
   ========================================================================== */
function setupNavbarScroll() {
  const navbar = document.getElementById('main-navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

/* ==========================================================================
   CATEGORY FILTER TABS
   ========================================================================== */
function setupCategoryFilters() {
  const tabs = document.querySelectorAll('.news-filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;
      if (category === currentCategory && !isLoading) return;

      // Update active state
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      loadNews(category);
    });
  });
}

/* ==========================================================================
   QUICK CATEGORY LINKS (Sidebar)
   ========================================================================== */
function setupQuickCategoryLinks() {
  document.querySelectorAll('.quick-cat-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const category = link.dataset.category;
      // Activate the corresponding tab
      document.querySelectorAll('.news-filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
      });
      loadNews(category);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* ==========================================================================
   REFRESH BUTTON
   ========================================================================== */
function setupRefreshButton() {
  const refreshBtn = document.getElementById('refresh-news');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.classList.add('spinning');
      loadNews(currentCategory, true).then(() => {
        setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
      });
    });
  }
}

/* ==========================================================================
   MAIN NEWS LOADER
   ========================================================================== */
async function loadNews(category = 'all', silent = false) {
  if (isLoading) return;
  isLoading = true;
  currentCategory = category;

  const statusText = document.getElementById('news-status-text');
  const featuredEl = document.getElementById('featured-article');
  const gridEl = document.getElementById('news-grid');
  const trendingEl = document.getElementById('trending-list');

  if (!silent) {
    statusText.textContent = `Fetching live ${category === 'all' ? '' : category + ' '}news...`;
  }

  try {
    const articles = await fetchLiveNews(category, 10);

    if (articles.length === 0) {
      featuredEl.innerHTML = `<div class="no-news">No news available for this category right now. Try again later.</div>`;
      gridEl.innerHTML = '';
      isLoading = false;
      return;
    }

    // Render featured article (first one)
    const featured = articles[0];
    featuredEl.innerHTML = renderFeaturedArticle(featured);

    // Render remaining articles in grid
    const remaining = articles.slice(1);
    if (remaining.length > 0) {
      gridEl.innerHTML = remaining.map(article => renderNewsCard(article)).join('');
    } else {
      gridEl.innerHTML = `<div class="no-news" style="grid-column: 1/-1;">More articles coming soon...</div>`;
    }

    // Render trending sidebar
    renderTrendingList(articles.slice(0, 5), trendingEl);

    // Update status
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    statusText.innerHTML = `<span class="live-dot"></span> Updated at ${now} · ${articles.length} articles`;

    // Animate cards in
    requestAnimationFrame(() => {
      document.querySelectorAll('.news-card, .featured-article-inner').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.08}s`;
        card.classList.add('animate-in');
      });
    });

  } catch (error) {
    console.error('[NewsPage] Error loading news:', error);
    statusText.textContent = 'Unable to fetch live news. Showing cached data.';
  }

  isLoading = false;
}

/* ==========================================================================
   RENDER — FEATURED ARTICLE
   ========================================================================== */
function renderFeaturedArticle(article) {
  const catIcon = getCategoryIcon(article.category);
  const catColor = getCategoryColor(article.category);
  const time = timeAgo(article.pubDate);

  const imgSrc = article.thumbnail || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60';

  return `
    <div class="featured-article-inner">
      <div class="featured-img-wrap">
        <img src="${imgSrc}" alt="${escapeHtml(article.title)}" class="featured-img"
             data-category="${escapeHtml(article.category || 'default')}" />
        <div class="featured-overlay"></div>
        ${article.isLive ? '<div class="featured-live-badge"><span class="live-pulse"></span>LIVE</div>' : ''}
      </div>
      <div class="featured-body">
        <div class="featured-meta">
          <span class="featured-category" style="background: ${catColor}15; color: ${catColor}; border-color: ${catColor}30;">
            ${catIcon} ${capitalizeFirst(article.category)}
          </span>
          <span class="featured-time">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="7" cy="7" r="6" /><polyline points="7 4 7 7 9 8" />
            </svg>
            ${time}
          </span>
        </div>
        <h2 class="featured-title">${escapeHtml(cleanTitle(article.title))}</h2>
        <p class="featured-desc">${escapeHtml(article.description.substring(0, 200))}${article.description.length > 200 ? '...' : ''}</p>
        <div class="featured-footer">
          <span class="featured-source">Source: ${escapeHtml(article.source)}</span>
          <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            Read Full Story
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12l5-5-5-5"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   RENDER — NEWS CARD
   ========================================================================== */
function renderNewsCard(article) {
  const catIcon = getCategoryIcon(article.category);
  const catColor = getCategoryColor(article.category);
  const time = timeAgo(article.pubDate);

  const imgSrc = article.thumbnail || getRandomSportsImage(article.category);

  return `
    <article class="news-card" onclick="window.open('${article.link}', '_blank')">
      <div class="news-card-img-wrap">
        <img src="${imgSrc}" alt="${escapeHtml(article.title)}" class="news-card-img" loading="lazy"
             data-category="${escapeHtml(article.category || 'default')}" />
        ${article.isLive ? '<span class="card-live-badge"><span class="live-pulse-sm"></span>LIVE</span>' : ''}
      </div>
      <div class="news-card-body">
        <div class="news-card-meta">
          <span class="news-card-category" style="color: ${catColor};">
            ${catIcon} ${capitalizeFirst(article.category)}
          </span>
          <span class="news-card-time">${time}</span>
        </div>
        <h3 class="news-card-title">${escapeHtml(cleanTitle(article.title))}</h3>
        <p class="news-card-desc">${escapeHtml(article.description.substring(0, 120))}${article.description.length > 120 ? '...' : ''}</p>
        <div class="news-card-footer">
          <span class="news-card-source">${escapeHtml(article.source)}</span>
          <span class="news-card-read-more">Read →</span>
        </div>
      </div>
    </article>
  `;
}

/* ==========================================================================
   RENDER — TRENDING LIST
   ========================================================================== */
function renderTrendingList(articles, container) {
  if (!container) return;
  container.innerHTML = articles.map((article, index) => `
    <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="trending-item">
      <span class="trending-rank">${index + 1}</span>
      <div class="trending-info">
        <span class="trending-title">${escapeHtml(cleanTitle(article.title))}</span>
        <span class="trending-meta">${timeAgo(article.pubDate)} · ${escapeHtml(article.source)}</span>
      </div>
    </a>
  `).join('');
}

/* ==========================================================================
   LIVE TICKER
   ========================================================================== */
async function loadTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  try {
    const headlines = await fetchTickerHeadlines();
    const tickerContent = headlines.map(h => `
      <span class="ticker-item">
        <span class="ticker-dot"></span>
        ${escapeHtml(cleanTitle(h))}
      </span>
    `).join('');

    // Duplicate for seamless loop
    track.innerHTML = tickerContent + tickerContent;
  } catch {
    track.innerHTML = '<span class="ticker-item">Live sports updates loading...</span>';
  }
}

/* ==========================================================================
   UTILITIES
   ========================================================================== */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function cleanTitle(title) {
  // Remove the " - Source Name" suffix from Google News titles
  return title.replace(/\s*-\s*[^-]+$/, '').trim();
}

function getRandomSportsImage(category) {
  const images = {
    cricket: 'https://images.unsplash.com/photo-1540747737956-37872404a87a?w=400&auto=format&fit=crop&q=60',
    hockey: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&auto=format&fit=crop&q=60',
    football: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&auto=format&fit=crop&q=60',
    badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&auto=format&fit=crop&q=60',
    athletics: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=60',
    olympics: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=60',
    default: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=60',
  };
  return images[category] || images.default;
}
