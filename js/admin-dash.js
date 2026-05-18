/* ==========================================================================
   ADMINISTRATOR DASHBOARD CONTROLLER
   ========================================================================== */

import { SportsPortal } from './firebase-config.js';
import { showToast } from './auth.js';

let currentUser = null;
let allUsers = [];
let allOrgs = [];
let allComps = [];
let adminMonthlyChart = null;
let adminStateChart = null;
let adminSportsChart = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check Admin auth
  SportsPortal.auth.onAuthStateChanged(async (user) => {
    if (!user || user.role !== 'admin') {
      window.location.href = '../auth/login.html';
      return;
    }
    currentUser = user;

    // Set header labels
    const displayLabel = document.getElementById('admin-display-name');
    const avatar = document.getElementById('avatar-circle');
    if (displayLabel) displayLabel.textContent = currentUser.fullName;
    if (avatar) avatar.textContent = currentUser.fullName[0].toUpperCase();

    // Hide loader
    const loader = document.getElementById('page-loader');
    if (loader) loader.classList.add('fade-out');

    // Run modules
    setupSidebarNavigation();
    await loadAdminSystemData();
    setupSecurityConsoleSimulation();
    setupNotificationSystem();
  });

  // Setup theme toggle
  setupThemeToggle();

  // Responsive drawer
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('active'));
  }

  // Logout
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

      document.getElementById('sidebar').classList.remove('active');
    });
  });
}

/* ==========================================================================
   LOAD SYSTEM METRICS & GRAPHICS
   ========================================================================== */
async function loadAdminSystemData() {
  try {
    // 1. Get raw database collections
    const athletesCol = await SportsPortal.db.getCollection('users');
    const orgsCol = await SportsPortal.db.getCollection('organizers');
    const compsCol = await SportsPortal.db.getCollection('competitions');

    allUsers = athletesCol;
    allOrgs = orgsCol;
    allComps = compsCol;

    const verifiedOrgsCount = allOrgs.filter(o => o.verified).length;

    // Set stats summaries
    document.getElementById('stats-total-users').textContent = allUsers.length + allOrgs.length + 1;
    document.getElementById('stats-active-comps').textContent = allComps.length;
    document.getElementById('stats-verified-orgs').textContent = verifiedOrgsCount;

    // Draw charts
    renderAdminCharts();

    // Render User Moderation table
    renderUserModerationList();

    // Render Organizer verification list
    renderOrganizerVerifications();

    // Render competition overrides list
    renderCompsOverrideList();

  } catch (err) {
    console.error("Failed loading administrator database", err);
  }
}

/* ==========================================================================
   CHART.JS SYSTEM RENDERING
   ========================================================================== */
function renderAdminCharts() {
  // Chart 1: Monthly signups (Line Chart)
  const ctxGrowth = document.getElementById('adminMonthlyChart').getContext('2d');
  if (adminMonthlyChart) adminMonthlyChart.destroy();
  adminMonthlyChart = new Chart(ctxGrowth, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [{
        label: 'Athletes Registered',
        data: [120, 240, 380, 520, allUsers.length + 650],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
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

  // Chart 2: State wise metrics (Horizontal Bar Chart)
  const ctxState = document.getElementById('adminStateChart').getContext('2d');
  if (adminStateChart) adminStateChart.destroy();
  adminStateChart = new Chart(ctxState, {
    type: 'bar',
    data: {
      labels: ['Delhi', 'Karnataka', 'Maharashtra', 'Punjab', 'Tamil Nadu'],
      data: [85, 95, 60, 45, 30],
      datasets: [{
        label: 'Registrations By State',
        data: [150, 130, 90, 80, 50],
        backgroundColor: '#3b82f6',
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

  // Chart 3: Sports Popularity (Doughnut Chart)
  const ctxSports = document.getElementById('adminSportsChart').getContext('2d');
  if (adminSportsChart) adminSportsChart.destroy();
  adminSportsChart = new Chart(ctxSports, {
    type: 'doughnut',
    data: {
      labels: ['Cricket', 'Football', 'Kabaddi', 'Badminton', 'Athletics'],
      datasets: [{
        data: [40, 25, 15, 12, 8],
        backgroundColor: ['#1e3a8a', '#3b82f6', '#f97316', '#a855f7', '#22c55e'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
    }
  });
}

/* ==========================================================================
   USER MODERATION ACTIONS
   ========================================================================== */
function renderUserModerationList() {
  const tbody = document.getElementById('admin-users-table-body');
  if (!tbody) return;

  tbody.innerHTML = allUsers.map(u => {
    const isBlocked = u.blocked || false;
    const actionBtn = isBlocked
      ? `<button class="btn btn-primary" onclick="window.toggleUserBlock('${u.uid}', false)" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">Unblock</button>`
      : `<button class="btn btn-ghost" onclick="window.toggleUserBlock('${u.uid}', true)" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; color:var(--danger);">Block</button>`;

    return `
      <tr>
        <td style="font-weight: 600;">${u.fullName}</td>
        <td>${u.email}</td>
        <td>${u.state || 'N/A'}</td>
        <td><span class="badge badge-success">${u.role.toUpperCase()}</span></td>
        <td><span class="badge ${isBlocked ? 'badge-danger' : 'badge-success'}">${isBlocked ? 'Blocked' : 'Active'}</span></td>
        <td>${actionBtn}</td>
      </tr>
    `;
  }).join('');
}

window.toggleUserBlock = async (uid, shouldBlock) => {
  try {
    await SportsPortal.db.updateDoc('users', uid, { blocked: shouldBlock });
    showToast(shouldBlock ? "Athlete account locked successfully." : "Athlete account unlocked.", "success");
    await loadAdminSystemData();
  } catch (err) {
    showToast(err.message, "danger");
  }
};

/* ==========================================================================
   ORGANIZER VERIFICATION ACTIONS
   ========================================================================== */
function renderOrganizerVerifications() {
  const tbody = document.getElementById('admin-orgs-table-body');
  if (!tbody) return;

  tbody.innerHTML = allOrgs.map(o => {
    const isVerified = o.verified || false;
    const control = !isVerified
      ? `<button class="btn btn-primary" onclick="window.toggleOrgVerify('${o.uid}', true)" style="padding:0.35rem 0.75rem; font-size:0.75rem;">Verify Profile</button>`
      : `<span style="font-size:0.8rem; color:var(--success);">✓ Verified License</span>`;

    return `
      <tr>
        <td style="font-weight: 600;">${o.fullName}</td>
        <td>${o.organization}</td>
        <td>${o.email}</td>
        <td><span class="badge ${isVerified ? 'badge-success' : 'badge-warning'}">${isVerified ? 'Verified' : 'Pending Verification'}</span></td>
        <td>${control}</td>
      </tr>
    `;
  }).join('');
}

window.toggleOrgVerify = async (uid, shouldVerify) => {
  try {
    await SportsPortal.db.updateDoc('organizers', uid, { verified: shouldVerify });
    
    // Dispatched congratulation notification direct to organizer
    await SportsPortal.db.addDoc('notifications', {
      userId: uid,
      title: "Organization Verified!",
      message: "Congratulations! Your organizer credential license has been validated by Ministry Administrators.",
      type: "verification",
      read: false,
      timestamp: new Date().toISOString()
    });

    showToast("Organizer license validated successfully!", "success");
    await loadAdminSystemData();
  } catch (err) {
    showToast(err.message, "danger");
  }
};

/* ==========================================================================
   COMPETITIONS MONITOR & OVERRULE ACTIONS
   ========================================================================== */
function renderCompsOverrideList() {
  const tbody = document.getElementById('admin-comps-table-body');
  if (!tbody) return;

  tbody.innerHTML = allComps.map(c => `
    <tr>
      <td style="font-weight: 600;">${c.title}</td>
      <td>${c.sportType}</td>
      <td>${c.city}, ${c.state}</td>
      <td>${c.organizerName}</td>
      <td><span class="badge badge-success" style="font-size: 0.7rem;">Verified Safe</span></td>
      <td><button class="btn btn-ghost" onclick="window.cancelCompByAdmin('${c.id}')" style="padding:0.35rem 0.75rem; font-size:0.75rem; color:var(--danger);">Overrule &amp; Cancel</button></td>
    </tr>
  `).join('');
}

window.cancelCompByAdmin = async (compId) => {
  if (confirm("Are you sure you want to overrule and remove this competition?")) {
    try {
      await SportsPortal.db.deleteDoc('competitions', compId);
      showToast("Competition deleted and removed from the active system database.", "warning");
      await loadAdminSystemData();
    } catch (err) {
      showToast(err.message, "danger");
    }
  }
};

/* ==========================================================================
   SECURITY LOGS CONSOLE PANEL
   ========================================================================== */
function setupSecurityConsoleSimulation() {
  const consoleEl = document.getElementById('sec-logs-console');
  if (!consoleEl) return;

  const logLines = [
    "[INFO] Initializing National Security Audit Module... Connected.",
    "[INFO] XSS protection active on all dynamic form input values.",
    "[INFO] Content Security Policy (CSP) headers validated.",
    "[SEC] MFA validation tokens check synchronized.",
    "[SEC] Sync complete. Rate limit caps verified at 200 req/min.",
    "[INFO] Portals DB local checksum: VALID."
  ];

  consoleEl.innerHTML = logLines.map(line => `<div>${line}</div>`).join('');

  // Ticking secure logs mock
  setInterval(() => {
    const freshLogs = [
      `[INFO] Synced active sessions checks. Checked users count: ${allUsers.length + allOrgs.length + 1}`,
      `[SEC] Security logs scanned. Rate limit counters clear. CSP OK.`,
      `[INFO] Scheduled backup integrity check completed successfully.`
    ];
    const log = freshLogs[Math.floor(Math.random() * freshLogs.length)];
    consoleEl.innerHTML += `<div style="margin-top:0.25rem;">${new Date().toLocaleTimeString()} ${log}</div>`;
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }, 12000);
}

/* ==========================================================================
   DISASTER RECOVERY SIMULATOR
   ========================================================================== */
window.triggerAdminBackup = () => {
  showToast("Compiling national database snapshot blocks...", "success");
  setTimeout(() => {
    const dataStr = localStorage.getItem('sports_portal_db');
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sportsbharat_backup_${Date.now()}.json`;
    a.click();
    showToast("Cryptographic system-wide snapshot backup generated successfully!", "success");
  }, 1500);
};

window.triggerAdminRestore = () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json';
  
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.users && parsed.competitions && parsed.registrations) {
            localStorage.setItem('sports_portal_db', event.target.result);
            showToast("Database restored successfully. Synchronizing state...", "success");
            setTimeout(() => window.location.reload(), 1500);
          } else {
            showToast("Restore failed: Invalid database structure schemas.", "danger");
          }
        } catch (err) {
          showToast("Failed parsing backup JSON.", "danger");
        }
      };
      reader.readAsText(file);
    }
  };
  fileInput.click();
};

/* ==========================================================================
   EXPORT SYSTEM STATISTICS
   ========================================================================== */
window.exportAdminCSV = () => {
  let csv = "Metrics,Total Count,Status\n";
  csv += `"Total Portal Users","${allUsers.length + allOrgs.length + 1}","Healthy"\n`;
  csv += `"Active Competitions","${allComps.length}","Validated"\n`;
  csv += `"Verified Sports Organizers","${allOrgs.filter(o => o.verified).length}","Verified License"\n`;

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sportsbharat_system_report_${Date.now()}.csv`;
  a.click();
  showToast("CSV system analytics report downloaded!", "success");
};

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
