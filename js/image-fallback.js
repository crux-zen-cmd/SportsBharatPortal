/* ==========================================================================
   SHARED EVENT PHOTO & FALLBACK ENGINE — SportsBharat Portal
   Provides verified sport-specific photos, dynamic thumbnails,
   and guaranteed-render local SVG placeholders for offline safety.
   ========================================================================== */

export const CAT_COLORS = {
  cricket:     ['#1a5276', '#f39c12'],
  hockey:      ['#1a3c5e', '#27ae60'],
  football:    ['#145a32', '#f1c40f'],
  soccer:      ['#145a32', '#f1c40f'],
  badminton:   ['#4a235a', '#e74c3c'],
  athletics:   ['#6e2f1a', '#e67e22'],
  olympics:    ['#0d3b6e', '#c0392b'],
  kabaddi:     ['#2e4057', '#e74c3c'],
  wrestling:   ['#1b2631', '#e67e22'],
  tennis:      ['#1e8449', '#f9ca24'],
  tabletennis: ['#c0392b', '#2980b9'],
  basketball:  ['#d35400', '#2980b9'],
  chess:       ['#2c3e50', '#bdc3c7'],
  volleyball:  ['#16a085', '#f39c12'],
  swimming:    ['#0984e3', '#00cec9'],
  boxing:      ['#b71540', '#e58e26'],
  cycling:     ['#009432', '#ffd32a'],
  esports:     ['#6c5ce7', '#a29bfe'],
  default:     ['#1e3a8a', '#f97316'],
};

/**
 * Curated, verified, high-resolution action photos for every sports discipline.
 * Used as automatic event thumbnails whenever an organizer does not upload a custom photo.
 */
export const SPORT_RELATED_PHOTOS = {
  cricket:     'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=60',
  football:    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=60',
  soccer:      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=60',
  badminton:   'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=60',
  kabaddi:     'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=60',
  athletics:   'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60',
  basketball:  'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=60',
  chess:       'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=60',
  hockey:      'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=800&auto=format&fit=crop&q=60',
  volleyball:  'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=60',
  swimming:    'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&auto=format&fit=crop&q=60',
  tennis:      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&auto=format&fit=crop&q=60',
  tabletennis: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800&auto=format&fit=crop&q=60',
  wrestling:   'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=60',
  boxing:      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&auto=format&fit=crop&q=60',
  cycling:     'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=60',
  esports:     'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60',
  default:     'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60',
};

/**
 * Returns a high-quality, verified event photo based on sport discipline or title.
 * Used whenever an event is created without a custom photo upload.
 */
export function getEventRelatedPhoto(sportType, title = '') {
  const normSport = (sportType || '').toLowerCase().trim().replace(/[\s\-_]/g, '');
  if (SPORT_RELATED_PHOTOS[normSport]) {
    return SPORT_RELATED_PHOTOS[normSport];
  }

  // Check sport substring
  for (const [key, url] of Object.entries(SPORT_RELATED_PHOTOS)) {
    if (key !== 'default' && normSport.includes(key)) {
      return url;
    }
  }

  // Fallback keyword search on title
  const t = (title || '').toLowerCase();
  if (/cricket|ipl|ranji|t20|odi|batsman|bowler/.test(t)) return SPORT_RELATED_PHOTOS.cricket;
  if (/football|soccer|fifa|isl|durand|messi|ronaldo/.test(t)) return SPORT_RELATED_PHOTOS.football;
  if (/badminton|shuttle|bwf|yonex/.test(t)) return SPORT_RELATED_PHOTOS.badminton;
  if (/kabaddi|pro kabaddi|raid/.test(t)) return SPORT_RELATED_PHOTOS.kabaddi;
  if (/run|marathon|sprint|athletic|relay|track|100m|half marathon/.test(t)) return SPORT_RELATED_PHOTOS.athletics;
  if (/basket|nba|dunk/.test(t)) return SPORT_RELATED_PHOTOS.basketball;
  if (/chess|grandmaster|fide|checkmate/.test(t)) return SPORT_RELATED_PHOTOS.chess;
  if (/hockey|stick|puck/.test(t)) return SPORT_RELATED_PHOTOS.hockey;
  if (/volley|spike/.test(t)) return SPORT_RELATED_PHOTOS.volleyball;
  if (/swim|aquatic|water|dive/.test(t)) return SPORT_RELATED_PHOTOS.swimming;
  if (/table tennis|ping pong/.test(t)) return SPORT_RELATED_PHOTOS.tabletennis;
  if (/tennis|wimbledon|atp|wta/.test(t)) return SPORT_RELATED_PHOTOS.tennis;
  if (/wrestl|kushti|dangal|mat/.test(t)) return SPORT_RELATED_PHOTOS.wrestling;
  if (/box|ring|punch/.test(t)) return SPORT_RELATED_PHOTOS.boxing;
  if (/cycl|bike|bicycle|pedal/.test(t)) return SPORT_RELATED_PHOTOS.cycling;
  if (/game|gaming|esport|bgmi|bgis|valorant/.test(t)) return SPORT_RELATED_PHOTOS.esports;

  return SPORT_RELATED_PHOTOS.default;
}

export function makePlaceholder(category, title) {
  const normKey = (category || 'default').toLowerCase().trim().replace(/[\s\-_]/g, '');
  const [bg, accent] = CAT_COLORS[normKey] || CAT_COLORS.default;
  // Simple hash of title for visual variety
  let hash = 0;
  for (let i = 0; i < (title || '').length; i++) hash = (hash * 31 + (title || '').charCodeAt(i)) & 0xffff;
  const sport = (category || 'Sports').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bg}"/>
        <stop offset="1" stop-color="${accent}" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#g)"/>
    <circle cx="300" cy="175" r="62" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.8"/>
    <text x="300" y="193" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif"
          font-size="38" font-weight="800">SB</text>
    <text x="300" y="268" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif"
          font-size="20" font-weight="700" letter-spacing="2">${sport}</text>
    <text x="300" y="296" text-anchor="middle" fill="#e2e8f0" font-family="Arial,sans-serif"
          font-size="12" letter-spacing="1">SportsBharat National Portal</text>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

// Default placeholder (no category context)
const SB_DEFAULT_PLACEHOLDER = makePlaceholder('default', '');

// Global bindings for non-module scripts and inline error handlers
if (typeof window !== 'undefined') {
  window.CAT_COLORS = CAT_COLORS;
  window.SPORT_RELATED_PHOTOS = SPORT_RELATED_PHOTOS;
  window.getEventRelatedPhoto = getEventRelatedPhoto;
  window.SB_IMG_FALLBACK = SB_DEFAULT_PLACEHOLDER;
  window.SB_IMG_PLACEHOLDER = makePlaceholder;

  // Delegated safety net: any <img> error on the page falls back automatically.
  window.addEventListener('error', function (e) {
    const t = e.target;
    if (t && t.tagName === 'IMG' && !t.src.startsWith('data:')) {
      const cat = t.dataset.category || '';
      const alt = t.alt || '';
      t.src = makePlaceholder(cat, alt);
    }
  }, true);
}
