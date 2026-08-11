/* CODEFORGE — PARTICIPANT LOGIN / REGISTRATION PAGE SCRIPT */

/* Track Google Form button clicks via client-side storage & API simulation */
async function trackFormClick() {
  try {
    if (typeof apiFetch === 'function') {
      await apiFetch('/api/track/form-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'google_form_click', ts: new Date().toISOString() })
      });
    } else {
      const key = 'cf_form_clicks';
      let clicks = [];
      try { clicks = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
      clicks.push({ event: 'google_form_click', ts: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(clicks));
    }
  } catch (_) {
    // Non-blocking
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const authForm         = document.getElementById('auth-form');
  const registerPanel    = document.getElementById('register-panel');
  if (!authForm) return;

  const authFormTitle    = document.getElementById('auth-form-title');
  const authFormSubtitle = document.getElementById('auth-form-subtitle');
  const btnAuthSubmit    = document.getElementById('btn-auth-submit');
  const authErrorBox     = document.getElementById('auth-error-box');
  const tabLogin         = document.getElementById('auth-tab-login');
  const tabSignup        = document.getElementById('auth-tab-signup');

  /* -- Tab: Sign In --------------------------------------- */
  function showLoginTab() {
    tabLogin.classList.add('active');
    tabLogin.style.borderBottomColor = 'var(--accent)';
    tabLogin.style.color             = 'var(--foreground)';
    tabSignup.classList.remove('active');
    tabSignup.style.borderBottomColor = 'transparent';
    tabSignup.style.color             = 'var(--muted-foreground)';

    authFormTitle.textContent    = 'Welcome Back';
    authFormSubtitle.textContent = 'Log in to manage your CodeForge account';
    authErrorBox.style.display   = 'none';

    // Show login form, hide register panel
    authForm.style.display        = 'flex';
    registerPanel.style.display   = 'none';

    // Re-render lucide icons
    if (window.lucide) lucide.createIcons();
  }

  /* -- Tab: Register -------------------------------------- */
  function showRegisterTab() {
    tabSignup.classList.add('active');
    tabSignup.style.borderBottomColor = 'var(--accent)';
    tabSignup.style.color             = 'var(--foreground)';
    tabLogin.classList.remove('active');
    tabLogin.style.borderBottomColor  = 'transparent';
    tabLogin.style.color              = 'var(--muted-foreground)';

    authFormTitle.textContent    = 'Register for CodeForge';
    authFormSubtitle.textContent = 'Registration via Google Forms — quick & easy';
    authErrorBox.style.display   = 'none';

    // Hide login form, show register panel
    authForm.style.display        = 'none';
    registerPanel.style.display   = 'flex';

    // Re-render lucide icons inside the newly visible panel
    if (window.lucide) lucide.createIcons();
  }

  tabLogin.addEventListener('click', showLoginTab);
  tabSignup.addEventListener('click', showRegisterTab);

  /* -- Form submit (Sign In only) ------------------------- */
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authErrorBox.style.display = 'none';
    btnAuthSubmit.disabled     = true;

    const emailVal    = document.getElementById('auth-email').value.trim();
    const passwordVal = document.getElementById('auth-password').value;

    try {
      const user = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailVal, password: passwordVal })
      });

      // Update in-memory session state
      state.user = { loggedIn: true, id: user.id, email: user.email, role: user.role, hasTeam: user.hasTeam || false };

      // Redirect based on role
      if (user.role === 'admin') {
        window.location.replace('admin-dashboard.html');
      } else {
        window.location.replace('dashboard.html');
      }
    } catch (err) {
      authErrorBox.textContent   = err.message || 'An error occurred. Please try again.';
      authErrorBox.style.display = 'block';
    } finally {
      btnAuthSubmit.disabled = false;
    }
  });
});
