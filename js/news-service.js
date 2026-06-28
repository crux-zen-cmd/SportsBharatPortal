/* ==========================================================================
   LIVE SPORTS NEWS SERVICE — FETCHES REAL-TIME NEWS VIA RSS FEEDS
   Uses Google News RSS → rss2json.com for CORS-safe JSON conversion.
   ========================================================================== */

const NEWS_FEEDS = {
  all: 'https://news.google.com/rss/search?q=sports+India&hl=en-IN&gl=IN&ceid=IN:en',
  cricket: 'https://news.google.com/rss/search?q=cricket+India&hl=en-IN&gl=IN&ceid=IN:en',
  olympics: 'https://news.google.com/rss/search?q=Olympics+India+2026&hl=en-IN&gl=IN&ceid=IN:en',
  hockey: 'https://news.google.com/rss/search?q=hockey+India&hl=en-IN&gl=IN&ceid=IN:en',
  badminton: 'https://news.google.com/rss/search?q=badminton+India&hl=en-IN&gl=IN&ceid=IN:en',
  football: 'https://news.google.com/rss/search?q=football+India+ISL&hl=en-IN&gl=IN&ceid=IN:en',
  kabaddi: 'https://news.google.com/rss/search?q=kabaddi+India&hl=en-IN&gl=IN&ceid=IN:en',
  athletics: 'https://news.google.com/rss/search?q=athletics+India&hl=en-IN&gl=IN&ceid=IN:en',
  wrestling: 'https://news.google.com/rss/search?q=wrestling+India&hl=en-IN&gl=IN&ceid=IN:en',
  tennis: 'https://news.google.com/rss/search?q=tennis+India&hl=en-IN&gl=IN&ceid=IN:en',
};

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';

// In-memory cache with TTL
const newsCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch live sports news for a given category.
 * @param {string} category - One of: all, cricket, olympics, hockey, badminton, football, kabaddi, athletics, wrestling, tennis
 * @param {number} count - Number of articles to return (max ~10 on free tier)
 * @returns {Promise<Array>} Array of news article objects
 */
export async function fetchLiveNews(category = 'all', count = 10) {
  const cacheKey = `${category}_${count}`;

  // Return cached data if fresh
  if (newsCache[cacheKey] && (Date.now() - newsCache[cacheKey].timestamp < CACHE_TTL)) {
    return newsCache[cacheKey].data;
  }

  const feedUrl = NEWS_FEEDS[category] || NEWS_FEEDS.all;
  const apiUrl = `${RSS2JSON_BASE}${encodeURIComponent(feedUrl)}&count=${count}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const json = await response.json();

    if (json.status !== 'ok' || !json.items || json.items.length === 0) {
      throw new Error('No items returned from feed');
    }

    const articles = json.items.map((item, index) => ({
      id: `live_${category}_${index}`,
      title: cleanHTML(item.title),
      description: cleanHTML(item.description || item.content || ''),
      link: item.link,
      pubDate: item.pubDate,
      thumbnail: item.thumbnail || item.enclosure?.link || null,
      source: extractSource(item.title, item.author),
      category: category,
      isLive: true,
    }));

    // Cache the result
    newsCache[cacheKey] = { data: articles, timestamp: Date.now() };
    return articles;

  } catch (error) {
    console.warn(`[NewsService] Failed to fetch ${category} news:`, error.message);
    // Return cached data even if stale
    if (newsCache[cacheKey]) {
      return newsCache[cacheKey].data;
    }
    // Return fallback data
    return getFallbackNews(category);
  }
}

/**
 * Fetch news from multiple categories at once.
 * @param {string[]} categories 
 * @returns {Promise<Array>} Combined, deduplicated, sorted articles
 */
export async function fetchMultiCategoryNews(categories = ['all', 'cricket', 'olympics']) {
  const promises = categories.map(cat => fetchLiveNews(cat, 8));
  const results = await Promise.allSettled(promises);

  const allArticles = [];
  const seenTitles = new Set();

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      result.value.forEach(article => {
        const normalizedTitle = article.title.toLowerCase().trim();
        if (!seenTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle);
          allArticles.push(article);
        }
      });
    }
  });

  // Sort by publication date (newest first)
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return allArticles;
}

/**
 * Get trending headlines for the ticker bar.
 * @returns {Promise<string[]>} Array of headline strings
 */
export async function fetchTickerHeadlines() {
  try {
    const articles = await fetchLiveNews('all', 10);
    return articles.map(a => a.title);
  } catch {
    return [
      'India clinches gold at Asian Games 2026',
      'BCCI announces squad for upcoming series',
      'Indian hockey team qualifies for Olympics',
      'Neeraj Chopra sets new national record',
      'Pro Kabaddi League season 12 begins',
    ];
  }
}

// ===== UTILITY HELPERS =====

function cleanHTML(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

function extractSource(title, author) {
  // Google News titles often end with "- Source Name"
  const match = title?.match(/\s-\s([^-]+)$/);
  if (match) return match[1].trim();
  if (author) return author;
  return 'Sports News';
}

export function timeAgo(dateStr) {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getCategoryIcon(category) {
  const icons = {
    all: '🏅',
    cricket: '🏏',
    olympics: '🔥',
    hockey: '🏑',
    badminton: '🏸',
    football: '⚽',
    kabaddi: '💪',
    athletics: '🏃',
    wrestling: '🤼',
    tennis: '🎾',
  };
  return icons[category] || '🏅';
}

export function getCategoryColor(category) {
  const colors = {
    all: '#1e3a8a',
    cricket: '#047857',
    olympics: '#b91c1c',
    hockey: '#0369a1',
    badminton: '#7c3aed',
    football: '#059669',
    kabaddi: '#c2410c',
    athletics: '#0284c7',
    wrestling: '#9333ea',
    tennis: '#d97706',
  };
  return colors[category] || '#1e3a8a';
}

// ===== FALLBACK DATA =====

function getFallbackNews(category) {
  return [
    {
      id: 'fallback_1',
      title: 'India\'s Sports Revolution: Record Participation at National Games 2026',
      description: 'Over 12,000 athletes from 28 states compete across 36 disciplines in the biggest National Games in Indian history.',
      link: '#',
      pubDate: new Date().toISOString(),
      thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=60',
      source: 'SportsBharat',
      category: category,
      isLive: false,
    },
    {
      id: 'fallback_2',
      title: 'Olympic Preparations: Indian Athletes Begin Final Training Camp',
      description: 'The Sports Authority of India intensifies preparations with world-class facilities and international coaches.',
      link: '#',
      pubDate: new Date(Date.now() - 3600000).toISOString(),
      thumbnail: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&auto=format&fit=crop&q=60',
      source: 'SportsBharat',
      category: category,
      isLive: false,
    },
    {
      id: 'fallback_3',
      title: 'Grassroots Sports Initiative: 500 New Training Centers Announced',
      description: 'Ministry of Youth Affairs unveils plans for grassroots development centers in tier-2 and tier-3 cities.',
      link: '#',
      pubDate: new Date(Date.now() - 7200000).toISOString(),
      thumbnail: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&auto=format&fit=crop&q=60',
      source: 'SportsBharat',
      category: category,
      isLive: false,
    },
    {
      id: 'fallback_4',
      title: 'BCCI Announces New Talent Identification Program Across India',
      description: 'A nationwide scouting initiative to identify cricket talent from remote and underrepresented regions.',
      link: '#',
      pubDate: new Date(Date.now() - 10800000).toISOString(),
      thumbnail: 'https://images.unsplash.com/photo-1540747737956-37872404a87a?w=600&auto=format&fit=crop&q=60',
      source: 'SportsBharat',
      category: category,
      isLive: false,
    },
    {
      id: 'fallback_5',
      title: 'Indian Wrestling Federation Reforms Show Positive Results',
      description: 'New governance structure and athlete-centric policies lead to improved performance at international events.',
      link: '#',
      pubDate: new Date(Date.now() - 14400000).toISOString(),
      thumbnail: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=60',
      source: 'SportsBharat',
      category: category,
      isLive: false,
    },
  ];
}
