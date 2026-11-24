/* ==========================================================================
   NATIONAL SPORTS INFRASTRUCTURE DIRECTORY — Map & Filter Controller
   ========================================================================== */

/* ===== FACILITY DATA ===== */
const facilities = [
  {
    id: 'jn-stadium',
    name: 'Jawaharlal Nehru Stadium',
    sport: 'Athletics',
    type: 'Stadium',
    state: 'Delhi',
    city: 'New Delhi',
    lat: 28.5824,
    lng: 77.2345,
    equipment: ['400m Track', 'Field Events Pit', 'Electronic Timing', 'Weight Room'],
    coaches: ['Amit Verma', 'Nisha Rao'],
    description: 'National athletics stadium with indoor and outdoor training zones, serving as the premier venue for national-level track & field events.',
    established: 1982,
  },
  {
    id: 'sai-nsis',
    name: 'SAI – Netaji Subhas NIS',
    sport: 'Multi-sport',
    type: 'Academy',
    state: 'Punjab',
    city: 'Patiala',
    lat: 30.3385,
    lng: 76.3869,
    equipment: ['Strength Lab', 'Recovery Pool', 'Video Analysis Suite', 'Biomechanics Lab'],
    coaches: ['Rohit Bhatia', 'Kavita Singh', 'Dr. Suresh Nair'],
    description: 'Premier national coaching academy for elite athlete development across 30+ disciplines.',
    established: 1961,
  },
  {
    id: 'kanteerava',
    name: 'Kanteerava Indoor Stadium',
    sport: 'Badminton',
    type: 'Stadium',
    state: 'Karnataka',
    city: 'Bengaluru',
    lat: 12.9729,
    lng: 77.5937,
    equipment: ['12 Indoor Courts', 'Recovery Room', 'Physio Unit', 'Spectator Stands'],
    coaches: ['Dinesh Kumar', 'Meera Joshi'],
    description: 'World-class indoor venue regularly hosting national and international badminton tournaments.',
    established: 1997,
  },
  {
    id: 'dhyan-chand',
    name: 'Major Dhyan Chand National Stadium',
    sport: 'Hockey',
    type: 'Stadium',
    state: 'Delhi',
    city: 'New Delhi',
    lat: 28.6101,
    lng: 77.2332,
    equipment: ['Synthetic Astroturf', 'Goalkeeper Nets', 'Locker Rooms', 'Floodlights'],
    coaches: ['Sandeep Malhotra', 'Anjali Nair'],
    description: 'Historic national hockey venue — India\'s most storied hockey ground for elite training and matches.',
    established: 1933,
  },
  {
    id: 'bhubaneswar-sports',
    name: 'Kalinga Stadium (Football Ground)',
    sport: 'Football',
    type: 'Playfield',
    state: 'Odisha',
    city: 'Bhubaneswar',
    lat: 20.2961,
    lng: 85.8245,
    equipment: ['Artificial Turf', 'Training Lights', 'Changing Rooms', 'Video Board'],
    coaches: ['Milan Das', 'Pallavi Sen'],
    description: 'High-performance football training ground supporting youth pipelines and national camp squads.',
    established: 2016,
  },
  {
    id: 'guwahati-swim',
    name: 'Sarusajai Aquatics Centre',
    sport: 'Swimming',
    type: 'Academy',
    state: 'Assam',
    city: 'Guwahati',
    lat: 26.1445,
    lng: 91.7362,
    equipment: ['50m Olympic Pool', 'Training Pool', 'Timing System', 'Diving Boards'],
    coaches: ['Priya Sharma', 'Bikash Kalita'],
    description: 'Northeast India\'s premier aquatics training centre with Olympic-specification facilities.',
    established: 2016,
  },
  {
    id: 'pune-wrestling',
    name: 'Balewadi Wrestling Academy',
    sport: 'Wrestling',
    type: 'Academy',
    state: 'Maharashtra',
    city: 'Pune',
    lat: 18.5793,
    lng: 73.7796,
    equipment: ['10 Wrestling Mats', 'Strength Gym', 'Recovery Suite', 'Video Room'],
    coaches: ['Rajan Patil', 'Sunita Bhosale'],
    description: 'Residential academy producing national-level wrestlers, affiliated with Wrestling Federation of India.',
    established: 2008,
  },
  {
    id: 'chennai-archery',
    name: 'SAI Archery Academy Chennai',
    sport: 'Archery',
    type: 'Academy',
    state: 'Tamil Nadu',
    city: 'Chennai',
    lat: 13.0827,
    lng: 80.2707,
    equipment: ['Outdoor 70m Range', 'Indoor 18m Range', 'Equipment Store', 'Strength Room'],
    coaches: ['V. Rajkumar', 'Meenakshi Rajan'],
    description: 'SAI-funded archery centre with full recurve and compound ranges catering to sub-junior to senior athletes.',
    established: 2005,
  },
  {
    id: 'kolkata-football',
    name: 'Vivekananda Yuba Bharati Krirangan',
    sport: 'Football',
    type: 'Stadium',
    state: 'West Bengal',
    city: 'Kolkata',
    lat: 22.5726,
    lng: 88.3639,
    equipment: ['FIFA-grade Turf', 'Running Track', 'Media Tribune', 'Floodlights'],
    coaches: ['Subhash Ghosh', 'Rina Das'],
    description: 'Salt Lake Stadium — one of the largest football stadiums in the world, hosting ISL and national matches.',
    established: 1984,
  },
  {
    id: 'lucknow-kabaddi',
    name: 'Dr. Shyama Prasad Mukherjee Stadium',
    sport: 'Kabaddi',
    type: 'Playfield',
    state: 'Uttar Pradesh',
    city: 'Lucknow',
    lat: 26.8467,
    lng: 80.9462,
    equipment: ['Kabaddi Mat', 'Training Pit', 'Spectator Seats', 'Medical Room'],
    coaches: ['Aman Singh', 'Pooja Yadav'],
    description: 'State-of-the-art facility for kabaddi training and regional competitions under UP Sports Directorate.',
    established: 2012,
  },
];

/* ===== TYPE → COLOUR MAP ===== */
const TYPE_COLORS = {
  Stadium: '#3b82f6',
  Academy: '#f97316',
  Playfield: '#22c55e',
};

const TYPE_EMOJI = {
  Stadium: '🏟️',
  Academy: '🎓',
  Playfield: '⛳',
};

/* ===== THEME HELPERS ===== */
function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function getTileUrl() {
  return isDark()
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
}

function getTileAttribution() {
  return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
}

/* ===== MAP INIT ===== */
let map = null;
let tileLayer = null;
let markerGroup = null;
let activeMarkers = {};
let lastActiveItem = null;

function initMap() {
  // Defensive guard: if the Leaflet CDN failed to load, don't crash the whole
  // page — degrade gracefully so filters and the facility list still work.
  if (typeof L === 'undefined') {
    const el = document.getElementById('infra-map');
    if (el) {
      el.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;' +
        'min-height:400px;padding:2rem;text-align:center;color:#475569;font-size:0.95rem;">' +
        'Interactive map could not be loaded. Browse verified facilities using the list on the left.' +
        '</div>';
    }
    return;
  }
  map = L.map('infra-map', {
    zoomControl: true,
    scrollWheelZoom: true,
    attributionControl: true,
  }).setView([22.5937, 78.9629], 5);

  tileLayer = L.tileLayer(getTileUrl(), {
    attribution: getTileAttribution(),
    maxZoom: 19,
  }).addTo(map);

  markerGroup = L.layerGroup().addTo(map);
}

function updateTileTheme() {
  if (!map || !tileLayer) return;
  tileLayer.setUrl(getTileUrl());
}

/* ===== CUSTOM ICON ===== */
function makeIcon(type) {
  const color = TYPE_COLORS[type] || '#3b82f6';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path fill="${color}" stroke="white" stroke-width="2"
        d="M14 2C7.373 2 2 7.373 2 14c0 9.188 12 22 12 22S26 23.188 26 14C26 7.373 20.627 2 14 2z"/>
      <circle cx="14" cy="14" r="5" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  });
}

/* ===== POPUP HTML ===== */
function buildPopupHtml(f) {
  const equipTags = f.equipment.map(e =>
    `<span class="popup-tag">${e}</span>`
  ).join('');

  const coachItems = f.coaches.map(c =>
    `<span class="popup-coach">${c}<span class="coach-verified" title="Verified">✓</span></span>`
  ).join(' &bull; ');

  return `
    <div class="popup-card">
      <div class="popup-header">
        <div>
          <div class="popup-name">${f.name}</div>
          <div class="popup-location">📍 ${f.city}, ${f.state}</div>
        </div>
        <span class="type-badge ${f.type}">${f.type}</span>
      </div>
      <p class="popup-desc">${f.description}</p>

      <div class="popup-detail-row">
        <span class="popup-detail-label">⚙️ Equipment & Facilities</span>
        <div class="popup-tags">${equipTags}</div>
      </div>

      <div class="popup-detail-row" style="margin-top:0.5rem;">
        <span class="popup-detail-label">👤 Verified Coaches</span>
        <div class="popup-coaches">${coachItems}</div>
      </div>

      <div class="popup-detail-row" style="margin-top:0.5rem; font-size:0.75rem; color:var(--text-muted);">
        🏅 Sport: <strong style="color:var(--text-primary)">${f.sport}</strong> &nbsp;|&nbsp; Est. ${f.established}
      </div>

      <a class="popup-book-btn"
         href="/pages/auth/login.html"
         title="Log in to book a session at ${f.name}">
        📅 Book Session
      </a>
    </div>
  `;
}

/* ===== RENDER ===== */
function renderFacilities() {
  const sportVal = document.getElementById('filter-sport').value;
  const typeVal  = document.getElementById('filter-type').value;
  const stateVal = document.getElementById('filter-state').value;

  const filtered = facilities.filter(f => {
    const matchSport = !sportVal || f.sport === sportVal || f.sport === 'Multi-sport';
    const matchType  = !typeVal  || f.type  === typeVal;
    const matchState = !stateVal || f.state === stateVal;
    return matchSport && matchType && matchState;
  });

  if (markerGroup) markerGroup.clearLayers();
  activeMarkers = {};
  lastActiveItem = null;

  const list = document.getElementById('facility-list');
  const count = document.getElementById('facility-count');
  list.innerHTML = '';
  count.innerHTML = `Showing <strong>${filtered.length}</strong> of ${facilities.length} facilities`;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="no-results">
        <div style="font-size:2rem;margin-bottom:0.4rem;">🔍</div>
        No facilities match the selected filters.
      </div>`;
    return;
  }

  filtered.forEach(f => {
    let marker = null;
    if (markerGroup) {
      marker = L.marker([f.lat, f.lng], { icon: makeIcon(f.type) });
      marker.bindPopup(buildPopupHtml(f), { maxWidth: 320, minWidth: 240 });
      marker.addTo(markerGroup);
      activeMarkers[f.id] = marker;

      marker.on('click', () => {
        map.panTo([f.lat, f.lng]);
        setActiveItem(f.id);
      });

      marker.on('popupopen', () => setActiveItem(f.id));
    }

    const item = document.createElement('div');
    item.className = 'facility-item';
    item.dataset.id = f.id;
    item.innerHTML = `
      <div class="facility-item-name">
        <span class="type-badge ${f.type}">${TYPE_EMOJI[f.type]} ${f.type}</span>
        ${f.name}
      </div>
      <div class="facility-item-meta">${f.city}, ${f.state} &bull; ${f.sport}</div>
    `;

    item.addEventListener('click', () => {
      if (map && marker) {
        map.flyTo([f.lat, f.lng], 13, { duration: 0.8 });
        marker.openPopup();
      }
      setActiveItem(f.id);
    });

    list.appendChild(item);
  });

  if (!map) return;
  if (filtered.length === 1) {
    map.flyTo([filtered[0].lat, filtered[0].lng], 13, { duration: 0.6 });
  } else {
    const bounds = L.latLngBounds(filtered.map(f => [f.lat, f.lng]));
    map.fitBounds(bounds.pad(0.18));
  }
}

function setActiveItem(id) {
  if (lastActiveItem) lastActiveItem.classList.remove('active');
  const el = document.querySelector(`.facility-item[data-id="${id}"]`);
  if (el) {
    el.classList.add('active');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    lastActiveItem = el;
  }
}

/* ===== POPULATE FILTERS ===== */
function populateFilters() {
  const sports = [...new Set(facilities.map(f => f.sport))].sort();
  const states = [...new Set(facilities.map(f => f.state))].sort();

  const sportSel = document.getElementById('filter-sport');
  const stateSel = document.getElementById('filter-state');

  sports.forEach(s => {
    const o = document.createElement('option');
    o.value = s; o.textContent = s;
    sportSel.appendChild(o);
  });

  states.forEach(s => {
    const o = document.createElement('option');
    o.value = s; o.textContent = s;
    stateSel.appendChild(o);
  });
}

/* ===== NAVBAR / THEME (shared pattern from landing.js) ===== */
function setupNavbar() {
  const navbar = document.getElementById('main-navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !expanded);
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });
  }
}

function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const icon = btn.querySelector('.theme-icon');
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    updateTileTheme();
  };

  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });
}

/* ===== BOOT ===== */
document.addEventListener('DOMContentLoaded', () => {
  setupNavbar();
  setupThemeToggle();
  initMap();
  populateFilters();
  renderFacilities();

  ['filter-sport', 'filter-type', 'filter-state'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderFacilities);
  });

  document.getElementById('filter-reset').addEventListener('click', () => {
    ['filter-sport', 'filter-type', 'filter-state'].forEach(id => {
      document.getElementById(id).value = '';
    });
    renderFacilities();
  });
});
