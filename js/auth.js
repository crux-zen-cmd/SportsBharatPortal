/* ==========================================================================
   AUTHENTICATION & ROLE ROUTER CONTROLLER
   ========================================================================== */

import { SportsPortal } from './firebase-config.js';

// Active role state during registration
let selectedRole = 'user';

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

  if (userFields) userFields.style.display = role === 'user' ? 'block' : 'none';
  if (orgFields) orgFields.style.display = role === 'organizer' ? 'block' : 'none';
  if (adminFields) adminFields.style.display = role === 'admin' ? 'block' : 'none';
  
  // Update inputs required state dynamically to avoid validation errors
  setInputsRequiredState('role-fields-user', role === 'user');
  setInputsRequiredState('role-fields-organizer', role === 'organizer');
  setInputsRequiredState('role-fields-admin', role === 'admin');
}

function setInputsRequiredState(containerId, isRequired) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const inputs = container.querySelectorAll('input, select');
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

/* ==========================================================================
   LOGIN SUBMIT EVENT
   ========================================================================== */
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;

  try {
    const res = await SportsPortal.auth.signInWithEmailAndPassword(email, pass);
    const user = res.user;

    showToast(`Authentication Successful. Welcome back, ${user.fullName}!`, 'success');

    // Logging analytics event
    SportsPortal.analytics.logEvent('login', { uid: user.uid, role: user.role });

    // Redirect depending on credentials
    setTimeout(() => {
      if (user.role === 'admin') {
        window.location.href = '../dashboard/admin.html';
      } else if (user.role === 'organizer') {
        window.location.href = '../dashboard/organizer.html';
      } else {
        window.location.href = '../dashboard/user.html';
      }
    }, 1500);

  } catch (err) {
    showToast(err.message, 'danger');
  }
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

  // Append specific role data
  if (selectedRole === 'user') {
    additionalData.age = parseInt(document.getElementById('reg-age').value) || 20;
    additionalData.gender = document.getElementById('reg-gender').value;
    additionalData.city = document.getElementById('reg-city').value || "Delhi";
    additionalData.state = document.getElementById('reg-state').value || "Delhi";
    additionalData.sportsInterests = [];
    additionalData.skills = "";
    additionalData.profilePhoto = "";
    additionalData.bio = "";
    additionalData.contactInfo = "";
    additionalData.badges = ["🏆 Portal Rookie"];
    additionalData.certificates = [];
    additionalData.bookmarkIds = [];
  } else if (selectedRole === 'organizer') {
    additionalData.organization = document.getElementById('reg-org').value;
    additionalData.city = document.getElementById('reg-org-city').value;
    additionalData.verified = false; // Admin must verify first
  } else if (selectedRole === 'admin') {
    additionalData.department = document.getElementById('reg-dept').value;
  }

  try {
    const res = await SportsPortal.auth.createUserWithEmailAndPassword(email, password, selectedRole, additionalData);
    const user = res.user;

    showToast(`Account Created Successfully as ${selectedRole.toUpperCase()}!`, 'success');
    
    // Log signup analytics
    SportsPortal.analytics.logEvent('sign_up', { uid: user.uid, role: selectedRole });

    setTimeout(() => {
      if (selectedRole === 'admin') {
        window.location.href = '../dashboard/admin.html';
      } else if (selectedRole === 'organizer') {
        window.location.href = '../dashboard/organizer.html';
      } else {
        window.location.href = '../dashboard/user.html';
      }
    }, 1500);

  } catch (err) {
    showToast(err.message, 'danger');
  }
}

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
