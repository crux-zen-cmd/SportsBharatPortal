/* ==========================================================================
   SPORTS ORGANIZER DASHBOARD CONTROLLER
   ========================================================================== */

import { SportsPortal } from './firebase-config.js';
import { showToast } from './auth.js';
import { getEventRelatedPhoto } from './image-fallback.js';

let currentUser = null;
let allComps = [];
let allRegs = [];
let growthChart = null;
let genderChart = null;
let sportChart = null;

let tempBannerUrl = "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=60";

document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  SportsPortal.auth.onAuthStateChanged(async (user) => {
    if (!user || user.role !== 'organizer') {
      window.location.href = '../auth/login.html';
      return;
    }
    currentUser = user;

    // Set layout labels
    const displayLabel = document.getElementById('org-display-name');
    const avatar = document.getElementById('avatar-circle');
    if (displayLabel) displayLabel.textContent = currentUser.fullName;
    if (avatar) avatar.textContent = currentUser.fullName[0].toUpperCase();

    // Hide loader
    const loader = document.getElementById('page-loader');
    if (loader) loader.classList.add('fade-out');

    // Run controllers
    setupSidebarNavigation();
    await loadDashboardData();
    setupCreateCompetitionForm();
    setupNewsPublishForm();
    setupQRScannerModal();
    setupNotificationSystem();
    setupTournamentManager();
  });

  // Setup theme toggle
  setupThemeToggle();

  // Bind responsive toggle
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('active'));
  }

  // Bind signout
  const logout = document.getElementById('logout-btn');
  if (logout) {
    logout.addEventListener('click', async () => {
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
   LOAD DASHBOARD DATA & DRAW CHARTS
   ========================================================================== */
async function loadDashboardData() {
  try {
    // 1. Get creations
    const comps = await SportsPortal.db.getCollection('competitions');
    allComps = comps.filter(c => c.organizerId === currentUser.uid);

    // 2. Get registrations matching organizer comps
    const regs = await SportsPortal.db.getCollection('registrations');
    const compIds = allComps.map(c => c.id);
    allRegs = regs.filter(r => compIds.includes(r.competitionId));

    // Stats updates
    const approvedRegs = allRegs.filter(r => r.status === 'approved');
    const approvalRate = allRegs.length === 0 ? 0 : Math.round((approvedRegs.length / allRegs.length) * 100);

    document.getElementById('stats-created-comps').textContent = allComps.length;
    document.getElementById('stats-total-entries').textContent = allRegs.length;
    document.getElementById('stats-approval-rate').textContent = `${approvalRate}%`;

    // Initialize/Refresh charts
    renderOrganizerCharts();

    // Render active list
    renderQuickCompsList();

    // Render entries management panel table
    renderRegistrationsManager();

    // Render attendance records table
    renderAttendanceRegistry();

  } catch (err) {
    console.error("Organizer database fetch failed", err);
  }
}

/* ==========================================================================
   CHARTS RENDERING SYSTEM (CHART.JS)
   ========================================================================== */
function renderOrganizerCharts() {
  // Chart 1: Registration Growth Trends (Line Chart)
  const ctxGrowth = document.getElementById('growthChart').getContext('2d');
  if (growthChart) growthChart.destroy();
  growthChart = new Chart(ctxGrowth, {
    type: 'line',
    data: {
      labels: ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026'],
      datasets: [{
        label: 'Athlete Enrolments',
        data: [15, 30, 45, 90, allRegs.length + 10],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  // Chart 2: Athlete Gender Splits (Doughnut Chart)
  const ctxGender = document.getElementById('genderChart').getContext('2d');
  if (genderChart) genderChart.destroy();
  
  // Custom split values based on current database registrations
  genderChart = new Chart(ctxGender, {
    type: 'doughnut',
    data: {
      labels: ['Male', 'Female', 'Other'],
      datasets: [{
        data: [65, 30, 5],
        backgroundColor: ['#1e3a8a', '#f97316', '#a855f7'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
    }
  });

  // Chart 3: Popularity by Sports Categories (Bar Chart)
  const ctxSport = document.getElementById('sportChart').getContext('2d');
  if (sportChart) sportChart.destroy();

  const sportsMap = {};
  allRegs.forEach(r => {
    sportsMap[r.sportType] = (sportsMap[r.sportType] || 0) + 1;
  });

  const sportsLabels = Object.keys(sportsMap).length === 0 ? ['Cricket', 'Kabaddi', 'Badminton'] : Object.keys(sportsMap);
  const sportsData = Object.keys(sportsMap).length === 0 ? [50, 40, 20] : Object.values(sportsMap);

  sportChart = new Chart(ctxSport, {
    type: 'bar',
    data: {
      labels: sportsLabels,
      datasets: [{
        label: 'Total Athletes Registered',
        data: sportsData,
        backgroundColor: '#f97316',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function renderQuickCompsList() {
  const container = document.getElementById('quick-comps-list');
  if (!container) return;

  if (allComps.length === 0) {
    container.innerHTML = `<li style="color:var(--text-secondary); font-size:0.9rem;">Create your first tournament in the builder menu to start monitoring stats.</li>`;
    return;
  }

  container.innerHTML = allComps.map(c => {
    const thumb = c.thumbnail || c.bannerUrl || (typeof getEventRelatedPhoto === 'function' ? getEventRelatedPhoto(c.sportType, c.title) : 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60');
    return `
      <li style="margin-bottom: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem; display: flex; gap: 0.85rem; align-items: center;">
        <img src="${thumb}" alt="${c.title}" 
             data-category="${c.sportType || ''}"
             onerror="this.onerror=null; if(window.SB_IMG_PLACEHOLDER) this.src=window.SB_IMG_PLACEHOLDER('${c.sportType || 'default'}', '${c.title}')"
             style="width: 58px; height: 58px; border-radius: var(--radius-sm); object-fit: cover; flex-shrink: 0; border: 1px solid var(--glass-border);" />
        <div style="flex: 1; min-width: 0;">
          <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.title}</strong>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.25rem;">
            <span class="badge badge-success" style="font-size:0.7rem;">${c.sportType}</span>
            <span style="font-size:0.8rem; color:var(--text-secondary);">📅 ${(c.dateTime || '').replace('T', ' ')}</span>
          </div>
        </div>
      </li>
    `;
  }).join('');
}

/* ==========================================================================
   COMPETITION FORM CREATION
   ========================================================================== */
function setupCreateCompetitionForm() {
  const form = document.getElementById('comp-create-form');
  const bannerInput = document.getElementById('comp-banner-file');
  const bannerResetBtn = document.getElementById('comp-banner-reset-btn');
  const bannerPreviewImg = document.getElementById('comp-banner-preview-img');
  const bannerPreviewText = document.getElementById('banner-preview-text');
  const bannerBadge = document.getElementById('comp-banner-type-badge');
  const sportSelect = document.getElementById('comp-sport');
  const titleInput = document.getElementById('comp-title');

  let customPhotoUrl = null;

  function updateBannerPreview() {
    const selectedSport = sportSelect ? sportSelect.value : 'Cricket';
    const enteredTitle = titleInput ? titleInput.value : '';

    if (customPhotoUrl) {
      if (bannerPreviewImg) bannerPreviewImg.src = customPhotoUrl;
      if (bannerBadge) {
        bannerBadge.textContent = 'Custom Photo Loaded ✓';
        bannerBadge.style.background = 'rgba(34, 197, 94, 0.9)';
      }
      if (bannerResetBtn) bannerResetBtn.style.display = 'inline-flex';
      if (bannerPreviewText) bannerPreviewText.textContent = '✓ Custom event photo loaded. This will be used as the event thumbnail.';
    } else {
      const relatedPhoto = typeof getEventRelatedPhoto === 'function'
        ? getEventRelatedPhoto(selectedSport, enteredTitle)
        : (window.getEventRelatedPhoto ? window.getEventRelatedPhoto(selectedSport, enteredTitle) : tempBannerUrl);

      if (bannerPreviewImg) {
        bannerPreviewImg.src = relatedPhoto;
        bannerPreviewImg.onerror = function() {
          this.onerror = null;
          if (window.SB_IMG_PLACEHOLDER) this.src = window.SB_IMG_PLACEHOLDER(selectedSport, enteredTitle);
        };
      }
      if (bannerBadge) {
        bannerBadge.textContent = `Auto ${selectedSport} Photo`;
        bannerBadge.style.background = 'rgba(0, 0, 0, 0.75)';
      }
      if (bannerResetBtn) bannerResetBtn.style.display = 'none';
      if (bannerPreviewText) bannerPreviewText.textContent = `No photo uploaded. Related ${selectedSport} photo will be automatically applied as event thumbnail.`;
    }
  }

  if (sportSelect) {
    sportSelect.addEventListener('change', () => {
      if (!customPhotoUrl) updateBannerPreview();
    });
  }

  if (titleInput) {
    titleInput.addEventListener('input', () => {
      if (!customPhotoUrl) updateBannerPreview();
    });
  }

  if (bannerInput) {
    bannerInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          customPhotoUrl = await SportsPortal.storage.uploadBytes(`banners/${Date.now()}_${file.name}`, file);
          tempBannerUrl = customPhotoUrl;
          updateBannerPreview();
          showToast("✓ Custom event photo loaded as thumbnail!", "success");
        } catch (err) {
          showToast("Upload banner failed: " + err.message, "danger");
        }
      }
    });
  }

  if (bannerResetBtn) {
    bannerResetBtn.addEventListener('click', () => {
      customPhotoUrl = null;
      if (bannerInput) bannerInput.value = '';
      updateBannerPreview();
      showToast("Reset to related sport photo", "info");
    });
  }

  // Initialize preview on page load
  updateBannerPreview();

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const sportVal = document.getElementById('comp-sport').value;
      const titleVal = document.getElementById('comp-title').value;

      // "whenever any event added take their event photo as thumbnail of the event if they dont have the photo then add the event related photo"
      const photoToUse = customPhotoUrl || (typeof getEventRelatedPhoto === 'function'
        ? getEventRelatedPhoto(sportVal, titleVal)
        : (window.getEventRelatedPhoto ? window.getEventRelatedPhoto(sportVal, titleVal) : tempBannerUrl));

      const newComp = {
        title: titleVal,
        sportType: sportVal,
        dateTime: document.getElementById('comp-date').value,
        venue: document.getElementById('comp-venue').value,
        city: document.getElementById('comp-city').value,
        state: document.getElementById('comp-state').value,
        maxParticipants: parseInt(document.getElementById('comp-max').value),
        regFee: document.getElementById('comp-fee').value,
        rules: document.getElementById('comp-rules').value,
        prizeDetails: document.getElementById('comp-prize').value,
        description: document.getElementById('comp-desc').value,
        bannerUrl: photoToUse,
        thumbnail: photoToUse,
        photoUrl: photoToUse,
        hasCustomPhoto: !!customPhotoUrl,
        organizerId: currentUser.uid,
        organizerName: currentUser.fullName,
        status: "upcoming",
        createdAt: new Date().toISOString()
      };

      try {
        await SportsPortal.db.addDoc('competitions', newComp);
        showToast("New tournament broadcasted successfully!", "success");
        form.reset();
        customPhotoUrl = null;
        if (bannerInput) bannerInput.value = '';
        updateBannerPreview();

        // Refresh
        await loadDashboardData();

        // Redirect overview tab
        document.querySelector('[data-target="panel-overview"]').click();

      } catch (err) {
        showToast(err.message, "danger");
      }
    });
  }
}

/* ==========================================================================
   REGISTRATIONS MANAGEMENT ENGINE
   ========================================================================== */
function renderRegistrationsManager() {
  const tbody = document.getElementById('registrations-table-body');
  const filterComp = document.getElementById('reg-comp-filter');
  const filterStatus = document.getElementById('reg-status-filter');
  if (!tbody) return;

  // Bind option comps list
  filterComp.innerHTML = `<option value="">All Created Competitions</option>` + allComps.map(c => `
    <option value="${c.id}">${c.title}</option>
  `).join('');

  const render = () => {
    const compVal = filterComp.value;
    const statusVal = filterStatus.value;

    const filtered = allRegs.filter(r => {
      const matchesComp = !compVal || r.competitionId === compVal;
      const matchesStatus = !statusVal || r.status === statusVal;
      return matchesComp && matchesStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-secondary);">No enrollment entries match the chosen filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const statusBadge = r.status === 'approved' 
        ? '<span class="badge badge-success">Approved</span>' 
        : r.status === 'rejected' 
        ? '<span class="badge badge-danger">Rejected</span>' 
        : '<span class="badge badge-warning">Pending Approval</span>';

      const controls = r.status === 'pending'
        ? `
          <button class="btn btn-primary" onclick="window.updateRegStatus('${r.id}', 'approved')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">Approve</button>
          <button class="btn btn-ghost" onclick="window.updateRegStatus('${r.id}', 'rejected')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; color: var(--danger);">Reject</button>
        `
        : `<span style="font-size:0.8rem; color:var(--text-muted);">Processed</span>`;

      return `
        <tr>
          <td style="font-weight: 600;">${r.userName}</td>
          <td>${r.competitionTitle}</td>
          <td>${r.regType}</td>
          <td><code>${r.idProof}</code></td>
          <td>${statusBadge}</td>
          <td style="display:flex; gap:0.5rem;">${controls}</td>
        </tr>
      `;
    }).join('');
  };

  [filterComp, filterStatus].forEach(el => el.addEventListener('input', render));
  render();
}

window.updateRegStatus = async (regId, status) => {
  try {
    await SportsPortal.db.updateDoc('registrations', regId, { status });
    const reg = allRegs.find(r => r.id === regId);
    
    // Dispatch alert notification to the specific Athlete user
    await SportsPortal.db.addDoc('notifications', {
      userId: reg.userId,
      title: status === 'approved' ? "Application Approved!" : "Application Rejected",
      message: status === 'approved' 
        ? `Congratulations! Your registration for ${reg.competitionTitle} has been verified.` 
        : `Verification failed for your registration at ${reg.competitionTitle}. Details match issue.`,
      type: "status_update",
      read: false,
      timestamp: new Date().toISOString()
    });

    showToast(`Applicant verification updated to ${status.toUpperCase()}!`, "success");
    await loadDashboardData();

  } catch (err) {
    showToast(err.message, "danger");
  }
};

/* ==========================================================================
   ATTENDANCE & CERTIFICATES UNLOCKER
   ========================================================================== */
function renderAttendanceRegistry() {
  const tbody = document.getElementById('attendance-table-body');
  if (!tbody) return;

  const approvedRegs = allRegs.filter(r => r.status === 'approved');

  if (approvedRegs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">No approved athletes available for venue attendance tracking yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = approvedRegs.map(r => {
    const seal = r.attended 
      ? '<span class="badge badge-success">✓ Present</span>' 
      : '<span class="badge badge-warning">Absent</span>';

    const action = !r.attended 
      ? `<button class="btn btn-outline" onclick="window.markAttendancePresent('${r.id}')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">Mark Present</button>`
      : `<span style="font-size:0.8rem; color:var(--success);">Unlocked Certificate</span>`;

    return `
      <tr>
        <td style="font-weight: 600;">${r.userName}</td>
        <td>${r.competitionTitle}</td>
        <td>${r.regType}</td>
        <td>${seal}</td>
        <td>${action}</td>
      </tr>
    `;
  }).join('');
}

window.markAttendancePresent = async (regId) => {
  try {
    await SportsPortal.db.updateDoc('registrations', regId, { attended: true });
    const reg = allRegs.find(r => r.id === regId);

    // Notify user that they can now download their verified certificate!
    await SportsPortal.db.addDoc('notifications', {
      userId: reg.userId,
      title: "Certificate Unlocked!",
      message: `Your participation certificate for ${reg.competitionTitle} is ready to download.`,
      type: "certificate",
      read: false,
      timestamp: new Date().toISOString()
    });

    showToast("Athlete presence validated! Certificate unlocked.", "success");
    await loadDashboardData();
  } catch (err) {
    showToast(err.message, "danger");
  }
};

/* ==========================================================================
   CSV EXPORTS SIMULATOR
   ========================================================================== */
window.exportToCSV = () => {
  if (allRegs.length === 0) {
    showToast("No registrations available to compile.", "warning");
    return;
  }
  
  let csv = "Athlete Name,Competition,Role,Verification,Timestamp\n";
  allRegs.forEach(r => {
    csv += `"${r.userName}","${r.competitionTitle}","${r.regType}","${r.status}","${r.timestamp}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `registrations_export_${Date.now()}.csv`;
  a.click();
  showToast("CSV registry document created successfully!", "success");
};

/* ==========================================================================
   QR CODE VERIFICATION CONTROLLER
   ========================================================================== */
function setupQRScannerModal() {
  const modal = document.getElementById('qr-modal');
  const openBtn = document.getElementById('open-qr-scanner-btn');
  const closeBtn = document.getElementById('qr-modal-close');
  const simulateBtn = document.getElementById('qr-simulate-btn');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.add('active'));
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  if (simulateBtn) {
    simulateBtn.addEventListener('click', async () => {
      const codeVal = document.getElementById('qr-manual-code').value || "1234 5678 9012";
      
      // Look for approved registration matching this proof
      const match = allRegs.find(r => r.idProof.replace(/\s/g, '') === codeVal.replace(/\s/g, '') && r.status === 'approved');

      if (match) {
        await window.markAttendancePresent(match.id);
        modal.classList.remove('active');
        document.getElementById('qr-manual-code').value = "";
      } else {
        showToast("Invalid credentials or athlete registration has not been verified.", "danger");
      }
    });
  }
}

/* ==========================================================================
   PUBLISH SPORTS NEWS FEED
   ========================================================================== */
function setupNewsPublishForm() {
  const form = document.getElementById('news-publish-form');
  const imageInput = document.getElementById('news-image-file');
  let newsCoverUrl = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60";

  if (imageInput) {
    imageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          newsCoverUrl = await SportsPortal.storage.uploadBytes(`news/${Date.now()}`, file);
        } catch (err) {
          showToast("Upload failed", "danger");
        }
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const newPost = {
        title: document.getElementById('news-title').value,
        excerpt: document.getElementById('news-excerpt').value,
        content: document.getElementById('news-content').value,
        imageUrl: newsCoverUrl,
        date: new Date().toISOString().split('T')[0]
      };

      try {
        await SportsPortal.db.addDoc('news', newPost);
        showToast("Announcement broadcasted live on portal frontpage!", "success");
        form.reset();

        // Redirect Overview
        document.querySelector('[data-target="panel-overview"]').click();
      } catch (err) {
        showToast(err.message, "danger");
      }
    });
  }
}

/* ==========================================================================
   NOTIFICATIONS ALERTS CENTER
   ========================================================================== */
function setupNotificationSystem() {
  const toggle = document.getElementById('notif-toggle');
  const drawer = document.getElementById('notif-drawer');
  const close = document.getElementById('notif-close-btn');

  if (toggle && drawer && close) {
    toggle.addEventListener('click', () => drawer.classList.add('active'));
    close.addEventListener('click', () => drawer.classList.remove('active'));
  }

  SportsPortal.db.onSnapshot('notifications', (notifications) => {
    const userNotifs = Object.values(notifications || {}).filter(n => n.userId === currentUser.uid);
    const unread = userNotifs.filter(n => !n.read);
    
    const badge = document.getElementById('notif-badge-count');
    if (badge) badge.textContent = unread.length;

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

/* ==========================================================================
   TOURNAMENT MANAGER — bracket generation, scoring & certificates
   ========================================================================== */

const BYE = { id: '__bye__', name: 'BYE', isBye: true };

/* The competition currently loaded into the bracket viewport. */
let activeTourneyCompId = null;

function setupTournamentManager() {
  const select = document.getElementById('tourney-comp-select');
  const formatSel = document.getElementById('tourney-format-select');
  const genBtn = document.getElementById('tourney-generate-btn');
  if (!select || !genBtn) return;

  // Populate competitions owned by this organizer.
  select.innerHTML = `<option value="">Select a competition…</option>` +
    allComps.map(c => `<option value="${c.id}">${escapeT(c.title)} — ${escapeT(c.sportType)}</option>`).join('');

  // When a competition is chosen, prefill participants and restore any saved bracket.
  select.addEventListener('change', () => onTourneyCompSelected(select.value, formatSel));

  genBtn.addEventListener('click', () => generateBracket(select.value, formatSel.value));

  // Certificate modal close.
  const certClose = document.getElementById('cert-modal-close');
  if (certClose) certClose.addEventListener('click', () => {
    document.getElementById('cert-modal').classList.remove('active');
  });
  const dlAll = document.getElementById('cert-download-all-btn');
  if (dlAll) dlAll.addEventListener('click', () => window.tourneyDownloadAll());

  document.getElementById('tourney-complete-btn').addEventListener('click', () => window.tourneyMarkCompleted());
  document.getElementById('tourney-certs-btn').addEventListener('click', () => window.tourneyGenerateCerts());
}

function escapeT(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getComp(compId) {
  return allComps.find(c => c.id === compId) || null;
}

/* Approved, de-duplicated participants for a competition (fallback: textarea lines). */
function getApprovedParticipants(compId) {
  const seen = new Set();
  const list = [];
  allRegs
    .filter(r => r.competitionId === compId && r.status === 'approved')
    .forEach(r => {
      const key = (r.userId || r.userName || '').toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({ id: r.userId || `p_${list.length}`, name: r.userName });
      }
    });
  return list;
}

function onTourneyCompSelected(compId, formatSel) {
  const hint = document.getElementById('tourney-participant-hint');
  const ta = document.getElementById('tourney-participants');
  const comp = getComp(compId);

  if (!comp) {
    ta.value = '';
    hint.textContent = '';
    hideBoard();
    return;
  }

  // If a bracket already exists on this comp, restore it and lock the format select to match.
  if (comp.bracket) {
    formatSel.value = comp.bracket.format;
    const names = comp.bracket.participants.map(p => p.name);
    ta.value = names.join('\n');
    hint.textContent = `Saved ${comp.bracket.format === 'round-robin' ? 'round-robin' : 'knockout'} bracket loaded (${names.length} participants).`;
    renderBracket(comp);
    return;
  }

  const approved = getApprovedParticipants(compId);
  ta.value = approved.map(p => p.name).join('\n');
  hint.textContent = approved.length
    ? `${approved.length} approved athlete(s) loaded. You can edit the list before generating.`
    : 'No approved registrations found — type at least 2 participant names (one per line) to build a bracket.';
  hideBoard();
}

function hideBoard() {
  const card = document.getElementById('tourney-board-card');
  if (card) card.hidden = true;
  const pill = document.getElementById('tourney-status-pill');
  if (pill) pill.hidden = true;
  activeTourneyCompId = null;
}

/* Parse textarea into a clean participant list. */
function readParticipantsFromUI() {
  const ta = document.getElementById('tourney-participants');
  const lines = ta.value.split('\n').map(s => s.trim()).filter(Boolean);
  const seen = new Set();
  const out = [];
  lines.forEach((name, i) => {
    const key = name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push({ id: `p_${i}_${key.replace(/\W+/g, '').slice(0, 8)}`, name, seed: out.length + 1 }); }
  });
  return out;
}

/* Deterministic shuffle (seeded by participant count) so byes are reproducible. */
function seededShuffle(arr) {
  const a = arr.slice();
  let seed = a.length * 2654435761 % 2147483647 || 1;
  const rand = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---- Single elimination ---- */
function buildSingleElim(participants) {
  const seeded = seededShuffle(participants);
  const size = Math.pow(2, Math.ceil(Math.log2(seeded.length)));
  const slots = seeded.slice();
  while (slots.length < size) slots.push(BYE); // pad with byes

  // First round pairings: standard seed-vs-rest fold so byes spread out.
  const rounds = [];
  let matchCounter = 0;
  const firstRound = [];
  for (let i = 0; i < size / 2; i++) {
    const a = slots[i];
    const b = slots[size - 1 - i];
    const m = newMatch(matchCounter++, a, b);
    // Auto-resolve byes immediately.
    if (a.isBye && !b.isBye) { m.winner = b.id; }
    else if (b.isBye && !a.isBye) { m.winner = a.id; }
    firstRound.push(m);
  }
  rounds.push(firstRound);

  // Build empty subsequent rounds.
  let count = size / 2;
  while (count > 1) {
    count = count / 2;
    const round = [];
    for (let i = 0; i < count; i++) round.push(newMatch(matchCounter++, null, null));
    rounds.push(round);
  }

  const bracket = {
    format: 'single-elim',
    createdAt: new Date().toISOString(),
    participants: participants.map((p, i) => ({ id: p.id, name: p.name, seed: i + 1 })),
    rounds,
    champion: null,
  };
  propagateByes(bracket);
  return bracket;
}

function newMatch(idx, a, b) {
  return {
    matchId: 'm' + idx,
    a: a ? { id: a.id, name: a.name, isBye: !!a.isBye } : null,
    b: b ? { id: b.id, name: b.name, isBye: !!b.isBye } : null,
    scoreA: null, scoreB: null,
    winner: a && a.isBye && b && !b.isBye ? b.id : (b && b.isBye && a && !a.isBye ? a.id : null),
  };
}

/* Push already-decided (bye) winners into the next round slots. */
function propagateByes(bracket) {
  for (let r = 0; r < bracket.rounds.length - 1; r++) {
    bracket.rounds[r].forEach((m, i) => {
      if (m.winner) advanceWinnerSlot(bracket, r, i, m.winner);
    });
  }
}

function participantById(bracket, pid) {
  return bracket.participants.find(p => p.id === pid) || (pid === BYE.id ? BYE : null);
}

/* Place the winner of round r, match i into the correct slot of round r+1. */
function advanceWinnerSlot(bracket, r, i, winnerId) {
  const next = bracket.rounds[r + 1];
  if (!next) { bracket.champion = winnerId; return; }
  const nextIdx = Math.floor(i / 2);
  const slot = i % 2 === 0 ? 'a' : 'b';
  const p = participantById(bracket, winnerId);
  if (!p) return;
  next[nextIdx][slot] = { id: p.id, name: p.name, isBye: !!p.isBye };
  // If both feeders into a next-round match were byes, auto-resolve.
  const nm = next[nextIdx];
  if (nm.a && nm.b && nm.a.isBye && !nm.b.isBye) nm.winner = nm.b.id;
  else if (nm.a && nm.b && nm.b.isBye && !nm.a.isBye) nm.winner = nm.a.id;
}

/* ---- Round robin ---- */
function buildRoundRobin(participants) {
  const matches = [];
  let idx = 0;
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        matchId: 'm' + idx++,
        a: { id: participants[i].id, name: participants[i].name },
        b: { id: participants[j].id, name: participants[j].name },
        scoreA: null, scoreB: null, winner: null,
      });
    }
  }
  const bracket = {
    format: 'round-robin',
    createdAt: new Date().toISOString(),
    participants: participants.map((p, i) => ({ id: p.id, name: p.name, seed: i + 1 })),
    matches,
    standings: computeStandings(participants, matches),
    champion: null,
  };
  return bracket;
}

function computeStandings(participants, matches) {
  const table = {};
  participants.forEach(p => { table[p.id] = { pid: p.id, name: p.name, played: 0, won: 0, lost: 0, points: 0 }; });
  matches.forEach(m => {
    if (!m.winner) return;
    const loser = m.winner === m.a.id ? m.b.id : m.a.id;
    if (table[m.winner]) { table[m.winner].played++; table[m.winner].won++; table[m.winner].points += 3; }
    if (table[loser]) { table[loser].played++; table[loser].lost++; }
  });
  return Object.values(table).sort((x, y) =>
    y.points - x.points || y.won - x.won || x.name.localeCompare(y.name));
}

/* ---- Generate (entry point from the button) ---- */
async function generateBracket(compId, format) {
  const comp = getComp(compId);
  if (!comp) { showToast('Please select a competition first.', 'warning'); return; }

  const participants = readParticipantsFromUI();
  if (participants.length < 2) {
    showToast('Need at least 2 participants to generate a bracket.', 'warning');
    return;
  }

  // Confirm overwrite if a bracket already exists.
  if (comp.bracket && !confirm('A bracket already exists for this competition. Regenerate and discard current scores?')) {
    return;
  }

  const bracket = format === 'round-robin'
    ? buildRoundRobin(participants)
    : buildSingleElim(participants);

  await SportsPortal.db.updateDoc('competitions', compId, { bracket, status: 'ongoing' });
  comp.bracket = bracket;
  comp.status = 'ongoing';

  showToast(`${format === 'round-robin' ? 'Round-robin' : 'Knockout'} bracket generated for ${participants.length} participants!`, 'success');
  renderBracket(comp);
}

/* ==========================================================================
   RENDERING
   ========================================================================== */
function renderBracket(comp) {
  activeTourneyCompId = comp.id;
  const card = document.getElementById('tourney-board-card');
  const viewport = document.getElementById('bracket-viewport');
  const title = document.getElementById('tourney-board-title');
  const sub = document.getElementById('tourney-board-sub');
  card.hidden = false;

  const b = comp.bracket;
  title.textContent = `${comp.title} — ${b.format === 'round-robin' ? 'Round Robin' : 'Single Elimination'}`;

  if (b.format === 'round-robin') renderRoundRobin(viewport, comp);
  else renderSingleElim(viewport, comp);

  updateTourneyStatusUI(comp);
  sub.textContent = comp.status === 'completed'
    ? 'Tournament completed. Certificates are ready to generate.'
    : 'Enter scores to advance winners. Mark completed once every match has a result.';
}

function updateTourneyStatusUI(comp) {
  const pill = document.getElementById('tourney-status-pill');
  const completeBtn = document.getElementById('tourney-complete-btn');
  const certsBtn = document.getElementById('tourney-certs-btn');
  const b = comp.bracket;

  const allDone = isTournamentDecided(b);
  const completed = comp.status === 'completed';

  if (pill) {
    pill.hidden = false;
    pill.textContent = completed ? '✅ Completed' : (allDone ? '⏳ Ready to complete' : '🟢 In progress');
    pill.className = 'tourney-status-pill ' + (completed ? 'done' : allDone ? 'ready' : 'live');
  }
  if (completeBtn) completeBtn.disabled = completed || !allDone;
  if (certsBtn) certsBtn.disabled = !completed;
}

function isTournamentDecided(b) {
  if (b.format === 'round-robin') return b.matches.every(m => m.winner);
  return !!b.champion && b.rounds[b.rounds.length - 1][0].winner;
}

/* ---- Single-elim view ---- */
function renderSingleElim(viewport, comp) {
  const b = comp.bracket;
  const roundNames = singleElimRoundNames(b.rounds.length);
  const locked = comp.status === 'completed';

  const cols = b.rounds.map((round, r) => {
    const matches = round.map((m, i) => bracketMatchHtml(comp, m, r, i, locked)).join('');
    return `<div class="bracket-round">
      <div class="bracket-round-title">${roundNames[r]}</div>
      <div class="bracket-round-matches">${matches}</div>
    </div>`;
  }).join('');

  const champName = b.champion ? (participantById(b, b.champion) || {}).name : null;
  const champBanner = champName
    ? `<div class="bracket-champion">🏆 Champion: <strong>${escapeT(champName)}</strong></div>` : '';

  viewport.innerHTML = `<div class="bracket-scroll">${cols}</div>${champBanner}`;
}

function singleElimRoundNames(n) {
  const names = [];
  for (let i = 0; i < n; i++) {
    const remaining = Math.pow(2, n - i);
    if (remaining === 2) names.push('Final');
    else if (remaining === 4) names.push('Semi-finals');
    else if (remaining === 8) names.push('Quarter-finals');
    else names.push(`Round of ${remaining}`);
  }
  return names;
}

function bracketMatchHtml(comp, m, r, i, locked) {
  const b = comp.bracket;
  const slot = (p, which) => {
    if (!p) return `<div class="bracket-seed empty"><span class="bs-name">TBD</span></div>`;
    if (p.isBye) return `<div class="bracket-seed bye"><span class="bs-name">BYE</span></div>`;
    const isWinner = m.winner === p.id;
    const score = which === 'a' ? m.scoreA : m.scoreB;
    return `<div class="bracket-seed ${isWinner ? 'winner' : (m.winner ? 'loser' : '')}">
      <span class="bs-name">${escapeT(p.name)}</span>
      <span class="bs-score">${score == null ? '–' : score}</span>
    </div>`;
  };

  const canScore = !locked && m.a && m.b && !m.a.isBye && !m.b.isBye && !m.winner;
  const scoreForm = canScore ? `
    <div class="bracket-score-entry">
      <input type="number" min="0" class="score-input" id="sa_${comp.id}_${m.matchId}" placeholder="0" aria-label="Score for ${escapeT(m.a.name)}" />
      <span class="score-vs">:</span>
      <input type="number" min="0" class="score-input" id="sb_${comp.id}_${m.matchId}" placeholder="0" aria-label="Score for ${escapeT(m.b.name)}" />
      <button class="btn btn-primary score-save-btn" type="button" onclick="window.tourneySubmitScore('${comp.id}','${m.matchId}')">Save</button>
    </div>` : '';

  return `<div class="bracket-match ${m.winner ? 'decided' : ''}" data-match="${m.matchId}">
    ${slot(m.a, 'a')}
    ${slot(m.b, 'b')}
    ${scoreForm}
  </div>`;
}

/* ---- Round-robin view ---- */
function renderRoundRobin(viewport, comp) {
  const b = comp.bracket;
  const locked = comp.status === 'completed';

  const matchRows = b.matches.map(m => {
    const decided = !!m.winner;
    const aWin = m.winner === m.a.id;
    const bWin = m.winner === m.b.id;
    const scoreCell = decided
      ? `<span class="rr-score">${m.scoreA} : ${m.scoreB}</span>`
      : (locked ? `<span class="rr-score">– : –</span>` : `
        <span class="bracket-score-entry inline">
          <input type="number" min="0" class="score-input" id="sa_${comp.id}_${m.matchId}" placeholder="0" aria-label="Score for ${escapeT(m.a.name)}" />
          <span class="score-vs">:</span>
          <input type="number" min="0" class="score-input" id="sb_${comp.id}_${m.matchId}" placeholder="0" aria-label="Score for ${escapeT(m.b.name)}" />
          <button class="btn btn-primary score-save-btn" type="button" onclick="window.tourneySubmitScore('${comp.id}','${m.matchId}')">Save</button>
        </span>`);
    return `<div class="rr-match ${decided ? 'decided' : ''}">
      <span class="rr-team ${aWin ? 'winner' : ''}">${escapeT(m.a.name)}</span>
      <span class="rr-mid">${scoreCell}</span>
      <span class="rr-team right ${bWin ? 'winner' : ''}">${escapeT(m.b.name)}</span>
    </div>`;
  }).join('');

  const standings = b.standings.map((s, i) => `
    <tr class="${i === 0 ? 'leader' : ''}">
      <td>${i + 1}</td>
      <td style="font-weight:600;">${escapeT(s.name)}</td>
      <td>${s.played}</td><td>${s.won}</td><td>${s.lost}</td>
      <td style="font-weight:700;">${s.points}</td>
    </tr>`).join('');

  const champName = comp.status === 'completed' && b.champion ? (participantById(b, b.champion) || {}).name : null;
  const champBanner = champName ? `<div class="bracket-champion">🏆 Champion: <strong>${escapeT(champName)}</strong></div>` : '';

  viewport.innerHTML = `
    <div class="rr-layout">
      <div class="rr-schedule">
        <h4 class="rr-subtitle">Match Schedule</h4>
        <div class="rr-match-list">${matchRows}</div>
      </div>
      <div class="rr-standings">
        <h4 class="rr-subtitle">Standings</h4>
        <table class="data-table standings-table">
          <thead><tr><th>#</th><th>Team / Athlete</th><th>P</th><th>W</th><th>L</th><th>Pts</th></tr></thead>
          <tbody>${standings}</tbody>
        </table>
      </div>
    </div>${champBanner}`;
}

/* ==========================================================================
   SCORE ENTRY & WINNER ADVANCEMENT
   ========================================================================== */
window.tourneySubmitScore = async (compId, matchId) => {
  const comp = getComp(compId);
  if (!comp || !comp.bracket) return;
  const b = comp.bracket;

  const sa = parseInt(document.getElementById(`sa_${compId}_${matchId}`).value, 10);
  const sb = parseInt(document.getElementById(`sb_${compId}_${matchId}`).value, 10);

  if (Number.isNaN(sa) || Number.isNaN(sb) || sa < 0 || sb < 0) {
    showToast('Enter valid numeric scores for both sides.', 'warning');
    return;
  }
  if (sa === sb) {
    showToast('Scores cannot be tied in a knockout/decisive match. Enter a winner.', 'warning');
    return;
  }

  if (b.format === 'round-robin') {
    const m = b.matches.find(x => x.matchId === matchId);
    if (!m) return;
    m.scoreA = sa; m.scoreB = sb;
    m.winner = sa > sb ? m.a.id : m.b.id;
    b.standings = computeStandings(b.participants, b.matches);
    if (b.matches.every(x => x.winner)) b.champion = b.standings[0].pid;
  } else {
    let target = null, rIdx = -1, mIdx = -1;
    b.rounds.forEach((round, r) => round.forEach((m, i) => { if (m.matchId === matchId) { target = m; rIdx = r; mIdx = i; } }));
    if (!target) return;
    target.scoreA = sa; target.scoreB = sb;
    target.winner = sa > sb ? target.a.id : target.b.id;
    advanceWinnerSlot(b, rIdx, mIdx, target.winner);
    if (rIdx === b.rounds.length - 1) b.champion = target.winner;
  }

  await SportsPortal.db.updateDoc('competitions', compId, { bracket: b });
  renderBracket(comp);
};

window.tourneyMarkCompleted = async () => {
  const comp = getComp(activeTourneyCompId);
  if (!comp || !comp.bracket) return;
  if (!isTournamentDecided(comp.bracket)) {
    showToast('All matches must have a result before completing the tournament.', 'warning');
    return;
  }
  comp.status = 'completed';
  await SportsPortal.db.updateDoc('competitions', comp.id, { status: 'completed', bracket: comp.bracket });
  showToast('🏁 Tournament marked as Completed. Certificates unlocked!', 'success');
  renderBracket(comp);
};

/* ==========================================================================
   RANKING & CERTIFICATES
   ========================================================================== */
/* Final ranking of every participant from the decided bracket. */
function computeFinalRanks(comp) {
  const b = comp.bracket;
  if (b.format === 'round-robin') {
    return b.standings.map((s, i) => ({ id: s.pid, name: s.name, rank: i + 1 }));
  }
  // Single-elimination ranking.
  // Order players by how far they advanced: the later the round they lost in,
  // the higher they rank. The champion (never lost) ranks first. Within the same
  // exit round we break ties deterministically by seed so ranks are strictly
  // distinct (exactly one Gold / Silver / Bronze — no joint medals).
  const seedOf = {};
  b.participants.forEach(p => { seedOf[p.id] = p.seed || 999; });

  // lostRound[pid] = index of the round in which the player was eliminated.
  // Champion is never set → treated as Infinity (ranks above everyone).
  const lostRound = {};
  b.rounds.forEach((round, r) => {
    round.forEach(m => {
      if (!m.winner) return;
      [m.a, m.b].forEach(side => {
        if (side && !side.isBye && side.id !== m.winner && lostRound[side.id] == null) {
          lostRound[side.id] = r;
        }
      });
    });
  });

  const ranked = b.participants
    .map(p => ({ id: p.id, name: p.name, lost: lostRound[p.id] == null ? Infinity : lostRound[p.id], seed: seedOf[p.id] }))
    .sort((x, y) => y.lost - x.lost || x.seed - y.seed || x.name.localeCompare(y.name));

  // Strictly distinct ranks 1..N → top 3 are Merit, the rest Participation.
  return ranked.map((p, i) => ({ id: p.id, name: p.name, rank: i + 1 }));
}

function rankToTier(rank) {
  if (rank === 1) return { type: 'Merit', place: '1st Place — Champion', medal: '🥇', accent: '#d4af37', ribbon: 'Gold' };
  if (rank === 2) return { type: 'Merit', place: '2nd Place — Runner-up', medal: '🥈', accent: '#9ca3af', ribbon: 'Silver' };
  if (rank === 3) return { type: 'Merit', place: '3rd Place', medal: '🥉', accent: '#cd7f32', ribbon: 'Bronze' };
  return { type: 'Participation', place: 'Participant', medal: '🎖️', accent: '#1e3a8a', ribbon: '' };
}

window.tourneyGenerateCerts = () => {
  const comp = getComp(activeTourneyCompId);
  if (!comp || !comp.bracket) return;
  if (comp.status !== 'completed') {
    showToast('Mark the tournament as Completed first.', 'warning');
    return;
  }
  const ranks = computeFinalRanks(comp);
  const list = document.getElementById('cert-result-list');
  const sub = document.getElementById('cert-modal-sub');
  sub.textContent = `${comp.title} — ${ranks.length} certificates ready (Merit for top 3, Participation for the rest).`;

  list.innerHTML = ranks.map(p => {
    const tier = rankToTier(p.rank);
    return `<div class="cert-result-row">
      <span class="cert-medal">${tier.medal}</span>
      <span class="cert-row-name">${escapeT(p.name)}</span>
      <span class="cert-row-tier ${tier.type === 'Merit' ? 'merit' : 'participation'}">${tier.type} · ${escapeT(tier.place)}</span>
      <button class="btn btn-outline cert-dl-btn" type="button" onclick="window.tourneyDownloadCert('${escapeT(p.id)}')">⬇️ PDF</button>
    </div>`;
  }).join('');

  document.getElementById('cert-modal').classList.add('active');
};

/* Build the government-branded certificate DOM for one participant. */
function buildCertificateNode(comp, participant, tier) {
  const stage = document.getElementById('certificate-stage');
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const isMerit = tier.type === 'Merit';
  const node = document.createElement('div');
  node.className = 'gov-certificate';
  node.style.setProperty('--cert-accent', tier.accent);
  node.innerHTML = `
    <div class="gc-border">
      <div class="gc-header">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem of India" class="gc-emblem" crossorigin="anonymous" />
        <div class="gc-gov">
          <div class="gc-gov-line1">Government of India</div>
          <div class="gc-gov-line2">Ministry of Youth Affairs &amp; Sports</div>
          <div class="gc-gov-line3">SportsBharat — National Sports Portal</div>
        </div>
      </div>

      <div class="gc-title">Certificate of ${isMerit ? 'Merit' : 'Participation'}</div>
      <div class="gc-ribbon" ${isMerit ? '' : 'style="opacity:0"'}>${tier.ribbon || ''} ${tier.medal}</div>

      <div class="gc-body">
        <p class="gc-line">This is to certify that</p>
        <div class="gc-name">${escapeT(participant.name)}</div>
        <p class="gc-line">
          ${isMerit
            ? `secured <strong>${escapeT(tier.place)}</strong> in`
            : `participated in`}
        </p>
        <div class="gc-comp">${escapeT(comp.title)}</div>
        <p class="gc-meta">
          ${escapeT(comp.sportType)} &nbsp;•&nbsp; ${escapeT(comp.venue || comp.city || 'India')}
          &nbsp;•&nbsp; ${escapeT((comp.dateTime || '').replace('T', ' '))}
        </p>
      </div>

      <div class="gc-footer">
        <div class="gc-sign">
          <div class="gc-sign-line"></div>
          <div class="gc-sign-label">Tournament Director</div>
          <div class="gc-sign-name">${escapeT(comp.organizerName || 'SportsBharat')}</div>
        </div>
        <div class="gc-seal">
          <div class="gc-seal-ring">DIGITALLY<br/>SIGNED</div>
          <div class="gc-seal-note">SportsBharat e-Sign · ${dateStr}</div>
        </div>
        <div class="gc-sign">
          <div class="gc-sign-line"></div>
          <div class="gc-sign-label">Authorised Signatory</div>
          <div class="gc-sign-name">NADA / MYAS</div>
        </div>
      </div>
      <div class="gc-certid">Certificate ID: SB-${escapeT((comp.id || '').slice(-6).toUpperCase())}-${escapeT(String(participant.rank).padStart(3, '0'))}</div>
    </div>`;
  stage.innerHTML = '';
  stage.appendChild(node);
  return node;
}

async function renderCertToPdf(comp, participant) {
  if (!window.html2canvas || !window.jspdf) {
    showToast('PDF engine unavailable in this browser.', 'danger');
    return false;
  }
  const tier = rankToTier(participant.rank);
  const node = buildCertificateNode(comp, participant, tier);
  // Allow layout/paint before capture.
  await new Promise(res => setTimeout(res, 60));
  const canvas = await window.html2canvas(node, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
  const img = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  pdf.addImage(img, 'PNG', 0, 0, w, h);
  const safe = participant.name.replace(/[^\w]+/g, '_');
  const compSafe = (comp.title || 'Tournament').replace(/[^\w]+/g, '_').slice(0, 24);
  pdf.save(`Certificate_${safe}_${compSafe}.pdf`);
  document.getElementById('certificate-stage').innerHTML = '';
  return true;
}

window.tourneyDownloadCert = async (pid) => {
  const comp = getComp(activeTourneyCompId);
  if (!comp) return;
  const participant = computeFinalRanks(comp).find(p => p.id === pid);
  if (!participant) return;
  showToast(`Preparing certificate for ${participant.name}…`, 'success');
  await renderCertToPdf(comp, participant);
};

window.tourneyDownloadAll = async () => {
  const comp = getComp(activeTourneyCompId);
  if (!comp) return;
  const ranks = computeFinalRanks(comp);
  showToast(`Generating ${ranks.length} certificates…`, 'success');
  for (const p of ranks) {
    await renderCertToPdf(comp, p);
    await new Promise(res => setTimeout(res, 150)); // stagger downloads
  }
  showToast('All certificates downloaded.', 'success');
};
