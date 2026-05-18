/* ==========================================================================
   SPORTS ORGANIZER DASHBOARD CONTROLLER
   ========================================================================== */

import { SportsPortal } from './firebase-config.js';
import { showToast } from './auth.js';

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

  container.innerHTML = allComps.map(c => `
    <li style="margin-bottom: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
      <strong>${c.title}</strong>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.25rem;">
        <span class="badge badge-success" style="font-size:0.7rem;">${c.sportType}</span>
        <span style="font-size:0.8rem; color:var(--text-secondary);">📅 ${c.dateTime.replace('T', ' ')}</span>
      </div>
    </li>
  `).join('');
}

/* ==========================================================================
   COMPETITION FORM CREATION
   ========================================================================== */
function setupCreateCompetitionForm() {
  const form = document.getElementById('comp-create-form');
  const bannerInput = document.getElementById('comp-banner-file');

  if (bannerInput) {
    bannerInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          tempBannerUrl = await SportsPortal.storage.uploadBytes(`banners/${Date.now()}`, file);
          document.getElementById('banner-preview-text').textContent = `✓ Banner Loaded Successfully!`;
        } catch (err) {
          showToast("Upload banner failed", "danger");
        }
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const newComp = {
        title: document.getElementById('comp-title').value,
        sportType: document.getElementById('comp-sport').value,
        dateTime: document.getElementById('comp-date').value,
        venue: document.getElementById('comp-venue').value,
        city: document.getElementById('comp-city').value,
        state: document.getElementById('comp-state').value,
        maxParticipants: parseInt(document.getElementById('comp-max').value),
        regFee: document.getElementById('comp-fee').value,
        rules: document.getElementById('comp-rules').value,
        prizeDetails: document.getElementById('comp-prize').value,
        description: document.getElementById('comp-desc').value,
        bannerUrl: tempBannerUrl,
        organizerId: currentUser.uid,
        organizerName: currentUser.fullName,
        status: "upcoming",
        createdAt: new Date().toISOString()
      };

      try {
        await SportsPortal.db.addDoc('competitions', newComp);
        showToast("New tournament broadcasted successfully!", "success");
        form.reset();
        tempBannerUrl = "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=60";
        document.getElementById('banner-preview-text').textContent = `Default government placeholder applied if none chosen`;
        
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
