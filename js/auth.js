/* ==========================================================================
   AUTHENTICATION & ROLE ROUTER CONTROLLER
   ========================================================================== */

import { SportsPortal } from './firebase-config.js';

// Active role state during registration
let selectedRole = 'user';
let athleteVerification = { status: 'pending', method: null };

document.addEventListener('DOMContentLoaded', () => {
  // Parse role query if specified (e.g. from Choosing Role cards on landing)
  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = urlParams.get('role');
  if (roleParam && ['user', 'organizer', 'admin'].includes(roleParam)) {
    selectedRole = roleParam;
    updateRoleSelectionUI(roleParam);
  }

  // Setup Registration Adaptive Role badges
  const roleButtons = document.querySelectorAll('.role-sel-btn');
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      roleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const role = btn.getAttribute('data-role');
      selectedRole = role;
      updateRoleSelectionUI(role);
    });
  });

  setupAthleteVerificationUI();
  updateRoleSelectionUI(selectedRole);

  // Bind forms if present on page
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const registerForm = document.getElementById('register-form');
  if (registerForm) registerForm.addEventListener('submit', handleRegistration);
});

/* ==========================================================================
   ROLE ADAPTIVE FORM INTERACTION
   ========================================================================== */
function updateRoleSelectionUI(role) {
  const userFields = document.getElementById('role-fields-user');
  const orgFields = document.getElementById('role-fields-organizer');
  const adminFields = document.getElementById('role-fields-admin');
  const athletePanel = document.getElementById('athlete-verification-panel');

  if (userFields) userFields.style.display = role === 'user' ? 'block' : 'none';
  if (orgFields) orgFields.style.display = role === 'organizer' ? 'block' : 'none';
  if (adminFields) adminFields.style.display = role === 'admin' ? 'block' : 'none';
  if (athletePanel) athletePanel.style.display = role === 'user' ? 'block' : 'none';
  
  // Update inputs required state dynamically to avoid validation errors
  setInputsRequiredState('role-fields-user', role === 'user');
  setInputsRequiredState('role-fields-organizer', role === 'organizer');
  setInputsRequiredState('role-fields-admin', role === 'admin');
}

function setInputsRequiredState(containerId, isRequired) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const inputs = container.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if (isRequired) {
      if (input.id === 'reg-age' || input.id === 'reg-city' || input.id === 'reg-state') {
        // Optional user fields
      } else {
        input.setAttribute('required', 'true');
      }
    } else {
      input.removeAttribute('required');
    }
  });
}

function setupAthleteVerificationUI() {
  const verifyBtn = document.getElementById('verify-digilocker-btn');
  const skipBtn = document.getElementById('skip-verification-btn');
  const closeBtn = document.getElementById('digilocker-cancel');
  const approveBtn = document.getElementById('digilocker-approve');
  const modal = document.getElementById('digilocker-modal');

  if (verifyBtn) verifyBtn.addEventListener('click', openDigiLockerModal);
  if (skipBtn) skipBtn.addEventListener('click', () => {
    closeDigiLockerModal();
    handleVerificationOutcome('skipped', 'Verification skipped. Unverified athletes cannot participate in State or National level tournaments.');
  });
  if (closeBtn) closeBtn.addEventListener('click', () => {
    closeDigiLockerModal();
    handleVerificationOutcome('skipped', 'Verification cancelled. Unverified athletes cannot participate in State or National level tournaments.');
  });
  if (approveBtn) approveBtn.addEventListener('click', () => {
    closeDigiLockerModal();
    handleVerificationOutcome('verified');
  });
  if (modal) modal.addEventListener('click', (event) => {
    if (event.target.id === 'digilocker-modal') {
      closeDigiLockerModal();
      handleVerificationOutcome('skipped', 'Verification cancelled. Unverified athletes cannot participate in State or National level tournaments.');
    }
  });
}

function openDigiLockerModal() {
  const modal = document.getElementById('digilocker-modal');
  if (modal) modal.style.display = 'flex';
}

function closeDigiLockerModal() {
  const modal = document.getElementById('digilocker-modal');
  if (modal) modal.style.display = 'none';
}

function handleVerificationOutcome(status, detail = '') {
  if (status === 'verified') {
    athleteVerification = { status: 'verified', method: 'DigiLocker' };
    populateVerifiedAthleteFields();
    updateVerificationUI('verified', 'Identity verified through DigiLocker. Your profile is eligible for secure onboarding.');
    showToast('Athlete identity verified successfully via DigiLocker.', 'success');
    return;
  }

  athleteVerification = { status: 'skipped', method: null };
  updateVerificationUI('warning', detail || 'Verification skipped. Unverified athletes cannot participate in State or National level tournaments.');
  showToast(detail || 'Verification skipped. Unverified athletes cannot participate in State or National level tournaments.', 'warning');
}

function updateVerificationUI(status, message) {
  const statusEl = document.getElementById('verification-status');
  if (!statusEl) return;

  statusEl.className = `verification-status ${status}`;
  statusEl.innerHTML = `<span>${status === 'verified' ? '✅' : '⚠️'}</span><span>${message}</span>`;
}

function populateVerifiedAthleteFields() {
  const mockProfile = {
    fullName: 'Aarav Sharma',
    dob: '1999-07-12',
    gender: 'Male',
    mobile: '9876543210',
    address: '12, Sector 15, Gurugram, Haryana'
  };

  const fields = [
    { id: 'reg-name', value: mockProfile.fullName },
    { id: 'reg-dob', value: mockProfile.dob },
    { id: 'reg-gender', value: mockProfile.gender },
    { id: 'reg-mobile', value: mockProfile.mobile },
    { id: 'reg-address', value: mockProfile.address }
  ];

  fields.forEach(({ id, value }) => {
    const field = document.getElementById(id);
    if (field) field.value = value;
  });

  const ageField = document.getElementById('reg-age');
  if (ageField) {
    const birthYear = new Date(mockProfile.dob).getFullYear();
    const currentYear = new Date().getFullYear();
    ageField.value = (currentYear - birthYear).toString();
  }

  const cityField = document.getElementById('reg-city');
  const stateField = document.getElementById('reg-state');
  if (cityField) cityField.value = 'Gurugram';
  if (stateField) stateField.value = 'Haryana';

  ['reg-name', 'reg-dob', 'reg-gender', 'reg-mobile', 'reg-address'].forEach(markFieldAsVerified);
}

function markFieldAsVerified(fieldId) {
  const label = document.querySelector(`label[for="${fieldId}"]`);
  if (!label) return;

  const existing = label.querySelector('.verification-badge');
  if (!existing) {
    const badge = document.createElement('span');
    badge.className = 'verification-badge';
    badge.textContent = '✓ Verified';
    label.appendChild(badge);
  }
}

/* ==========================================================================
   AUTHENTICATION & 2SV (TWO-STEP VERIFICATION)
   ========================================================================== */
let pendingUser = null;
let currentOtp = '';

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;

  // Basic validation
  if (!validateEmail(email)) {
    showToast('Please enter a valid authentic email address.', 'danger');
    return;
  }

  if (pass.length < 6) {
    showToast('Password must be at least 6 characters.', 'danger');
    return;
  }

  try {
    const res = await SportsPortal.auth.signInWithEmailAndPassword(email, pass);
    pendingUser = res.user;

    // Generate 6-digit OTP
    currentOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Show 2SV Modal
    show2SVModal(email);

  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function show2SVModal(email) {
  const modal = document.getElementById('tsv-modal');
  if (!modal) return;

  modal.style.display = 'flex';
  
  // Clear previous inputs
  const inputs = document.querySelectorAll('.tsv-otp-input');
  inputs.forEach(input => {
    input.value = '';
  });
  inputs[0].focus();

  // Show simulated verification code Toast
  showToast(`[2SV Security] Verification code sent to ${email}. Code: ${currentOtp}`, 'warning');

  // Setup input keypress handlers
  setupOtpInputHandlers();

  // Bind verify button
  const verifyBtn = document.getElementById('verify-tsv-btn');
  verifyBtn.onclick = verifyOtp;

  // Bind cancel button
  const cancelBtn = document.getElementById('cancel-tsv-btn');
  cancelBtn.onclick = () => {
    modal.style.display = 'none';
    pendingUser = null;
    currentOtp = '';
    showToast('Sign in cancelled.', 'warning');
  };

  // Bind resend button
  const resendBtn = document.getElementById('resend-tsv-btn');
  resendBtn.onclick = () => {
    currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
    inputs.forEach(input => input.value = '');
    inputs[0].focus();
    showToast(`[2SV Security] New verification code sent. Code: ${currentOtp}`, 'warning');
  };
}

function setupOtpInputHandlers() {
  const inputs = document.querySelectorAll('.tsv-otp-input');
  
  inputs.forEach((input, index) => {
    input.oninput = (e) => {
      const val = e.target.value;
      if (val.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    };

    input.onkeydown = (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        inputs[index - 1].focus();
      }
    };
  });
}

async function verifyOtp() {
  const inputs = document.querySelectorAll('.tsv-otp-input');
  let enteredOtp = '';
  inputs.forEach(input => {
    enteredOtp += input.value;
  });

  if (enteredOtp.length < 6) {
    showToast('Please enter the complete 6-digit verification code.', 'danger');
    return;
  }

  if (enteredOtp !== currentOtp) {
    showToast('Invalid verification code. Please try again.', 'danger');
    // Clear inputs
    inputs.forEach(input => input.value = '');
    inputs[0].focus();
    return;
  }

  // Verification successful
  const modal = document.getElementById('tsv-modal');
  if (modal) modal.style.display = 'none';

  showToast(`Verification Successful. Welcome back, ${pendingUser.fullName}!`, 'success');

  // Logging analytics event
  SportsPortal.analytics.logEvent('login', { uid: pendingUser.uid, role: pendingUser.role });

  // Redirect depending on credentials
    const compParam = new URLSearchParams(window.location.search).get('comp');
    setTimeout(() => {
      if (user.role === 'admin') {
        window.location.href = '../dashboard/admin.html';
      } else if (user.role === 'organizer') {
        window.location.href = '../dashboard/organizer.html';
      } else {
        window.location.href = '../dashboard/user.html' + (compParam ? `?comp=${encodeURIComponent(compParam)}` : '');
      }
    }, 1500);
}

/* ==========================================================================
   REGISTRATION SUBMIT EVENT
   ========================================================================== */
async function handleRegistration(e) {
  e.preventDefault();
  const fullName = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  const additionalData = { fullName };
  if (selectedRole === 'user') {
    additionalData.athleteVerification = {
      status: athleteVerification.status,
      method: athleteVerification.method,
      verifiedAt: athleteVerification.status === 'verified' ? new Date().toISOString() : null
    };
  }

  // Append specific role data
  if (selectedRole === 'user') {
    additionalData.age = parseInt(document.getElementById('reg-age').value) || 20;
    additionalData.dateOfBirth = document.getElementById('reg-dob').value || '';
    additionalData.gender = document.getElementById('reg-gender').value;
    additionalData.mobile = document.getElementById('reg-mobile').value || '';
    additionalData.address = document.getElementById('reg-address').value || '';
    additionalData.city = document.getElementById('reg-city').value || "Delhi";
    additionalData.state = document.getElementById('reg-state').value || "Delhi";
    additionalData.sportsInterests = [];
    additionalData.skills = "";
    additionalData.profilePhoto = "";
    additionalData.bio = "";
    additionalData.contactInfo = "";
    additionalData.badges = ["🏛️ Portal Rookie"];
    additionalData.certificates = [];
    additionalData.bookmarkIds = [];
  } else if (selectedRole === 'organizer') {
    additionalData.organization = document.getElementById('reg-org').value;
    additionalData.city = document.getElementById('reg-org-city').value;
    additionalData.verified = false; // Admin must verify first
  } else if (selectedRole === 'admin') {
    additionalData.department = document.getElementById('reg-dept').value;
  }

  if (selectedRole === 'user' && athleteVerification.status !== 'verified') {
    showToast('Athlete remains unverified. State or National level tournament participation will be restricted.', 'warning');
  }

  try {
    const res = await SportsPortal.auth.createUserWithEmailAndPassword(email, password, selectedRole, additionalData);
    const user = res.user;

    showToast(`Account Created Successfully as ${selectedRole.toUpperCase()}!`, 'success');
    
    // Log signup analytics
    SportsPortal.analytics.logEvent('sign_up', { uid: user.uid, role: selectedRole });

    setTimeout(() => {
      const compParam = new URLSearchParams(window.location.search).get('comp');
      if (selectedRole === 'admin') {
        window.location.href = '../dashboard/admin.html';
      } else if (selectedRole === 'organizer') {
        window.location.href = '../dashboard/organizer.html';
      } else {
        window.location.href = '../dashboard/user.html' + (compParam ? `?comp=${encodeURIComponent(compParam)}` : '');
      }
    }, 1500);

  } catch (err) {
    showToast(err.message, 'danger');
  }
}

/* ==========================================================================
   QUICK ONE-CLICK DEMO AUTHENTICATION
   ========================================================================== */
window.quickDemoLogin = async (role = 'user') => {
  const email = role === 'admin' ? 'admin@sports.gov.in' : role === 'organizer' ? 'organizer@sports.gov.in' : 'athlete@sports.gov.in';
  try {
    const firestore = new SportsPortal.db.constructor();
    const data = firestore.getData();
    const collection = role === 'admin' ? data.admins : role === 'organizer' ? data.organizers : data.users;
    let user = Object.values(collection || {}).find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      firestore.seedDummyData();
      const freshData = firestore.getData();
      const freshCol = role === 'admin' ? freshData.admins : role === 'organizer' ? freshData.organizers : freshData.users;
      user = Object.values(freshCol || {}).find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    }

    if (user) {
      localStorage.setItem('sports_portal_current_user', JSON.stringify(user));
      showToast(`Welcome! Signed in as ${user.fullName} (${role.toUpperCase()})`, 'success');
      const compParam = new URLSearchParams(window.location.search).get('comp');
      setTimeout(() => {
        if (role === 'admin') window.location.href = '../dashboard/admin.html';
        else if (role === 'organizer') window.location.href = '../dashboard/organizer.html';
        else window.location.href = '../dashboard/user.html' + (compParam ? `?comp=${encodeURIComponent(compParam)}` : '');
      }, 500);
    }
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

/* ==========================================================================
   TOAST HELPER SYSTEM
   ========================================================================== */
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type} show`;
  
  const icon = type === 'success' ? '✅' : type === 'danger' ? '❌' : type === 'warning' ? '⚠️' : '🔔';
  toast.innerHTML = `
    <span class="toast-icon" style="font-size: 1.25rem;">${icon}</span>
    <div class="toast-content" style="flex: 1; font-weight: 500; font-size: 0.95rem;">${message}</div>
  `;
  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Bind showToast to window for inline calls if necessary
window.showToast = showToast;
