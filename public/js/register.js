/* CODEFORGE — TEAM REGISTRATION STEPPER SCRIPT (ENHANCED) */

let regStep = 1;
let registrationDraft = {
  team_name: '',
  leader_idx: 0,
  members: [
    { full_name: '', age: '', gender: 'Male', college: '', branch: '', section: '', year: '3', mobile: '', email: '', is_leader: 1, photo: '' },
    { full_name: '', age: '', gender: 'Male', college: '', branch: '', section: '', year: '3', mobile: '', email: '', is_leader: 0, photo: '' },
    { full_name: '', age: '', gender: 'Male', college: '', branch: '', section: '', year: '3', mobile: '', email: '', is_leader: 0, photo: '' },
    { full_name: '', age: '', gender: 'Male', college: '', branch: '', section: '', year: '3', mobile: '', email: '', is_leader: 0, photo: '' }
  ]
};

// Generates an SVG initials avatar if participant has not uploaded a photo
function getInitialAvatarSvg(name) {
  const initials = (name || 'Member')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CF';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1e24" />
        <stop offset="100%" stop-color="#0f0f12" />
      </linearGradient>
    </defs>
    <rect width="160" height="160" fill="url(#grad)" rx="12"/>
    <rect width="156" height="156" x="2" y="2" fill="none" stroke="#2e2e38" stroke-width="2" rx="10"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="'Inter Tight', -apple-system, sans-serif" font-weight="800" font-size="52" fill="#ff7a1a" letter-spacing="2">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Auto-save draft to sessionStorage
function saveRegistrationDraft() {
  try {
    sessionStorage.setItem('cf_reg_draft', JSON.stringify(registrationDraft));
  } catch (e) {
    // Ignore storage quota errors
  }
}

// Restore draft from sessionStorage
function restoreRegistrationDraft() {
  try {
    const saved = sessionStorage.getItem('cf_reg_draft');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.members && parsed.members.length === 4) {
        registrationDraft = parsed;
        
        // Restore Team Name
        const teamInput = document.getElementById('reg-team-name');
        if (teamInput && registrationDraft.team_name) {
          teamInput.value = registrationDraft.team_name;
          checkTeamNameAvailability(registrationDraft.team_name);
        }

        // Restore Members Inputs & Photos
        registrationDraft.members.forEach((m, idx) => {
          const card = document.getElementById(`member-card-${idx}`);
          if (!card) return;
          card.querySelectorAll('.member-input').forEach(input => {
            const field = input.getAttribute('data-field');
            if (m[field] !== undefined && m[field] !== '') {
              input.value = m[field];
            }
          });

          if (m.photo) {
            const prompt = document.getElementById(`member-photo-prompt-${idx}`);
            const preview = document.getElementById(`member-photo-preview-${idx}`);
            const clearBtn = document.getElementById(`btn-clear-photo-${idx}`);
            if (prompt) prompt.style.display = 'none';
            if (preview) { preview.src = m.photo; preview.style.display = 'block'; }
            if (clearBtn) clearBtn.style.display = 'inline-flex';
          }
        });

        // Restore leader selection
        const leaderRadio = document.querySelector(`input[name="leader-select"][value="${registrationDraft.leader_idx}"]`);
        if (leaderRadio) leaderRadio.checked = true;
        updateLeaderCardHighlight(registrationDraft.leader_idx);
        updateAllMemberStatusChips();
        return true;
      }
    }
  } catch (e) {
    console.warn('Could not restore draft:', e);
  }
  return false;
}

// Live availability check for team name
let checkNameTimeout = null;
function checkTeamNameAvailability(teamVal) {
  const feedback = document.getElementById('reg-team-name-feedback');
  if (!feedback) return;

  const trimmed = (teamVal || '').trim();
  if (trimmed.length < 2) {
    feedback.style.display = 'none';
    feedback.innerHTML = '';
    return;
  }

  feedback.style.display = 'block';
  try {
    const teams = (typeof getDB === 'function' ? getDB('cf_teams') : []) || [];
    const isTaken = teams.some(t => (t.name || t.team_name || '').toLowerCase() === trimmed.toLowerCase());

    if (isTaken) {
      feedback.style.color = '#ef4444';
      feedback.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="x-circle" class="w-12"></i> "<strong>${escapeHtml(trimmed)}</strong>" is already taken. Please choose another.</span>`;
    } else {
      feedback.style.color = '#22c55e';
      feedback.innerHTML = `<span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="check-circle-2" class="w-12"></i> "<strong>${escapeHtml(trimmed)}</strong>" is available!</span>`;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (e) {
    feedback.style.display = 'none';
  }
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Update single member completion status chip
function updateMemberStatusChip(idx) {
  const chip = document.getElementById(`member-status-chip-${idx}`);
  if (!chip) return;

  const m = registrationDraft.members[idx];
  const missing = [];
  if (!m.full_name.trim()) missing.push('Name');
  if (!m.age) missing.push('Age');
  if (!m.college.trim()) missing.push('College');
  if (!m.branch.trim()) missing.push('Branch');
  if (!m.section.trim()) missing.push('Section');
  if (!m.mobile.trim() || !/^\d{10}$/.test(m.mobile.trim())) missing.push('10-digit Phone');
  if (!m.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) missing.push('Email');

  if (missing.length === 0) {
    chip.className = 'member-status-chip complete';
    chip.innerHTML = '<i data-lucide="check-circle" class="w-10"></i> Complete';
  } else {
    chip.className = 'member-status-chip incomplete';
    chip.innerHTML = `<i data-lucide="circle-dot" class="w-10"></i> ${missing.length} ${missing.length === 1 ? 'field' : 'fields'} missing`;
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updateAllMemberStatusChips() {
  for (let i = 0; i < 4; i++) {
    updateMemberStatusChip(i);
  }
}

// Apply Leader's College & Branch to all members
function applyLeaderCollegeToAll() {
  const leaderIdx = registrationDraft.leader_idx || 0;
  const leader = registrationDraft.members[leaderIdx];

  if (!leader.college && !leader.branch) {
    alert("Please fill in Member " + (leaderIdx + 1) + "'s College and Branch first.");
    return;
  }

  const collegeVal = leader.college.trim();
  const branchVal  = leader.branch.trim();
  const sectionVal = leader.section.trim();
  const yearVal    = leader.year;

  for (let i = 0; i < 4; i++) {
    if (i === leaderIdx) continue;
    const m = registrationDraft.members[i];
    if (collegeVal) m.college = collegeVal;
    if (branchVal)  m.branch  = branchVal;
    if (sectionVal) m.section = sectionVal;
    if (yearVal)    m.year    = yearVal;

    const card = document.getElementById(`member-card-${i}`);
    if (card) {
      if (collegeVal) {
        const cIn = card.querySelector('[data-field="college"]');
        if (cIn) cIn.value = collegeVal;
      }
      if (branchVal) {
        const bIn = card.querySelector('[data-field="branch"]');
        if (bIn) bIn.value = branchVal;
      }
      if (sectionVal) {
        const sIn = card.querySelector('[data-field="section"]');
        if (sIn) sIn.value = sectionVal;
      }
      if (yearVal) {
        const yIn = card.querySelector('[data-field="year"]');
        if (yIn) yIn.value = yearVal;
      }
    }
  }

  updateAllMemberStatusChips();
  saveRegistrationDraft();
  
  if (typeof showToast === 'function') {
    showToast(`Copied ${collegeVal || 'college details'} to all 4 members!`, 'success');
  } else {
    alert(`Copied ${collegeVal || 'college details'} to all 4 members!`);
  }
}

function initStepperUI() {
  regStep = 1;
  showStepPane(1);
  updateLeaderCardHighlight(0);

  // Pre-fill dynamically loaded fee in Quick Guide
  try {
    const settings = (typeof getDB === 'function' ? getDB('cf_settings') : {}) || {};
    if (settings.fees) {
      const feeEl = document.getElementById('reg-guide-fee');
      if (feeEl) feeEl.textContent = `₹${settings.fees} / Team`;
    }
  } catch (e) {}

  // Auto-fill leader email from logged-in user if available and empty
  try {
    const state = typeof getState === 'function' ? getState() : null;
    if (state && state.user && state.user.email) {
      const card0 = document.getElementById('member-card-0');
      const emailInput0 = card0 && card0.querySelector('[data-field="email"]');
      if (emailInput0 && !emailInput0.value) {
        emailInput0.value = state.user.email;
        registrationDraft.members[0].email = state.user.email;
      }
    }
  } catch (e) {}

  // Attempt to restore any saved session draft
  restoreRegistrationDraft();

  // Cancel Button
  document.getElementById('btn-step-1-cancel').addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });

  // Step 1: Live Team Name Input & Validation
  const teamInput = document.getElementById('reg-team-name');
  if (teamInput) {
    teamInput.addEventListener('input', (e) => {
      const val = e.target.value;
      registrationDraft.team_name = val;
      saveRegistrationDraft();
      clearTimeout(checkNameTimeout);
      checkNameTimeout = setTimeout(() => {
        checkTeamNameAvailability(val);
      }, 200);
    });
  }

  document.getElementById('btn-step-1-next').addEventListener('click', async () => {
    const teamInput = document.getElementById('reg-team-name');
    const errorBox  = document.getElementById('reg-team-name-error');
    const teamVal   = (teamInput.value || '').trim();
    errorBox.textContent = '';

    if (!teamVal) {
      errorBox.textContent = 'Team Name is required.';
      errorBox.style.display = 'block';
      return;
    }

    // Check duplicate
    try {
      const teams = (typeof getDB === 'function' ? getDB('cf_teams') : []) || [];
      const isTaken = teams.some(t => (t.name || t.team_name || '').toLowerCase() === teamVal.toLowerCase());
      if (isTaken) {
        errorBox.textContent = `The team name "${teamVal}" is already registered. Please choose a different name.`;
        errorBox.style.display = 'block';
        return;
      }
    } catch (e) {}

    errorBox.style.display = 'none';
    registrationDraft.team_name = teamVal;
    saveRegistrationDraft();
    regStep = 2;
    showStepPane(2);
    updateAllMemberStatusChips();
  });

  document.getElementById('btn-step-2-back').addEventListener('click', () => {
    regStep = 1;
    showStepPane(1);
  });

  // Apply College & Branch to All
  const applyCollegeBtn = document.getElementById('btn-apply-college-all');
  if (applyCollegeBtn) {
    applyCollegeBtn.addEventListener('click', applyLeaderCollegeToAll);
  }

  // Clickable Stepper Nodes Navigation
  const node1 = document.getElementById('step-node-1');
  const node2 = document.getElementById('step-node-2');
  const node3 = document.getElementById('step-node-3');

  if (node1) {
    node1.addEventListener('click', () => {
      regStep = 1;
      showStepPane(1);
    });
  }
  if (node2) {
    node2.addEventListener('click', () => {
      const teamVal = (document.getElementById('reg-team-name').value || '').trim();
      if (!teamVal) {
        alert('Please enter a Team Name in Step 1 first.');
        return;
      }
      registrationDraft.team_name = teamVal;
      regStep = 2;
      showStepPane(2);
      updateAllMemberStatusChips();
    });
  }
  if (node3) {
    node3.addEventListener('click', () => {
      handleStep2Submit();
    });
  }

  // Expand/Collapse toggle
  let formsExpanded = true;
  document.getElementById('btn-expand-all-members').addEventListener('click', () => {
    formsExpanded = !formsExpanded;
    document.querySelectorAll('.member-form-card .member-card-body').forEach(body => {
      body.style.display = formsExpanded ? 'flex' : 'none';
    });
    document.getElementById('btn-expand-all-members').innerHTML = formsExpanded
      ? 'Collapse All <span class="btn-underline"></span>'
      : 'Expand All <span class="btn-underline"></span>';
  });

  // Leader radio buttons
  document.querySelectorAll('input[name="leader-select"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const idx = parseInt(e.target.value);
      registrationDraft.leader_idx = idx;
      registrationDraft.members.forEach((m, i) => { m.is_leader = i === idx ? 1 : 0; });
      updateLeaderCardHighlight(idx);
      saveRegistrationDraft();
    });
  });

  // Live input synchronization, phone sanitization & status chips
  document.querySelectorAll('.members-cards-container .member-form-card').forEach((card, idx) => {
    card.querySelectorAll('.member-input').forEach(input => {
      const field = input.getAttribute('data-field');
      
      input.addEventListener('input', (e) => {
        // Phone number strict 10-digit sanitizer
        if (field === 'mobile') {
          e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        }
        registrationDraft.members[idx][field] = e.target.value;
        updateMemberStatusChip(idx);
        saveRegistrationDraft();
      });

      input.addEventListener('change', (e) => {
        registrationDraft.members[idx][field] = e.target.value;
        updateMemberStatusChip(idx);
        saveRegistrationDraft();
      });
    });

    // Clear photo button handler
    const clearBtn = document.getElementById(`btn-clear-photo-${idx}`);
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        registrationDraft.members[idx].photo = '';
        const preview = document.getElementById(`member-photo-preview-${idx}`);
        const prompt  = document.getElementById(`member-photo-prompt-${idx}`);
        const fileIn  = document.getElementById(`member-photo-input-${idx}`);
        if (preview) { preview.src = ''; preview.style.display = 'none'; }
        if (prompt)  { prompt.style.display = 'block'; }
        if (fileIn)  { fileIn.value = ''; }
        clearBtn.style.display = 'none';
        updateMemberStatusChip(idx);
        saveRegistrationDraft();
      });
    }
  });

  // Photo uploads
  document.querySelectorAll('.member-photo-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      if (e.target.files.length) handleMemberPhotoFile(e.target.files[0], idx);
    });
  });

  document.getElementById('btn-step-2-next').addEventListener('click', handleStep2Submit);
  document.getElementById('btn-step-3-back').addEventListener('click', () => { regStep = 2; showStepPane(2); });
  document.getElementById('btn-step-3-confirm').addEventListener('click', handleStep3Confirm);

  updateAllMemberStatusChips();
}

function handleMemberPhotoFile(file, idx) {
  const errorBox = document.getElementById(`member-photo-error-${idx}`);
  if (errorBox) errorBox.textContent = '';
  if (file.size > 2 * 1024 * 1024) { 
    if (errorBox) errorBox.textContent = 'Photo must be under 2MB.'; 
    return; 
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    registrationDraft.members[idx].photo = e.target.result;
    document.getElementById(`member-photo-prompt-${idx}`).style.display = 'none';
    const preview = document.getElementById(`member-photo-preview-${idx}`);
    preview.src   = e.target.result;
    preview.style.display = 'block';

    const clearBtn = document.getElementById(`btn-clear-photo-${idx}`);
    if (clearBtn) clearBtn.style.display = 'inline-flex';

    updateMemberStatusChip(idx);
    saveRegistrationDraft();
  };
  reader.readAsDataURL(file);
}

function updateStepNodesUI() {
  for (let i = 1; i <= 3; i++) {
    const node    = document.getElementById(`step-node-${i}`);
    const divider = node && node.nextElementSibling;
    if (!node) continue;
    node.className = 'step';
    if (divider && divider.classList.contains('step-divider')) divider.classList.remove('completed');
    if (i < regStep) {
      node.classList.add('completed');
      if (divider && divider.classList.contains('step-divider')) divider.classList.add('completed');
    } else if (i === regStep) {
      node.classList.add('active');
    }
  }
}

function showStepPane(stepNum) {
  document.querySelectorAll('.step-content').forEach(p => p.classList.remove('active'));
  const pane = document.getElementById(`step-pane-${stepNum}`);
  if (pane) pane.classList.add('active');
  updateStepNodesUI();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updateLeaderCardHighlight(leaderIdx) {
  for (let i = 0; i < 4; i++) {
    const card  = document.getElementById(`member-card-${i}`);
    if (!card) continue;
    const title = card.querySelector('.member-title');
    card.classList.remove('active-seam');
    title.innerHTML = `Member ${i + 1}`;
    if (i === leaderIdx) {
      card.classList.add('active-seam');
      title.innerHTML = `Member ${i + 1} <span class="leader-badge-indicator ml-8">★ Team Leader</span>`;
    }
  }
}

function handleStep2Submit() {
  const errorRegion = document.getElementById('reg-step-2-error');
  errorRegion.style.display = 'none';
  let validationPassed = true;

  document.querySelectorAll('.field-error').forEach(div => div.textContent = '');
  document.querySelectorAll('.member-input').forEach(input => input.classList.remove('invalid'));

  const memberCards = document.querySelectorAll('.members-cards-container .member-form-card');
  const emails = [];

  memberCards.forEach((card, idx) => {
    const inputs     = card.querySelectorAll('.member-input');
    const memberData = registrationDraft.members[idx];

    inputs.forEach(input => {
      const field      = input.getAttribute('data-field');
      const val        = input.value.trim();
      memberData[field] = val;
      const errorLabel = input.nextElementSibling;
      if (!val) {
        input.classList.add('invalid');
        if (errorLabel) errorLabel.textContent = 'This field is required.';
        validationPassed = false;
      }
    });

    // Auto-generate initial avatar fallback if user did not upload custom photo
    if (!memberData.photo) {
      memberData.photo = getInitialAvatarSvg(memberData.full_name || `Member ${idx + 1}`);
    }

    const ageInput = card.querySelector('[data-field="age"]');
    const ageVal   = parseInt(ageInput.value);
    if (ageInput.value && (isNaN(ageVal) || ageVal < 10 || ageVal > 100)) {
      ageInput.classList.add('invalid');
      const err = ageInput.nextElementSibling;
      if (err) err.textContent = 'Age must be between 10 and 100.';
      validationPassed = false;
    }

    const mobileInput = card.querySelector('[data-field="mobile"]');
    const mobileVal   = mobileInput.value.trim();
    if (mobileVal && !/^\d{10}$/.test(mobileVal)) {
      mobileInput.classList.add('invalid');
      const err = mobileInput.nextElementSibling;
      if (err) err.textContent = 'Mobile must be exactly 10 digits.';
      validationPassed = false;
    }

    const emailInput = card.querySelector('[data-field="email"]');
    const emailVal   = emailInput.value.trim();
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      emailInput.classList.add('invalid');
      const err = emailInput.nextElementSibling;
      if (err) err.textContent = 'Enter a valid email address.';
      validationPassed = false;
    }
    if (emailVal) emails.push({ email: emailVal.toLowerCase(), idx });
  });

  if (!validationPassed) {
    errorRegion.textContent   = 'Please fill all required highlighted fields for all 4 members.';
    errorRegion.style.display = 'block';
    // Smooth scroll to top of step 2
    window.scrollTo({ top: 120, behavior: 'smooth' });
    return;
  }

  const duplicateInTeam = emails.some((item, index) =>
    emails.findIndex(e => e.email === item.email) !== index
  );
  if (duplicateInTeam) {
    errorRegion.textContent   = 'Each team member must have a unique email address.';
    errorRegion.style.display = 'block';
    return;
  }

  saveRegistrationDraft();
  regStep = 3;
  showStepPane(3);
  renderReviewMembers();
}

function renderReviewMembers() {
  document.getElementById('review-team-name').textContent   = registrationDraft.team_name;
  const leaderObj = registrationDraft.members[registrationDraft.leader_idx];
  document.getElementById('review-team-leader').textContent = leaderObj.full_name;

  const container = document.getElementById('review-members-container');
  container.innerHTML = '';

  registrationDraft.members.forEach((m, idx) => {
    const isLeader = idx === registrationDraft.leader_idx;
    const avatarSrc = m.photo || getInitialAvatarSvg(m.full_name || `Member ${idx + 1}`);

    const card = document.createElement('div');
    card.className = `card review-member-card ${isLeader ? 'is-leader-card' : ''}`;
    card.innerHTML = `
      <div class="card-body">
        <div class="review-member-header-row">
          <img src="${avatarSrc}" class="review-member-avatar ${isLeader ? 'is-leader-avatar' : ''}" alt="Member Photo">
          <div>
            <h4 class="member-title">Member ${idx + 1}</h4>
            ${isLeader ? '<span class="leader-badge-indicator mt-4" style="display:inline-block">★ Team Leader</span>' : ''}
          </div>
        </div>
        <div class="review-list">
          <div class="review-row"><span class="review-lbl">Name:</span><span class="review-val font-semibold">${escapeHtml(m.full_name)}</span></div>
          <div class="review-row"><span class="review-lbl">Age / Gender:</span><span class="review-val">${escapeHtml(m.age)} / ${escapeHtml(m.gender)}</span></div>
          <div class="review-row"><span class="review-lbl">College:</span><span class="review-val">${escapeHtml(m.college)}</span></div>
          <div class="review-row"><span class="review-lbl">Branch/Year:</span><span class="review-val">${escapeHtml(m.branch)} (Sec ${escapeHtml(m.section)}) - Yr ${escapeHtml(m.year)}</span></div>
          <div class="review-row"><span class="review-lbl">Mobile:</span><span class="review-val font-mono">${escapeHtml(m.mobile)}</span></div>
          <div class="review-row"><span class="review-lbl">Email:</span><span class="review-val">${escapeHtml(m.email)}</span></div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

async function handleStep3Confirm() {
  const btn       = document.getElementById('btn-step-3-confirm');
  const errorBox  = document.getElementById('reg-step-3-error');
  if (errorBox) errorBox.style.display = 'none';
  btn.disabled    = true;
  btn.innerHTML   = 'Submitting Registration…';

  // Build the payload
  const payload = {
    team_name: registrationDraft.team_name,
    members: registrationDraft.members.map(m => ({
      full_name: m.full_name,
      age:       m.age,
      gender:    m.gender,
      college:   m.college,
      branch:    m.branch,
      section:   m.section,
      year:      m.year,
      mobile:    m.mobile,
      email:     m.email,
      is_leader: m.is_leader,
      photo:     m.photo || getInitialAvatarSvg(m.full_name)
    }))
  };

  try {
    const result = await apiFetch('/api/team/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Clear saved draft upon successful registration
    sessionStorage.removeItem('cf_reg_draft');

    // Store the new registration ID so confirmation.html can show it
    sessionStorage.setItem('cf_reg_id', result.registrationId);
    sessionStorage.setItem('cf_team_name', registrationDraft.team_name);
    sessionStorage.setItem('cf_leader_name', registrationDraft.members[registrationDraft.leader_idx].full_name);

    window.location.href = 'confirmation.html';
  } catch (err) {
    btn.disabled    = false;
    btn.innerHTML   = 'Lock In and Submit Registration <i data-lucide="check" class="w-14"></i><span class="btn-underline"></span>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (errorBox) {
      errorBox.textContent   = err.message || 'Registration failed. Please try again.';
      errorBox.style.display = 'block';
    } else {
      alert(err.message || 'Registration failed. Please try again.');
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await window.cfReady;
  initStepperUI();
});
