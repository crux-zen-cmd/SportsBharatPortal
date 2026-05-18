/* ==========================================================================
   ATHLETE USER DASHBOARD CONTROLLER
   ========================================================================== */

import { SportsPortal } from './firebase-config.js';
import { showToast } from './auth.js';

let currentUser = null;
let currentMonth = new Date();
let allComps = [];
let userRegs = [];

document.addEventListener('DOMContentLoaded', () => {
  // Check auth state
  SportsPortal.auth.onAuthStateChanged(async (user) => {
    if (!user || user.role !== 'user') {
      window.location.href = '../auth/login.html';
      return;
    }
    currentUser = user;
    
    // Hide Loader
    const loader = document.getElementById('page-loader');
    if (loader) loader.classList.add('fade-out');

    // Run setups
    setupSidebarNavigation();
    setupProfileForm();
    await loadInitialData();
    setupNotificationSystem();
    setupRegistrationModal();
    setupCalendarView();
    setupLiveScoreSimulation();
  });
  // Setup theme toggle
  setupThemeToggle();

  // Bind responsive toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // Bind logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await SportsPortal.auth.signOut();
      window.location.href = '../../index.html';
    });
  }
});

/* ==========================================================================
   SIDEBAR NAVIGATION SYSTEM
   ========================================================================== */
function setupSidebarNavigation() {
  const links = document.querySelectorAll('.sidebar-link');
  const panels = document.querySelectorAll('.dash-panel');

  links.forEach(link => {
    link.addEventListener('click', () => {
      links.forEach(l => l.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      link.classList.add('active');
      const targetId = link.getAttribute('data-target');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      // Close mobile drawer if active
      document.getElementById('sidebar').classList.remove('active');
    });
  });
}

/* ==========================================================================
   LOAD DATA & RENDER VIEWS
   ========================================================================== */
async function loadInitialData() {
  if (!currentUser) return;

  // Set Topbar avatar and welcome names
  const welcomeText = document.getElementById('welcome-name');
  const topbarName = document.getElementById('user-display-name');
  const avatarCircle = document.getElementById('avatar-circle');

  if (welcomeText) welcomeText.textContent = currentUser.fullName;
  if (topbarName) topbarName.textContent = currentUser.fullName;
  if (avatarCircle) avatarCircle.textContent = currentUser.fullName[0].toUpperCase();

  try {
    // 1. Load lists
    allComps = await SportsPortal.db.getCollection('competitions');
    
    // Fetch all registrations matching current user
    const registrations = await SportsPortal.db.getCollection('registrations');
    userRegs = registrations.filter(r => r.userId === currentUser.uid);

    // Bind metrics count to overview
    document.getElementById('stats-reg-count').textContent = userRegs.length;
    document.getElementById('stats-badge-count').textContent = currentUser.badges ? currentUser.badges.length : 1;
    
    // Count certificates
    const certificates = userRegs.filter(r => r.status === 'approved' && r.attended);
    document.getElementById('stats-cert-count').textContent = certificates.length;

    // 2. Render Favorite Sports interests selection options
    renderSportsInterestSelector();

    // 3. Render recommendations based on state or state-wide interest matches
    renderRecommendations();

    // 4. Render Badge list items
    renderBadgeShowcase();

    // 5. Render activity log timeline matches
    renderActivityLog();

    // 6. Bind profile settings form edit details
    fillProfileFormDetails();

    // 7. Render full dashboard explore competitions
    renderDashboardCompetitions();

    // 8. Render certificates table listing
    renderCertificatesCenter(certificates);

  } catch (err) {
    console.error("Error setting up athlete workspace layout", err);
  }
}

/* ==========================================================================
   RECOMMENDATIONS ENGINE
   ========================================================================== */
function renderRecommendations() {
  const container = document.getElementById('rec-comps-grid');
  if (!container) return;

  const interests = currentUser.sportsInterests || [];
  const state = currentUser.state || "";

  // Recommend matches: match chosen sports interest or match state
  const recommended = allComps.filter(c => {
    const matchesInterest = interests.includes(c.sportType);
    const matchesState = c.state.toLowerCase() === state.toLowerCase();
    return (matchesInterest || matchesState) && c.status !== 'completed';
  }).slice(0, 3);

  if (recommended.length === 0) {
    // Fallback to active upcoming competitions
    const upcoming = allComps.filter(c => c.status !== 'completed').slice(0, 3);
    if (upcoming.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No active competitions scheduled at this time.</p>`;
    } else {
      renderCompCards(upcoming, container);
    }
  } else {
    renderCompCards(recommended, container);
  }
}

function renderCompCards(comps, container) {
  container.innerHTML = comps.map(c => {
    const isBookmarked = currentUser.bookmarkIds && currentUser.bookmarkIds.includes(c.id);
    const starIcon = isBookmarked ? '★' : '☆';

    return `
      <div class="glass-card competition-card" style="padding: 1rem;">
        <div class="comp-header" style="height: 120px;">
          <img src="${c.bannerUrl}" class="comp-banner" alt="${c.title}" />
          <button onclick="window.toggleBookmark('${c.id}')" style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.5); width: 35px; height: 35px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; color: gold; font-size: 1.25rem; z-index: 5;">${starIcon}</button>
        </div>
        <div style="padding: 1rem 0 0; display: flex; flex-direction: column; gap: 0.5rem;">
          <small style="color: var(--primary-light); font-weight: 700;">${c.sportType} · ${c.city}</small>
          <h4 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; line-height: 1.2;">${c.title}</h4>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
            <strong style="color: var(--accent);">${c.regFee === '0' ? 'FREE' : '₹' + c.regFee}</strong>
            <button class="btn btn-primary" onclick="window.openRegModal('${c.id}')" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Register</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Global scope binds for template event hooks
window.toggleBookmark = async (compId) => {
  if (!currentUser) return;
  const bookmarks = currentUser.bookmarkIds || [];
  let updated = [];
  if (bookmarks.includes(compId)) {
    updated = bookmarks.filter(id => id !== compId);
    showToast("Competition removed from favorites list.", "warning");
  } else {
    updated = [...bookmarks, compId];
    showToast("Competition bookmarked successfully!", "success");
  }
  
  currentUser.bookmarkIds = updated;
  await SportsPortal.db.updateDoc('users', currentUser.uid, { bookmarkIds: updated });
  localStorage.setItem('sports_portal_current_user', JSON.stringify(currentUser));
  loadInitialData();
};

/* ==========================================================================
   FAVORITE SPORTS MULTI SELECTOR
   ========================================================================== */
async function renderSportsInterestSelector() {
  const container = document.getElementById('interest-selector');
  if (!container) return;

  const sports = await SportsPortal.db.getCollection('sports');
  const userInterests = currentUser.sportsInterests || [];

  container.innerHTML = sports.map(sport => {
    const isActive = userInterests.includes(sport.title);
    return `
      <button class="interest-pill-btn ${isActive ? 'active' : ''}" onclick="window.toggleSportInterest('${sport.title}')">
        ${sport.icon} ${sport.title}
      </button>
    `;
  }).join('');
}

window.toggleSportInterest = async (sportTitle) => {
  const interests = currentUser.sportsInterests || [];
  let updated = [];
  if (interests.includes(sportTitle)) {
    updated = interests.filter(i => i !== sportTitle);
  } else {
    updated = [...interests, sportTitle];
  }

  currentUser.sportsInterests = updated;
  await SportsPortal.db.updateDoc('users', currentUser.uid, { sportsInterests: updated });
  localStorage.setItem('sports_portal_current_user', JSON.stringify(currentUser));
  
  renderSportsInterestSelector();
  renderRecommendations();
};

/* ==========================================================================
   BADGE SHOWCASE & ACTIVITY TIMELINE
   ========================================================================== */
function renderBadgeShowcase() {
  const container = document.getElementById('badge-showcase');
  if (!container) return;

  const badges = currentUser.badges || ["🏆 Portal Rookie"];
  container.innerHTML = badges.map(badge => `
    <div class="badge-achievement-card">
      <div class="badge-ach-icon">${badge.split(' ')[0]}</div>
      <div class="badge-ach-title">${badge.substr(badge.indexOf(' ') + 1)}</div>
    </div>
  `).join('');
}

function renderActivityLog() {
  const container = document.getElementById('activity-log');
  if (!container) return;

  const activity = [
    `Joined SportsBharat database as certified athlete.`,
    ...userRegs.map(r => `Registered for ${r.competitionTitle} as ${r.regType}.`)
  ].reverse().slice(0, 4);

  container.innerHTML = activity.map(act => `
    <li style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-secondary);">
      ✓ ${act}
    </li>
  `).join('');
}

/* ==========================================================================
   PROFILE MANAGER FORM
   ========================================================================== */
function fillProfileFormDetails() {
  const nameInput = document.getElementById('edit-name');
  const ageInput = document.getElementById('edit-age');
  const genderInput = document.getElementById('edit-gender');
  const cityInput = document.getElementById('edit-city');
  const stateInput = document.getElementById('edit-state');
  const contactInput = document.getElementById('edit-contact');
  const skillsInput = document.getElementById('edit-skills');
  const bioInput = document.getElementById('edit-bio');
  
  if (nameInput) nameInput.value = currentUser.fullName || "";
  if (ageInput) ageInput.value = currentUser.age || 20;
  if (genderInput) genderInput.value = currentUser.gender || "Male";
  if (cityInput) cityInput.value = currentUser.city || "";
  if (stateInput) stateInput.value = currentUser.state || "";
  if (contactInput) contactInput.value = currentUser.contactInfo || "";
  if (skillsInput) skillsInput.value = currentUser.skills || "";
  if (bioInput) bioInput.value = currentUser.bio || "";

  // Set avatar preview
  const editPreview = document.getElementById('edit-avatar-preview');
  if (editPreview) {
    if (currentUser.profilePhoto) {
      editPreview.style.background = `url(${currentUser.profilePhoto}) center/cover`;
      editPreview.textContent = "";
    } else {
      editPreview.style.background = "";
      editPreview.textContent = currentUser.fullName[0].toUpperCase();
    }
  }
}

function setupProfileForm() {
  const form = document.getElementById('profile-edit-form');
  const photoInput = document.getElementById('profile-photo-input');

  if (photoInput) {
    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const downloadUrl = await SportsPortal.storage.uploadBytes(`avatars/${currentUser.uid}`, file);
          currentUser.profilePhoto = downloadUrl;
          fillProfileFormDetails();
          showToast("Profile image uploaded successfully!", "success");
        } catch (err) {
          showToast("Photo upload failed. Check file dimensions.", "danger");
        }
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const updateData = {
        fullName: document.getElementById('edit-name').value,
        age: parseInt(document.getElementById('edit-age').value),
        gender: document.getElementById('edit-gender').value,
        city: document.getElementById('edit-city').value,
        state: document.getElementById('edit-state').value,
        contactInfo: document.getElementById('edit-contact').value,
        skills: document.getElementById('edit-skills').value,
        bio: document.getElementById('edit-bio').value,
        profilePhoto: currentUser.profilePhoto || ""
      };

      try {
        await SportsPortal.db.updateDoc('users', currentUser.uid, updateData);
        currentUser = { ...currentUser, ...updateData };
        localStorage.setItem('sports_portal_current_user', JSON.stringify(currentUser));
        
        await loadInitialData();
        showToast("Profile credentials synchronized successfully.", "success");
      } catch (err) {
        showToast(err.message, "danger");
      }
    });
  }
}

/* ==========================================================================
   EXPLORE COMPETITIONS RENDERER
   ========================================================================== */
async function renderDashboardCompetitions() {
  const grid = document.getElementById('dash-competitions-grid');
  if (!grid) return;

  const filterSport = document.getElementById('dash-filter-sport');
  const filterState = document.getElementById('dash-filter-state');
  const searchInput = document.getElementById('dash-comp-search');

  // Seed sports option dropdown filter
  const sports = await SportsPortal.db.getCollection('sports');
  filterSport.innerHTML = `<option value="">All Sports</option>` + sports.map(s => `<option>${s.title}</option>`).join('');

  // Extract states list
  const states = [...new Set(allComps.map(c => c.state))];
  filterState.innerHTML = `<option value="">All States</option>` + states.map(s => `<option>${s}</option>`).join('');

  const render = () => {
    const sportVal = filterSport.value;
    const stateVal = filterState.value;
    const query = searchInput.value.toLowerCase();

    const filtered = allComps.filter(c => {
      const matchesSport = !sportVal || c.sportType === sportVal;
      const matchesState = !stateVal || c.state === stateVal;
      const matchesQuery = c.title.toLowerCase().includes(query) || c.venue.toLowerCase().includes(query);
      return matchesSport && matchesState && matchesQuery;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">No matching competitions found.</p>`;
      return;
    }

    grid.innerHTML = filtered.map(c => {
      const isRegistered = userRegs.some(r => r.competitionId === c.id);
      const regBtnText = isRegistered ? '✓ Registered' : 'Register Now';
      const regBtnClass = isRegistered ? 'btn-ghost' : 'btn-primary';
      const statusBadge = c.status === 'upcoming' 
        ? '<span class="badge badge-success">Upcoming</span>' 
        : c.status === 'ongoing' 
        ? '<span class="badge badge-warning">Ongoing</span>' 
        : '<span class="badge badge-danger">Completed</span>';

      return `
        <div class="glass-card competition-card">
          <div class="comp-header">
            <img src="${c.bannerUrl}" class="comp-banner" alt="${c.title}" />
            <div class="comp-badge">${statusBadge}</div>
          </div>
          <div class="comp-body">
            <div class="comp-meta">
              <span>📅 ${c.dateTime.split('T')[0]}</span>
              <span>📍 ${c.city}, ${c.state}</span>
            </div>
            <h3 class="comp-title">${c.title}</h3>
            <p class="comp-info" style="font-size:0.85rem; margin-bottom:1rem;">${c.description}</p>
            <div class="comp-footer">
              <strong style="color:var(--accent); font-family:var(--font-display); font-size:1.25rem;">${c.regFee === '0' ? 'FREE' : '₹' + c.regFee}</strong>
              <button class="btn ${regBtnClass}" onclick="window.openRegModal('${c.id}')" ${isRegistered ? 'disabled' : ''}>${regBtnText}</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  [filterSport, filterState, searchInput].forEach(el => el.addEventListener('input', render));
  render();
}

/* ==========================================================================
   REGISTRATION MODAL
   ========================================================================== */
function setupRegistrationModal() {
  const modal = document.getElementById('reg-modal');
  const closeBtn = document.getElementById('reg-modal-close');
  const cancelBtn = document.getElementById('reg-modal-cancel');
  const form = document.getElementById('modal-reg-form');

  window.openRegModal = (compId) => {
    const comp = allComps.find(c => c.id === compId);
    if (!comp) return;

    document.getElementById('modal-comp-title').textContent = comp.title;
    document.getElementById('modal-comp-location').textContent = `${comp.venue} | ${comp.city}, ${comp.state}`;
    document.getElementById('modal-comp-id').value = comp.id;

    modal.classList.add('active');
  };

  const closeModal = () => modal.classList.remove('active');

  [closeBtn, cancelBtn].forEach(el => el.addEventListener('click', closeModal));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const compId = document.getElementById('modal-comp-id').value;
    const regType = document.getElementById('modal-reg-type').value;
    const idProof = document.getElementById('modal-id-proof').value;
    
    const comp = allComps.find(c => c.id === compId);

    const regData = {
      competitionId: compId,
      competitionTitle: comp.title,
      sportType: comp.sportType,
      dateTime: comp.dateTime,
      userId: currentUser.uid,
      userName: currentUser.fullName,
      regType,
      idProof,
      status: 'pending', // Awaiting organizer approval
      attended: false,
      timestamp: new Date().toISOString()
    };

    try {
      await SportsPortal.db.addDoc('registrations', regData);
      
      // Auto notification dispatch to user
      await SportsPortal.db.addDoc('notifications', {
        userId: currentUser.uid,
        title: "Registration Submitted",
        message: `Your registration for ${comp.title} is pending approval from the organizer.`,
        type: "registration",
        read: false,
        timestamp: new Date().toISOString()
      });

      closeModal();
      showToast("Application submitted successfully. Under verification.", "success");
      
      await loadInitialData();
    } catch (err) {
      showToast(err.message, "danger");
    }
  });
}

/* ==========================================================================
   EVENT CALENDAR PANEL
   ========================================================================== */
function setupCalendarView() {
  const prevBtn = document.getElementById('prev-month-btn');
  const nextBtn = document.getElementById('next-month-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentMonth.setMonth(currentMonth.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      renderCalendar();
    });
  }

  renderCalendar();
}

function renderCalendar() {
  const monthLabel = document.getElementById('calendar-month-label');
  const daysContainer = document.getElementById('calendar-days-container');
  if (!daysContainer) return;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  monthLabel.textContent = `${monthNames[month]} ${year}`;

  daysContainer.innerHTML = "";

  // Weekdays Labels
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  weekDays.forEach(day => {
    daysContainer.innerHTML += `<div class="calendar-day-label">${day}</div>`;
  });

  // Calculate calendar offsets
  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();

  // Empty slots
  for (let i = 0; i < firstDayIndex; i++) {
    daysContainer.innerHTML += `<div></div>`;
  }

  // Days numbers
  for (let d = 1; d <= lastDay; d++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    // Check if user has competition registered on this day
    const matchingReg = userRegs.find(r => r.dateTime.split('T')[0] === dayStr);
    const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
    
    let dayClass = 'calendar-day';
    if (matchingReg) dayClass += ' has-event';
    if (isToday) dayClass += ' today';

    daysContainer.innerHTML += `
      <div class="${dayClass}" onclick="window.selectCalendarDay('${dayStr}')">${d}</div>
    `;
  }
}

window.selectCalendarDay = (dayStr) => {
  const details = document.getElementById('calendar-event-details');
  if (!details) return;

  const matchingRegs = userRegs.filter(r => r.dateTime.split('T')[0] === dayStr);

  if (matchingRegs.length === 0) {
    details.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.9rem;">No sports competitions scheduled for ${dayStr}.</p>`;
  } else {
    details.innerHTML = matchingRegs.map(r => `
      <div class="glass-card" style="padding: 1rem; border-left: 3px solid var(--accent); margin-bottom: 0.75rem;">
        <h4 style="font-weight:700;">${r.competitionTitle}</h4>
        <small style="color:var(--text-secondary); display:block; margin: 0.25rem 0;">Type: ${r.regType} | Status: <strong>${r.status.toUpperCase()}</strong></small>
        <span style="font-size: 0.8rem; background:rgba(255,255,255,0.05); padding: 0.15rem 0.5rem; border-radius: 4px;">📅 ${r.dateTime.replace('T', ' ')}</span>
      </div>
    `).join('');
  }
};

/* ==========================================================================
   CERTIFICATES validated by QR
   ========================================================================== */
function renderCertificatesCenter(certs) {
  const tbody = document.getElementById('certificates-table-body');
  if (!tbody) return;

  if (certs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No participation certificates available. Complete an approved tournament attendance to unlock!</td></tr>`;
    return;
  }

  tbody.innerHTML = certs.map(c => `
    <tr>
      <td style="font-weight: 600;">${c.competitionTitle}</td>
      <td><span class="badge badge-success">${c.sportType}</span></td>
      <td>${new Date(c.timestamp).toLocaleDateString()}</td>
      <td style="font-size: 1.25rem; color:var(--success);">📷 Validated</td>
      <td><button class="btn btn-outline" onclick="window.downloadMockCertificate('${c.competitionTitle}')" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">Download PDF</button></td>
    </tr>
  `).join('');
}

window.downloadMockCertificate = (title) => {
  showToast(`Initiating validated cryptographic certificate download for "${title}"`, "success");
  
  // HTML-based premium certificate simulation trigger
  const newWin = window.open('', '_blank');
  newWin.document.write(`
    <html>
    <head>
      <title>SportsBharat Certificate</title>
      <style>
        body { font-family: 'Georgia', serif; background: #0b111e; color: #fff; text-align: center; padding: 50px; }
        .cert-border { border: 15px solid #1e3a8a; padding: 40px; border-radius: 8px; background: rgba(255,255,255,0.03); max-width: 800px; margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
        h1 { font-family: 'Rajdhani', sans-serif; font-size: 3rem; color: #f97316; margin-bottom: 5px; }
        h2 { font-size: 1.5rem; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; }
        .name { font-size: 2.5rem; font-weight: bold; color: #3b82f6; margin: 30px 0; border-bottom: 2px solid rgba(255,255,255,0.1); display: inline-block; padding: 0 50px 10px; }
        .footer-cols { display: flex; justify-content: space-between; margin-top: 50px; font-size: 0.9rem; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="cert-border">
        <h2>Ministry of Youth Affairs & Sports</h2>
        <h1>SportsBharat Validation Certificate</h1>
        <p style="margin-top:20px; font-style:italic;">This proudly acknowledges that</p>
        <div class="name">${currentUser.fullName}</div>
        <p style="max-width: 600px; margin: 0 auto; line-height: 1.6;">Successfully participated as a validated elite sport contender in the prestigious <strong>"${title}"</strong> national championship program.</p>
        <div class="footer-cols">
          <div>
            <p><strong>Dr. Sunita Sharma</strong></p>
            <p>National Committee Chair</p>
          </div>
          <div>
            <p style="font-size:2rem;">📷</p>
            <p>Cryptographic Gov Seal</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
};

/* ==========================================================================
   LIVE MATCH SIMULATOR
   ========================================================================== */
function setupLiveScoreSimulation() {
  const text = document.getElementById('live-score-text');
  if (!text) return;

  // Real-time listener mock
  SportsPortal.db.onSnapshot('liveScores/live_kabaddi', (match) => {
    if (match) {
      text.innerHTML = `<strong>${match.matchName}</strong>: <span style="color:var(--accent); font-weight:700;">${match.score}</span> (${match.status})`;
    }
  });

  // Simulated score changing ticks
  setInterval(() => {
    const scores = [
      "29 - 24", "29 - 26", "31 - 26", "31 - 29", "35 - 31"
    ];
    const nextScore = scores[Math.floor(Math.random() * scores.length)];
    SportsPortal.db.updateDoc('liveScores', 'live_kabaddi', { score: nextScore });
  }, 10000);
}

/* ==========================================================================
   NOTIFICATION SYSTEM (BELL DRAWER)
   ========================================================================== */
function setupNotificationSystem() {
  const toggle = document.getElementById('notif-toggle');
  const drawer = document.getElementById('notif-drawer');
  const close = document.getElementById('notif-close-btn');

  if (toggle && drawer && close) {
    toggle.addEventListener('click', () => drawer.classList.add('active'));
    close.addEventListener('click', () => drawer.classList.remove('active'));
  }

  // Firestore real-time listener for user alerts
  SportsPortal.db.onSnapshot('notifications', (notifications) => {
    const userNotifs = Object.values(notifications || {}).filter(n => n.userId === currentUser.uid);
    const unread = userNotifs.filter(n => !n.read);
    
    // Set counts
    const badge = document.getElementById('notif-badge-count');
    if (badge) badge.textContent = unread.length;

    // Set inside list
    const body = document.getElementById('notif-drawer-body');
    if (body) {
      if (userNotifs.length === 0) {
        body.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">No notifications found.</p>`;
        return;
      }

      body.innerHTML = userNotifs.map(n => `
        <div class="notif-card ${!n.read ? 'unread' : ''}" onclick="window.markNotifRead('${n.id}')">
          <div class="notif-card-title">${n.title}</div>
          <div class="notif-card-msg">${n.message}</div>
          <small style="color:var(--text-muted); font-size:0.7rem; margin-top:0.25rem; display:block;">${new Date(n.timestamp).toLocaleTimeString()}</small>
        </div>
      `).join('');
    }
  });
}

window.markNotifRead = async (notifId) => {
  await SportsPortal.db.updateDoc('notifications', notifId, { read: true });
};

function setupThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  const iconSpan = toggleBtn.querySelector('.theme-icon');
  if (iconSpan) {
    iconSpan.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }

  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    if (iconSpan) {
      iconSpan.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
  });
}
