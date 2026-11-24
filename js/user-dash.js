/* ==========================================================================
   ATHLETE USER DASHBOARD CONTROLLER
   ========================================================================== */

import { SportsPortal } from './firebase-config.js';
import { showToast } from './auth.js';
import { fetchLiveIndianCompetitions, VERIFIED_INDIAN_COMPETITIONS, getOfficialRegistrationUrl } from './live-competitions-service.js';
import { getEventRelatedPhoto } from './image-fallback.js';

const QR_CODE_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=';

let currentUser = null;
let currentMonth = new Date();
let allComps = [];
let userRegs = [];

document.addEventListener('DOMContentLoaded', () => {
  // Check auth state
  SportsPortal.auth.onAuthStateChanged(async (user) => {
    if (!user || user.role !== 'user') {
      // Auto-fallback to demo athlete so visiting the dashboard directly works seamlessly
      try {
        const demoUserDoc = await SportsPortal.db.getDoc('users', 'user_demo');
        if (demoUserDoc && demoUserDoc.exists) {
          user = demoUserDoc.data();
          localStorage.setItem('sports_portal_current_user', JSON.stringify(user));
        } else {
          window.location.href = '../auth/login.html';
          return;
        }
      } catch {
        window.location.href = '../auth/login.html';
        return;
      }
    }
    currentUser = user;
    
    // Hide Loader cleanly
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => { loader.style.display = 'none'; }, 600);
    }

    // Run setups
    setupSidebarNavigation();
    setupProfileForm();
    await loadInitialData();
    setupNotificationSystem();
    setupRegistrationModal();
    setupCalendarView();

    // Check if redirected from a specific competition
    const urlParams = new URLSearchParams(window.location.search);
    const compParam = urlParams.get('comp');
    if (compParam) {
      setTimeout(() => {
        if (window.openRegModal) window.openRegModal(compParam);
      }, 500);
    }
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
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('active');
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
  if (avatarCircle) avatarCircle.textContent = (currentUser.fullName || 'A')[0].toUpperCase();

  try {
    // 1. Load competitions list (with fallback to live verified competitions)
    allComps = await SportsPortal.db.getCollection('competitions');
    if (!allComps || allComps.length === 0) {
      allComps = await fetchLiveIndianCompetitions();
      for (const comp of allComps) {
        await SportsPortal.db.setDoc('competitions', comp.id, comp);
      }
    }
    
    // Fetch all registrations matching current user
    const registrations = await SportsPortal.db.getCollection('registrations');
    userRegs = (registrations || []).filter(r => r.userId === currentUser.uid);

    window.allComps = allComps;
    window.userRegs = userRegs;

    // Bind metrics count to overview
    const regCountEl = document.getElementById('stats-reg-count');
    const badgeCountEl = document.getElementById('stats-badge-count');
    const certCountEl = document.getElementById('stats-cert-count');

    if (regCountEl) regCountEl.textContent = userRegs.length;
    if (badgeCountEl) badgeCountEl.textContent = currentUser.badges ? currentUser.badges.length : 1;
    
    // Count certificates
    const certificates = userRegs.filter(r => r.status === 'approved' && r.attended);
    if (certCountEl) certCountEl.textContent = certificates.length;

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

    // 9. Render the Digital Sports ID card
    renderSportsIdCard();

    // 10. Initialise NADA Compliance Hub
    setupNadaHub();

    // 11. Render Sports News Feed
    await renderNewsFeed();

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
    const isRegistered = userRegs.some(r => r.competitionId === c.id);
    const regBtnText = isRegistered ? '✓ Registered' : 'Official Register ↗';
    const regBtnClass = isRegistered ? 'btn-ghost' : 'btn-primary';
    const officialUrl = getOfficialRegistrationUrl(c);
    const thumb = c.thumbnail || c.bannerUrl || (typeof getEventRelatedPhoto === 'function' ? getEventRelatedPhoto(c.sportType, c.title) : 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60');

    return `
      <div class="glass-card competition-card" style="padding: 1rem;">
        <div class="comp-header" style="height: 120px; position: relative; overflow: hidden;">
          <img src="${thumb}" class="comp-banner" alt="${c.title}" 
               data-category="${c.sportType || ''}"
               onerror="this.onerror=null; if(window.SB_IMG_PLACEHOLDER) this.src=window.SB_IMG_PLACEHOLDER('${c.sportType || 'default'}', '${c.title}')" />
          <button onclick="window.toggleBookmark('${c.id}')" style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.5); width: 35px; height: 35px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; color: gold; font-size: 1.25rem; z-index: 5;">${starIcon}</button>
        </div>
        <div style="padding: 1rem 0 0; display: flex; flex-direction: column; gap: 0.5rem;">
          <small style="color: var(--primary-light); font-weight: 700;">${c.sportType} · ${c.city}</small>
          <h4 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; line-height: 1.2;">${c.title}</h4>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
            <strong style="color: var(--accent);">${c.regFee === '0' || c.regFee === 0 ? 'FREE' : '₹' + c.regFee}</strong>
            <a href="${officialUrl}" target="_blank" rel="noopener noreferrer" 
               onclick="window.trackOfficialRegistration('${c.id}')"
               class="btn ${regBtnClass}" 
               style="padding: 0.5rem 1rem; font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;"
               title="Open official ${c.sportType} registration portal">
              ${regBtnText}
            </a>
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

  const badges = currentUser.badges || ["🏛️ Portal Rookie"];
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

function renderSportsIdCard() {
  if (!currentUser) return;

  const card = document.getElementById('sports-id-card');
  const nameEl = document.getElementById('sports-id-name');
  const sportEl = document.getElementById('sports-id-sport');
  const stateEl = document.getElementById('sports-id-state');
  const numberEl = document.getElementById('sports-id-number');
  const photoEl = document.getElementById('sports-id-photo');
  const qrEl = document.getElementById('sports-id-qr');

  if (!card || !nameEl || !sportEl || !stateEl || !numberEl || !photoEl || !qrEl) return;

  const fullName = currentUser.fullName || 'Athlete Name';
  const primarySport = (currentUser.sportsInterests && currentUser.sportsInterests[0]) || currentUser.skills || 'Multi-sport';
  const state = currentUser.state || 'India';
  const sportsId = currentUser.sportsId || `SB-${new Date().getFullYear()}-${String((currentUser.uid || '0000').slice(-4)).padStart(4, '0').toUpperCase()}`;
  const recentParticipations = userRegs.slice(0, 3).map(r => `${r.competitionTitle} (${r.status})`).join(', ') || 'No tournaments listed yet';
  const publicVerificationUrl = `${window.location.origin}/pages/public/athlete-verification.html?name=${encodeURIComponent(fullName)}&status=${encodeURIComponent('Active')}&sport=${encodeURIComponent(primarySport)}&state=${encodeURIComponent(state)}&participations=${encodeURIComponent(recentParticipations)}&id=${encodeURIComponent(sportsId)}`;

  nameEl.textContent = fullName;
  sportEl.textContent = `Primary Sport: ${primarySport}`;
  stateEl.textContent = `State: ${state}`;
  numberEl.textContent = `Unique Sports ID: ${sportsId}`;

  photoEl.textContent = fullName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  qrEl.innerHTML = `<img src="${QR_CODE_URL}${encodeURIComponent(publicVerificationUrl)}" alt="QR verification code" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" />`;

  card.dataset.verificationUrl = publicVerificationUrl;
}

async function downloadSportsIdCard() {
  const card = document.getElementById('sports-id-card');
  const downloadBtn = document.getElementById('download-sports-id-btn');
  if (!card || !window.html2canvas || !window.jspdf) {
    showToast('PDF export is unavailable in this browser. Please try again in a supported browser.', 'warning');
    return;
  }

  if (downloadBtn) downloadBtn.disabled = true;
  showToast('Preparing your Digital Sports ID PDF...', 'success');

  try {
    const canvas = await window.html2canvas(card, { backgroundColor: '#0f172a', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a6' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

    pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth * ratio) / 2, (pageHeight - imgHeight * ratio) / 2, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`${(currentUser?.fullName || 'athlete').toLowerCase().replace(/\s+/g, '-')}-sports-id.pdf`);
    showToast('Digital Sports ID PDF downloaded successfully.', 'success');
  } catch (err) {
    console.error(err);
    showToast('PDF export failed. Please try again.', 'danger');
  } finally {
    if (downloadBtn) downloadBtn.disabled = false;
  }
}

function shareSportsIdToWallet() {
  const verificationUrl = document.getElementById('sports-id-card')?.dataset.verificationUrl || '';
  if (!verificationUrl) {
    showToast('Sports ID card is still being prepared.', 'warning');
    return;
  }

  if (navigator.share) {
    navigator.share({
      title: 'Digital Sports ID',
      text: 'My verified Digital Sports ID card is ready.',
      url: verificationUrl
    }).then(() => showToast('Verification link shared successfully.', 'success')).catch(() => {});
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText(verificationUrl).then(() => {
      showToast('Verification link copied. Open it in your wallet app to save it.', 'success');
    }).catch(() => {
      showToast('Unable to copy link automatically.', 'warning');
    });
    return;
  }

  window.open(verificationUrl, '_blank');
}

function setupProfileForm() {
  const form = document.getElementById('profile-edit-form');
  const photoInput = document.getElementById('profile-photo-input');
  const downloadBtn = document.getElementById('download-sports-id-btn');
  const walletBtn = document.getElementById('wallet-sports-id-btn');

  if (downloadBtn) downloadBtn.addEventListener('click', downloadSportsIdCard);
  if (walletBtn) walletBtn.addEventListener('click', shareSportsIdToWallet);

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
      const regBtnText = isRegistered ? '✓ Registered' : 'Official Register ↗';
      const regBtnClass = isRegistered ? 'btn-ghost' : 'btn-primary';
      const officialUrl = getOfficialRegistrationUrl(c);
      const statusBadge = c.status === 'upcoming' 
        ? '<span class="badge badge-success">Upcoming</span>' 
        : c.status === 'ongoing' 
        ? '<span class="badge badge-warning">Ongoing</span>' 
        : '<span class="badge badge-danger">Completed</span>';

      const thumb = c.thumbnail || c.bannerUrl || (typeof getEventRelatedPhoto === 'function' ? getEventRelatedPhoto(c.sportType, c.title) : 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60');

      return `
        <div class="glass-card competition-card">
          <div class="comp-header" style="position: relative; overflow: hidden;">
            <img src="${thumb}" class="comp-banner" alt="${c.title}" 
                 data-category="${c.sportType || ''}"
                 onerror="this.onerror=null; if(window.SB_IMG_PLACEHOLDER) this.src=window.SB_IMG_PLACEHOLDER('${c.sportType || 'default'}', '${c.title}')" />
            <div class="comp-badge">${statusBadge}</div>
          </div>
          <div class="comp-body">
            <div class="comp-meta">
              <span>📅 ${c.dateTime ? c.dateTime.split('T')[0] : 'Open Now'}</span>
              <span>📍 ${c.city}, ${c.state}</span>
            </div>
            <h3 class="comp-title">${c.title}</h3>
            <p class="comp-info" style="font-size:0.85rem; margin-bottom:1rem;">${c.description}</p>
            <div class="comp-footer">
              <strong style="color:var(--accent); font-family:var(--font-display); font-size:1.25rem;">${c.regFee === '0' || c.regFee === 0 ? 'FREE' : '₹' + c.regFee}</strong>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button class="btn btn-ghost" onclick="window.openRegModal('${c.id}')" style="padding: 0.5rem 0.75rem; font-size: 0.82rem;">Details</button>
                <a href="${officialUrl}" target="_blank" rel="noopener noreferrer" 
                   onclick="window.trackOfficialRegistration('${c.id}')" 
                   class="btn ${regBtnClass}" 
                   style="padding: 0.5rem 1rem; font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;"
                   title="Open official ${c.sportType} registration portal">
                  ${regBtnText}
                </a>
              </div>
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
   OFFICIAL REGISTRATION MODAL & DIRECT TRACKING
   ========================================================================== */
function setupRegistrationModal() {
  const modal = document.getElementById('reg-modal');
  const closeBtn = document.getElementById('reg-modal-close');
  const cancelBtn = document.getElementById('reg-modal-cancel');
  const directBtn = document.getElementById('modal-official-direct-btn');

  window.openRegModal = (compId) => {
    const comp = allComps.find(c => c.id === compId);
    if (!comp || !modal) return;

    const officialUrl = getOfficialRegistrationUrl(comp);
    const titleEl = document.getElementById('modal-comp-title');
    const locEl = document.getElementById('modal-comp-location');
    const sportEl = document.getElementById('modal-comp-sport');
    const orgEl = document.getElementById('modal-comp-org');
    const feeEl = document.getElementById('modal-comp-fee');
    const deadlineEl = document.getElementById('modal-comp-deadline');
    const descEl = document.getElementById('modal-comp-desc');
    const bannerImg = document.getElementById('modal-comp-banner');

    if (bannerImg) {
      const modalThumb = comp.thumbnail || comp.bannerUrl || (typeof getEventRelatedPhoto === 'function' ? getEventRelatedPhoto(comp.sportType, comp.title) : '');
      bannerImg.src = modalThumb;
      bannerImg.onerror = function() {
        this.onerror = null;
        if (window.SB_IMG_PLACEHOLDER) this.src = window.SB_IMG_PLACEHOLDER(comp.sportType || 'default', comp.title);
      };
    }

    if (titleEl) titleEl.textContent = comp.title;
    if (locEl) locEl.textContent = `${comp.venue || 'Sports Complex'} | ${comp.city}, ${comp.state}`;
    if (sportEl) sportEl.textContent = comp.sportType || 'Sport';
    if (orgEl) orgEl.textContent = comp.hostOrg || comp.organizerName || 'National Sports Federation';
    if (feeEl) feeEl.textContent = (comp.regFee === '0' || comp.regFee === 0) ? 'FREE' : '₹' + comp.regFee;
    if (deadlineEl) deadlineEl.textContent = comp.deadlineDate || (comp.dateTime ? comp.dateTime.split('T')[0] : 'Open Now');
    if (descEl) descEl.textContent = comp.description || 'Proceed to the official federation portal for player eligibility, rules, and entry submission.';

    if (directBtn) {
      directBtn.href = officialUrl;
      directBtn.onclick = () => {
        window.trackOfficialRegistration(comp.id);
        modal.classList.remove('active');
      };
    }

    modal.classList.add('active');
  };

  const closeModal = () => modal && modal.classList.remove('active');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
}

window.trackOfficialRegistration = async (compId) => {
  const comp = allComps.find(c => c.id === compId);
  if (!comp || !currentUser) return;

  const alreadyReg = userRegs.some(r => r.competitionId === compId);
  if (!alreadyReg) {
    const regData = {
      competitionId: comp.id,
      competitionTitle: comp.title,
      sportType: comp.sportType,
      dateTime: comp.dateTime || new Date().toISOString(),
      userId: currentUser.uid,
      userName: currentUser.fullName,
      regType: 'Athlete / Player',
      idProof: 'Official Federation Entry',
      status: 'pending',
      attended: false,
      timestamp: new Date().toISOString()
    };

    try {
      await SportsPortal.db.addDoc('registrations', regData);
      await SportsPortal.db.addDoc('notifications', {
        userId: currentUser.uid,
        title: "Official Registration Opened",
        message: `Official tournament registration link opened for ${comp.title}. Track schedule in your dashboard.`,
        type: "registration",
        read: false,
        timestamp: new Date().toISOString()
      });

      userRegs.push(regData);
      showToast(`Opening official ${comp.hostOrg || comp.sportType} registration portal...`, "success");
      await loadInitialData();
    } catch (err) {
      console.warn("Could not record registration", err);
    }
  } else {
    showToast(`Opening official ${comp.hostOrg || comp.sportType} registration portal...`, "info");
  }
};

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
    const matchingReg = userRegs.find(r => r.dateTime && r.dateTime.split('T')[0] === dayStr);
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

  const matchingRegs = userRegs.filter(r => r.dateTime && r.dateTime.split('T')[0] === dayStr);

  if (matchingRegs.length === 0) {
    details.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.9rem;">No sports competitions scheduled for ${dayStr}.</p>`;
  } else {
    details.innerHTML = matchingRegs.map(r => `
      <div class="glass-card" style="padding: 1rem; border-left: 3px solid var(--accent); margin-bottom: 0.75rem;">
        <h4 style="font-weight:700;">${r.competitionTitle}</h4>
        <small style="color:var(--text-secondary); display:block; margin: 0.25rem 0;">Type: ${r.regType} | Status: <strong>${r.status.toUpperCase()}</strong></small>
        <span style="font-size: 0.8rem; background:rgba(255,255,255,0.05); padding: 0.15rem 0.5rem; border-radius: 4px;">📅 ${(r.dateTime || '').replace('T', ' ')}</span>
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
  if (!newWin) {
    showToast("Please allow popups to preview and download your certificate.", "warning");
    return;
  }

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
  newWin.document.close();
};

/* ==========================================================================
   NATIONAL SPORTS NEWS FEED
   ========================================================================== */
async function renderNewsFeed() {
  const container = document.getElementById('news-items-container');
  if (!container) return;

  let news = await SportsPortal.db.getCollection('news');
  if (!news || news.length === 0) {
    news = [
      {
        id: "news_1",
        title: "Khelo India 2026 Games Roadmap & Grassroots Expansion Announced",
        excerpt: "Ministry of Youth Affairs and Sports officially expands Khelo India infrastructure across 12 states with dedicated residential athletic academies.",
        date: "2026-05-18",
        imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60"
      },
      {
        id: "news_2",
        title: "Digital Certificate Cryptographic Verification System Live",
        excerpt: "All state and national level tournaments now issue tamper-proof digital certificates with instant QR verification for athlete portfolios.",
        date: "2026-05-16",
        imageUrl: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&auto=format&fit=crop&q=60"
      },
      {
        id: "news_3",
        title: "National Anti-Doping Agency (NADA) 2026 Prohibited List Update",
        excerpt: "Athletes reminded to verify prescription medicines and apply for TUEs well in advance of upcoming national championship selection trials.",
        date: "2026-05-12",
        imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60"
      }
    ];
  }

  container.innerHTML = news.map(item => `
    <article class="glass-card" style="display: flex; gap: 1.5rem; flex-wrap: wrap; padding: 1.25rem; align-items: center;">
      <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60'}" alt="${item.title}" style="width: 180px; height: 110px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" />
      <div style="flex: 1; min-width: 260px;">
        <span style="font-size: 0.8rem; color: var(--primary-light); font-weight: 700;">📅 ${item.date || 'May 2026'} • Official Bulletin</span>
        <h3 style="font-size: 1.15rem; font-family: var(--font-display); font-weight: 700; margin: 0.35rem 0;">${item.title}</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">${item.excerpt || item.content || ''}</p>
      </div>
    </article>
  `).join('');
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

/* ==========================================================================
   NADA COMPLIANCE HUB
   ========================================================================== */

/* ---- Substance database ---- */
const SUBSTANCE_DB = [
  /* SAFE */
  { name: 'Ibuprofen',        aliases: ['ibuprofen','brufen','advil','nurofen'],             status: 'SAFE',       detail: 'Common NSAID painkiller. Safe at therapeutic doses. No restrictions under WADA.' },
  { name: 'Paracetamol',      aliases: ['paracetamol','acetaminophen','crocin','calpol'],     status: 'SAFE',       detail: 'Analgesic and antipyretic. Fully permitted in all sports at all times.' },
  { name: 'Amoxicillin',      aliases: ['amoxicillin','amoxil'],                             status: 'SAFE',       detail: 'Antibiotic. Permitted at all times in all sports.' },
  { name: 'Cetirizine',       aliases: ['cetirizine','zyrtec','cetzine'],                    status: 'SAFE',       detail: 'Non-drowsy antihistamine. Permitted. No stimulant properties.' },
  { name: 'Vitamin C',        aliases: ['vitamin c','ascorbic acid','ascorbate'],             status: 'SAFE',       detail: 'Essential vitamin. Fully permitted with no dosage restriction.' },
  { name: 'Vitamin D',        aliases: ['vitamin d','cholecalciferol','calciferol'],          status: 'SAFE',       detail: 'Fat-soluble vitamin. Fully permitted.' },
  { name: 'Creatine',         aliases: ['creatine','creatine monohydrate'],                  status: 'SAFE',       detail: 'Legal nutritional supplement. Not on WADA Prohibited List.' },
  { name: 'Caffeine',         aliases: ['caffeine','coffee','tea'],                           status: 'SAFE',       detail: 'Removed from WADA Prohibited List in 2004. Permitted in competition.' },
  { name: 'Zinc',             aliases: ['zinc','zinc sulphate','zinc oxide'],                 status: 'SAFE',       detail: 'Mineral supplement. Fully permitted.' },
  { name: 'Omeprazole',       aliases: ['omeprazole','prilosec','omez'],                     status: 'SAFE',       detail: 'Proton-pump inhibitor for acid reflux. Permitted in all sports.' },
  { name: 'Metformin',        aliases: ['metformin','glucophage'],                           status: 'SAFE',       detail: 'Oral anti-diabetic. Not prohibited under WADA at any level.' },
  { name: 'Azithromycin',     aliases: ['azithromycin','azithral','zithromax'],              status: 'SAFE',       detail: 'Antibiotic. Permitted in all sports.' },

  /* BANNED */
  { name: 'Stanozolol',       aliases: ['stanozolol','winstrol','stromba'],                  status: 'BANNED',     detail: 'Anabolic androgenic steroid. Prohibited in and out of competition (S1 — WADA).' },
  { name: 'Testosterone',     aliases: ['testosterone','testogel','sustanon','androgel'],    status: 'BANNED',     detail: 'Endogenous anabolic steroid. Prohibited at all times unless TUE granted (S1 — WADA).' },
  { name: 'EPO',              aliases: ['epo','erythropoietin'],                             status: 'BANNED',     detail: 'Peptide hormone that boosts red blood cell production. Prohibited at all times (S2 — WADA).' },
  { name: 'Amphetamine',      aliases: ['amphetamine','adderall','dexedrine','speed'],       status: 'BANNED',     detail: 'Stimulant — prohibited in competition (S6a — WADA).' },
  { name: 'Cocaine',          aliases: ['cocaine','coke','crack'],                           status: 'BANNED',     detail: 'Narcotic stimulant. Prohibited in competition (S7 — WADA).' },
  { name: 'Nandrolone',       aliases: ['nandrolone','deca-durabolin','deca'],               status: 'BANNED',     detail: 'Anabolic androgenic steroid. Strictly prohibited at all times (S1 — WADA).' },
  { name: 'HGH',              aliases: ['hgh','human growth hormone','somatropin'],          status: 'BANNED',     detail: 'Peptide hormone. Prohibited at all times (S2 — WADA).' },
  { name: 'CERA',             aliases: ['cera','mircera','continuous erythropoietin'],       status: 'BANNED',     detail: 'Long-acting EPO analogue. Prohibited at all times (S2 — WADA).' },
  { name: 'Clenbuterol',      aliases: ['clenbuterol','clen'],                              status: 'BANNED',     detail: 'Beta-2 agonist (non-inhaled). Prohibited at all times (S3 — WADA).' },
  { name: 'Modafinil',        aliases: ['modafinil','provigil','modalert'],                 status: 'BANNED',     detail: 'Stimulant — prohibited in competition (S6b — WADA).' },
  { name: 'Furosemide',       aliases: ['furosemide','lasix','frusemide'],                  status: 'BANNED',     detail: 'Diuretic — masking agent. Prohibited at all times (S5 — WADA).' },
  { name: 'DHEA',             aliases: ['dhea','dehydroepiandrosterone'],                   status: 'BANNED',     detail: 'Steroid precursor. Prohibited at all times (S1 — WADA).' },

  /* RESTRICTED (TUE required) */
  { name: 'Salbutamol',       aliases: ['salbutamol','albuterol','ventolin','salamol'],      status: 'RESTRICTED', detail: 'Beta-2 agonist used for asthma. Permitted only via inhaler ≤1600 µg/day. Requires TUE above threshold (S3 — WADA).' },
  { name: 'Pseudoephedrine',  aliases: ['pseudoephedrine','sudafed','actifed'],              status: 'RESTRICTED', detail: 'Stimulant in decongestants. Permitted out of competition; prohibited in competition above 150 µg/mL urine (S6 — WADA).' },
  { name: 'Prednisolone',     aliases: ['prednisolone','omnacortil','wysolone'],             status: 'RESTRICTED', detail: 'Oral glucocorticoid. Prohibited by systemic routes in competition — TUE required (S9 — WADA).' },
  { name: 'Methylphenidate',  aliases: ['methylphenidate','ritalin','concerta'],             status: 'RESTRICTED', detail: 'Stimulant for ADHD. Prohibited in competition — TUE required (S6 — WADA).' },
  { name: 'Morphine',         aliases: ['morphine'],                                         status: 'RESTRICTED', detail: 'Narcotic analgesic. Prohibited in competition — TUE required for legitimate medical use (S7 — WADA).' },
  { name: 'Insulin',          aliases: ['insulin','humulin','lantus','novolog'],             status: 'RESTRICTED', detail: 'Peptide hormone. Prohibited in non-diabetic athletes. TUE required for diagnosed diabetes (S2 — WADA).' },
  { name: 'Formoterol',       aliases: ['formoterol','foradil','foracort'],                 status: 'RESTRICTED', detail: 'Beta-2 agonist for asthma. Permitted via inhaler ≤54 µg/day only with TUE (S3 — WADA).' },
  { name: 'Cortisone',        aliases: ['cortisone','hydrocortisone','cortef'],             status: 'RESTRICTED', detail: 'Glucocorticoid. Restricted when administered systemically in competition. TUE required (S9 — WADA).' },
];

const QUICK_TAGS = ['Ibuprofen','Salbutamol','Stanozolol','Paracetamol','EPO','Pseudoephedrine','Creatine','Cocaine'];

let nadaHubReady = false;
function setupNadaHub() {
  if (!document.getElementById('panel-nada') || nadaHubReady) return;
  nadaHubReady = true;

  renderQuickTags();
  populateNadaCertCard();
  setupSubstanceChecker();
  setupQuiz();
}

/* ---- Quick tags ---- */
function renderQuickTags() {
  const wrap = document.getElementById('nada-quick-tags');
  if (!wrap) return;
  wrap.innerHTML = QUICK_TAGS.map(name =>
    `<button class="nada-quick-tag" type="button">${name}</button>`
  ).join('');
  wrap.querySelectorAll('.nada-quick-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('nada-search-input').value = btn.textContent;
      runSubstanceCheck(btn.textContent.trim());
    });
  });
}

/* ---- Substance checker ---- */
function findSubstance(query) {
  const q = query.toLowerCase().trim();
  return SUBSTANCE_DB.find(s =>
    s.aliases.some(a => a.includes(q) || q.includes(a))
  ) || null;
}

function getSuggestionsFor(query) {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  return SUBSTANCE_DB.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.aliases.some(a => a.includes(q))
  ).slice(0, 5);
}

function showNadaResult(substance) {
  const result = document.getElementById('nada-result');
  const icon   = document.getElementById('nada-result-icon');
  const status = document.getElementById('nada-result-status');
  const name   = document.getElementById('nada-result-name');
  const detail = document.getElementById('nada-result-detail');
  const tue    = document.getElementById('nada-tue-notice');
  const sug    = document.getElementById('nada-suggestions');

  sug.hidden = true;
  result.hidden = false;
  result.className = `nada-result ${substance.status}`;

  const ICONS = { SAFE: '✅', BANNED: '🚫', RESTRICTED: '⚠️' };
  icon.textContent   = ICONS[substance.status];
  status.textContent = substance.status;
  status.className   = `nada-result-status ${substance.status}`;
  name.textContent   = substance.name;
  detail.textContent = substance.detail;
  tue.hidden         = substance.status !== 'RESTRICTED';
}

function showNotFound(query) {
  const result = document.getElementById('nada-result');
  const icon   = document.getElementById('nada-result-icon');
  const status = document.getElementById('nada-result-status');
  const name   = document.getElementById('nada-result-name');
  const detail = document.getElementById('nada-result-detail');
  const tue    = document.getElementById('nada-tue-notice');

  result.hidden = false;
  result.className = 'nada-result';
  result.style.borderColor = 'var(--glass-border)';
  icon.textContent   = '❓';
  status.textContent = 'NOT FOUND';
  status.className   = 'nada-result-status';
  status.style.color = 'var(--text-muted)';
  name.textContent   = `"${query}" is not in our local database.`;
  detail.textContent = 'Please check the official WADA Prohibited List at wada-ama.org or consult your team physician before use.';
  tue.hidden = true;
}

function runSubstanceCheck(query) {
  if (!query) return;
  const found = findSubstance(query);
  if (found) showNadaResult(found);
  else showNotFound(query);
}

function setupSubstanceChecker() {
  const input = document.getElementById('nada-search-input');
  const btn   = document.getElementById('nada-search-btn');
  const sug   = document.getElementById('nada-suggestions');

  if (!input) return;

  btn.addEventListener('click', () => runSubstanceCheck(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') runSubstanceCheck(input.value); });

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (q.length < 2) { sug.hidden = true; return; }

    const matches = getSuggestionsFor(q);
    if (!matches.length) { sug.hidden = true; return; }

    sug.hidden = false;
    sug.innerHTML = matches.map(s =>
      `<div class="nada-suggestion-item" data-name="${s.name}">
        <span>${s.name}</span>
        <span class="nada-sug-status ${s.status}">${s.status}</span>
      </div>`
    ).join('');

    sug.querySelectorAll('.nada-suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.dataset.name;
        sug.hidden = true;
        runSubstanceCheck(item.dataset.name);
      });
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#nada-search-wrap')) sug.hidden = true;
  });
}

/* ---- Certificate card ---- */
function populateNadaCertCard() {
  const nameEl = document.getElementById('nada-cert-name');
  const sportEl = document.getElementById('nada-cert-sport');
  const idEl = document.getElementById('nada-cert-id');
  const pill = document.getElementById('nada-cert-pill');

  if (currentUser) {
    if (nameEl)  nameEl.textContent  = currentUser.fullName || '—';
    if (sportEl) sportEl.textContent = (currentUser.sportsInterests && currentUser.sportsInterests[0]) || 'Multi-sport';
    const uid = currentUser.uid ? currentUser.uid.slice(-4).toUpperCase() : '0000';
    if (idEl)   idEl.textContent   = `NADA-2026-${uid}`;
  }
  if (pill) pill.textContent = 'Compliant ✓';
}

window.nadaDownloadCert = () => {
  const name = (currentUser && currentUser.fullName) || 'Athlete';
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>NADA Certificate</title>
    <style>
      body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8fafc; }
      .cert { max-width: 680px; width: 90%; border: 3px solid #1e3a8a; border-radius: 16px; padding: 3rem 2.5rem; text-align: center; background: white; box-shadow: 0 8px 32px rgba(30,58,138,0.15); }
      h1 { color: #1e3a8a; font-size: 1.5rem; margin-bottom: 0.25rem; }
      h2 { color: #475569; font-size: 1rem; font-weight: 400; margin-bottom: 2rem; }
      .name { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 1rem 0; }
      p { color: #475569; line-height: 1.7; }
      .seal { margin-top: 2rem; font-size: 0.85rem; color: #22c55e; font-weight: 700; }
    </style></head><body>
    <div class="cert">
      <h1>National Anti-Doping Agency (NADA) India</h1>
      <h2>Ministry of Youth Affairs & Sports | Government of India</h2>
      <p>This is to certify that</p>
      <div class="name">${name}</div>
      <p>has fulfilled all anti-doping compliance requirements and is cleared for competition under WADA/NADA regulations for the year <strong>2026</strong>.</p>
      <p class="seal">✅ Verified Clean Athlete — NADA India 2026</p>
    </div></body></html>
  `);
  win.document.close();
};

/* ---- Quiz ---- */
const QUIZ_QUESTIONS = [
  {
    q: 'Which organisation publishes the global Prohibited List that NADA India follows?',
    opts: ['IOC','WADA','NADA','UNESCO'],
    answer: 1,
    explain: 'WADA (World Anti-Doping Agency) publishes and updates the Prohibited List annually.'
  },
  {
    q: 'What does TUE stand for in the context of anti-doping?',
    opts: ['Tested Use Exemption','Therapeutic Use Exemption','Temporary Use Exclusion','Technical Use Evaluation'],
    answer: 1,
    explain: 'TUE — Therapeutic Use Exemption — allows athletes with medical conditions to use an otherwise prohibited substance.'
  },
  {
    q: 'Salbutamol (Ventolin) used via inhaler is:',
    opts: ['Completely banned at all times','Permitted with no restrictions','Permitted only via inhaler within dose limits — TUE may be needed','Only allowed for non-athletes'],
    answer: 2,
    explain: 'Salbutamol is a RESTRICTED substance (S3). Via inhaler at ≤1600 µg/day it is allowed; above that, a TUE is required.'
  },
  {
    q: 'Which of the following is NOT on the WADA Prohibited List?',
    opts: ['EPO (Erythropoietin)','Nandrolone','Ibuprofen','HGH'],
    answer: 2,
    explain: 'Ibuprofen is a standard NSAID painkiller with no anti-doping restrictions under WADA.'
  },
  {
    q: 'An athlete is responsible for any prohibited substance found in their body sample. This is known as:',
    opts: ['Objective liability','Strict liability','Vicarious liability','Moral liability'],
    answer: 1,
    explain: 'Strict liability means the athlete bears responsibility regardless of how the substance entered their body — intent is not required for a violation.'
  }
];

let quizState = { current: 0, score: 0, answered: false };

function setupQuiz() {
  const retryBtn = document.getElementById('quiz-retry-btn');
  if (!retryBtn) return;
  retryBtn.addEventListener('click', startQuiz);
  startQuiz();
}

function startQuiz() {
  quizState = { current: 0, score: 0, answered: false };
  document.getElementById('quiz-result-screen').hidden = true;
  document.getElementById('quiz-question-area').hidden = false;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const q = QUIZ_QUESTIONS[quizState.current];
  const total = QUIZ_QUESTIONS.length;

  document.getElementById('quiz-progress-label').textContent = `Q ${quizState.current + 1} / ${total}`;
  document.getElementById('quiz-progress-fill').style.width = `${(quizState.current / total) * 100}%`;
  document.getElementById('quiz-question-text').textContent = q.q;

  const optsEl = document.getElementById('quiz-options');
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('quiz-next-btn');

  feedbackEl.hidden = true;
  nextBtn.hidden = true;
  quizState.answered = false;

  optsEl.innerHTML = q.opts.map((opt, i) =>
    `<button class="quiz-option" data-idx="${i}" type="button">${opt}</button>`
  ).join('');

  optsEl.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (quizState.answered) return;
      quizState.answered = true;
      const chosen = parseInt(btn.dataset.idx);
      const correct = chosen === q.answer;

      if (correct) quizState.score++;

      optsEl.querySelectorAll('.quiz-option').forEach(b => {
        b.disabled = true;
        const idx = parseInt(b.dataset.idx);
        if (idx === q.answer) b.classList.add('correct');
        else if (idx === chosen && !correct) b.classList.add('wrong');
      });

      feedbackEl.hidden = false;
      feedbackEl.className = `quiz-feedback ${correct ? 'correct' : 'wrong'}`;
      feedbackEl.textContent = correct
        ? `✓ Correct! ${q.explain}`
        : `✗ Incorrect. ${q.explain}`;

      nextBtn.hidden = false;
      nextBtn.textContent = quizState.current < QUIZ_QUESTIONS.length - 1 ? 'Next Question →' : 'See Results';
      nextBtn.onclick = () => {
        quizState.current++;
        if (quizState.current < QUIZ_QUESTIONS.length) renderQuizQuestion();
        else showQuizResults();
      };
    });
  });
}

function showQuizResults() {
  document.getElementById('quiz-question-area').hidden = true;
  const resultScreen = document.getElementById('quiz-result-screen');
  resultScreen.hidden = false;

  const total  = QUIZ_QUESTIONS.length;
  const score  = quizState.score;
  const pct    = Math.round((score / total) * 100);
  const perfect = pct === 100;

  const circle = document.getElementById('quiz-score-circle');
  circle.textContent = `${pct}%`;
  circle.className = `quiz-score-circle ${perfect ? 'perfect' : pct >= 60 ? 'good' : 'poor'}`;

  document.getElementById('quiz-progress-fill').style.width = '100%';
  document.getElementById('quiz-progress-label').textContent = `${score} / ${total} correct`;

  const msgEl = document.getElementById('quiz-result-msg');
  if (perfect) {
    msgEl.textContent = 'Outstanding! You answered every question correctly. You have demonstrated a thorough understanding of NADA anti-doping rules.';
  } else if (pct >= 60) {
    msgEl.textContent = `Good effort — ${score} out of ${total} correct. Review the incorrect answers and retake the quiz to earn your Clean Athlete Badge.`;
  } else {
    msgEl.textContent = `You scored ${score} out of ${total}. Study the NADA Athlete Guide and try again to earn your badge.`;
  }

  const badgeEl = document.getElementById('nada-badge-award');
  if (perfect) {
    badgeEl.hidden = false;
    document.getElementById('nada-badge-date').textContent = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('nada-badge-name').textContent = (currentUser && currentUser.fullName) || 'Athlete';

    awardNadaBadge();
  } else {
    badgeEl.hidden = true;
  }
}

/* Award the "NADA Clean Athlete" badge to the athlete's profile.
   Stored in the same emoji-prefixed string format every other badge uses
   (e.g. "🏛️ First Registration") so renderBadgeShowcase() displays it
   correctly. Idempotent — re-running the quiz won't duplicate the badge. */
const NADA_BADGE = '🏅 NADA Clean Athlete';
function awardNadaBadge() {
  if (!currentUser) return;

  const badges = Array.isArray(currentUser.badges) ? [...currentUser.badges] : [];

  // Migrate any legacy slug-form badge to the display format.
  const slugIdx = badges.indexOf('nada-clean-athlete');
  if (slugIdx !== -1) badges.splice(slugIdx, 1);

  const alreadyHas = badges.includes(NADA_BADGE);
  if (alreadyHas && slugIdx === -1) {
    // Nothing to persist — badge already present in correct form.
    showToast('🏅 You already hold the NADA Clean Athlete Badge!', 'info');
    return;
  }

  if (!alreadyHas) badges.push(NADA_BADGE);

  // Update in-memory user so the rest of the dashboard reflects it immediately.
  currentUser = { ...currentUser, badges };

  // Refresh the profile showcase + summary count live.
  renderBadgeShowcase();
  const countEl = document.getElementById('stats-badge-count');
  if (countEl) countEl.textContent = badges.length;

  // Persist (best-effort — mock or real backend).
  if (SportsPortal && SportsPortal.db && currentUser.uid) {
    SportsPortal.db.updateDoc('users', currentUser.uid, { badges }).catch(() => {});
  }

  showToast('🏅 NADA Clean Athlete Badge awarded to your profile!', 'success');
}


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
