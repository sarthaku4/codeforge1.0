/* =========================================================
   CODEFORGE — HOMEPAGE INTERACTION & ANIMATIONS SCRIPT
   100% Client-Side (Pure HTML, CSS, JavaScript)
   ========================================================= */

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

/* Gradient Bars Animated Background Generator */
function initGradientBars() {
  const containers = document.querySelectorAll('[data-gradient-bars]');
  containers.forEach(container => {
    // Avoid double instantiation
    if (container.querySelector('.cf-gradient-bars-wrap')) return;

    const numBars = parseInt(container.dataset.numBars || '35', 10);
    const gradientFrom = container.dataset.gradientFrom || 'rgba(255, 60, 0, 0.45)';
    const gradientTo = container.dataset.gradientTo || 'transparent';
    const duration = parseFloat(container.dataset.duration || '2.4');

    const calculateHeight = (index, total) => {
      const position = index / (total - 1);
      const maxHeight = 100;
      const minHeight = 25;

      const center = 0.5;
      const distanceFromCenter = Math.abs(position - center);
      const heightPercentage = Math.pow(distanceFromCenter * 2, 1.2);

      return minHeight + (maxHeight - minHeight) * heightPercentage;
    };

    const wrap = document.createElement('div');
    wrap.className = 'cf-gradient-bars-wrap';

    const track = document.createElement('div');
    track.className = 'cf-gradient-bars-track';

    for (let i = 0; i < numBars; i++) {
      const height = calculateHeight(i, numBars);
      const bar = document.createElement('div');
      bar.className = 'cf-gradient-bar';
      bar.style.flex = `1 0 calc(100% / ${numBars})`;
      bar.style.maxWidth = `calc(100% / ${numBars})`;
      bar.style.background = `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`;
      bar.style.transform = `scaleY(${height / 100})`;
      bar.style.animationDelay = `${(i * 0.08).toFixed(2)}s`;
      bar.style.setProperty('--initial-scale', (height / 100).toString());
      bar.style.setProperty('--anim-duration', `${duration}s`);
      track.appendChild(bar);
    }

    wrap.appendChild(track);
    container.insertBefore(wrap, container.firstChild);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  /* Init Gradient Bars background effect */
  initGradientBars();

  /* Init lucide icons */
  if (window.lucide) {
    try { lucide.createIcons(); } catch (_) {}
  }

  /* Load organizers from client database */
  try {
    let settings = null;
    if (typeof apiFetch === 'function') {
      settings = await apiFetch('/api/settings');
    } else {
      try { settings = JSON.parse(localStorage.getItem('cf_settings')); } catch (_) {}
    }

    if (!settings || !settings.organizer1_name) {
      settings = {
        organizer1_name: 'Krishna Anantwar',
        organizer1_phone: '+91 84463 34754',
        organizer2_name: 'Aayush Bhaskarwar',
        organizer2_phone: '+91 94035 88874',
        organizer3_name: 'Anuj Thakare',
        organizer3_phone: '+91 90224 64865',
        organizer4_name: 'Sarthak Ubale',
        organizer4_phone: '+91 94221 20054'
      };
    }

    /* Populate footer organizers */
    const orgList = document.getElementById('footer-organizers-list');
    if (orgList && settings) {
      const organizers = [
        { name: settings.organizer1_name, phone: settings.organizer1_phone },
        { name: settings.organizer2_name, phone: settings.organizer2_phone },
        { name: settings.organizer3_name, phone: settings.organizer3_phone },
        { name: settings.organizer4_name, phone: settings.organizer4_phone },
      ].filter(o => o.name);

      if (organizers.length > 0) {
        orgList.innerHTML = organizers.map(o => `
          <li>
            <span class="org-name">${o.name}</span>
            <span class="org-phone">${o.phone || ''}</span>
          </li>
        `).join('');
      }
    }

    /* Update header college logo if set */
    if (settings && settings.college_logo_path) {
      const logoImg = document.getElementById('header-college-logo');
      const fallback = document.getElementById('logo-icon-fallback');
      if (logoImg) {
        logoImg.src = settings.college_logo_path;
        logoImg.style.display = 'block';
        if (fallback) fallback.style.display = 'none';
      }
    }

    /* Update max teams stats and CTA slots if configured */
    if (settings && settings.max_teams) {
      const hsTeams = document.getElementById('hs-teams');
      if (hsTeams) hsTeams.textContent = `${settings.max_teams}+`;
      const ctaSlots = document.getElementById('cta-slots-left');
      if (ctaSlots) ctaSlots.textContent = `${settings.max_teams}`;
    }
  } catch (_) {}

  /* Animate stats counter on scroll */
  const statNums = document.querySelectorAll('.cf-stat-num');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .1 });

    statNums.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'opacity 400ms ease, transform 400ms ease';
      observer.observe(el);
    });

    /* Animate sections on scroll */
    const animEls = document.querySelectorAll('.cf-track-card, .cf-why-card, .cf-info-card, .cf-tl-item');
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 60 * (entry.target.dataset.animIdx || 0));
          animObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .05 });

    animEls.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = `opacity 500ms ease, transform 500ms ease`;
      el.dataset.animIdx = i % 6;
      animObserver.observe(el);
    });
  }
});
