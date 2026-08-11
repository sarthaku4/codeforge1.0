/* CODEFORGE — ADMIN COMMAND CENTER SCRIPT */

let currentSortField = 'registration_id';
let currentSortOrder = 'asc';
let activeViewTeamId = null;
let allTeams         = [];   // local cache, refreshed on each load

/* ---------------------------------------------------------
   Stats
   --------------------------------------------------------- */
async function loadAndRenderAdminStats() {
  try {
    const stats = await apiFetch('/api/admin/stats');
    document.getElementById('stat-total-users').textContent        = stats.totalUsers;
    document.getElementById('stat-total-teams').textContent        = stats.totalTeams;
    document.getElementById('stat-total-participants').textContent = stats.totalParticipants;
    document.getElementById('stat-pending-payments').textContent   = stats.pending;
    document.getElementById('stat-submitted-payments').textContent = stats.submitted;
    document.getElementById('stat-verified-payments').textContent  = stats.verified;
    const checkedInEl = document.getElementById('stat-checked-in');
    if (checkedInEl) checkedInEl.textContent = stats.checkedIn || 0;
    const projEl = document.getElementById('stat-projects-submitted');
    if (projEl) projEl.textContent = stats.projectsSubmitted || 0;
  } catch (err) {
    console.error('[Admin] Stats fetch error:', err);
  }

  // Form click tracking stats
  try {
    const clickStats = await apiFetch('/api/admin/form-clicks');
    const totalEl = document.getElementById('stat-form-clicks-total');
    const todayEl = document.getElementById('stat-form-clicks-today');
    if (totalEl) totalEl.textContent = clickStats.total || 0;
    if (todayEl) todayEl.textContent = clickStats.today || 0;
  } catch (err) {
    console.warn('[Admin] Form click stats unavailable:', err);
  }
}


/* ---------------------------------------------------------
   Filter dropdowns — built from current allTeams cache
   --------------------------------------------------------- */
function populateFilterDropdowns() {
  const colDropdown    = document.getElementById('filter-college');
  const branchDropdown = document.getElementById('filter-branch');
  if (!colDropdown || !branchDropdown) return;

  const prevCol    = colDropdown.value;
  const prevBranch = branchDropdown.value;

  colDropdown.innerHTML    = '<option value="">All Colleges</option>';
  branchDropdown.innerHTML = '<option value="">All Branches</option>';

  const colleges = new Set();
  const branches = new Set();
  allTeams.forEach(team => {
    (team.members || []).forEach(m => {
      if (m.college) colleges.add(m.college.trim());
      if (m.branch)  branches.add(m.branch.trim());
    });
  });

  colleges.forEach(col => { colDropdown.innerHTML    += `<option value="${col}">${col}</option>`; });
  branches.forEach(br  => { branchDropdown.innerHTML += `<option value="${br}">${br}</option>`; });

  colDropdown.value    = prevCol;
  branchDropdown.value = prevBranch;
}

/* ---------------------------------------------------------
   Fetch teams from API, then render table
   --------------------------------------------------------- */
async function fetchAndRenderRegistrationsTable() {
  const searchVal  = (document.getElementById('admin-search-input')?.value || '').trim();
  const statusVal  = document.getElementById('filter-payment-status')?.value || '';
  const collegeVal = document.getElementById('filter-college')?.value || '';
  const branchVal  = document.getElementById('filter-branch')?.value || '';
  const yearVal    = document.getElementById('filter-year')?.value || '';

  const params = new URLSearchParams();
  if (searchVal)  params.set('search',         searchVal);
  if (statusVal)  params.set('payment_status', statusVal);
  if (collegeVal) params.set('college',        collegeVal);
  if (branchVal)  params.set('branch',         branchVal);
  if (yearVal)    params.set('year',           yearVal);
  params.set('sort_by',    currentSortField);
  params.set('sort_order', currentSortOrder);

  try {
    allTeams = await apiFetch(`/api/admin/registrations?${params.toString()}`);
  } catch (err) {
    console.error('[Admin] Registrations fetch error:', err);
    allTeams = [];
  }

  renderRegistrationsTable(allTeams);
}

function renderRegistrationsTable(teams) {
  const tbody      = document.getElementById('registrations-table-body');
  const fallback   = document.getElementById('registrations-cards-fallback');
  const emptyState = document.getElementById('table-empty-state');

  tbody.innerHTML   = '';
  fallback.innerHTML = '';

  if (teams.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';

  teams.forEach(team => {
    const leaderObj    = (team.members || []).find(m => m.is_leader === 1) || {};
    const badgeClass   = `badge-${team.payment_status.toLowerCase()}`;
    const dateStr      = new Date(team.created_at).toLocaleDateString();
    const dbId         = team.id;   // numeric DB id for API calls
    const checkinTag   = team.checked_in ? '<span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700; background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid #3b82f6; margin-left:6px;">📍 IN</span>' : '';
    const projectTag   = team.project_title ? '<span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700; background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid #a855f7; margin-left:4px;" title="Project: ' + escapeHtml(team.project_title) + '">🚀 PROJ</span>' : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-mono">${team.registration_id}</td>
      <td class="font-space" style="font-weight:700">${escapeHtml(team.team_name)} ${checkinTag} ${projectTag}</td>
      <td>${escapeHtml(leaderObj.full_name || '—')}</td>
      <td>${escapeHtml(leaderObj.college  || '—')}</td>
      <td><span class="font-mono text-xs text-dim">4 Registered</span></td>
      <td class="font-mono">${dateStr}</td>
      <td><span class="badge ${badgeClass}">${team.payment_status}</span></td>
      <td>
        <div class="action-btn-row">
          <button class="btn-icon-only btn-check" onclick="quickVerify(${dbId})" title="Verify Payment"><i data-lucide="check"></i></button>
          <button class="btn-icon-only btn-trash" onclick="quickReject(${dbId})" title="Reject Payment"><i data-lucide="x"></i></button>
          <button class="btn-icon-only" onclick="viewTeamDetails(${dbId})" title="View Details"><i data-lucide="eye"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);

    const mCard = document.createElement('div');
    mCard.className = 'mobile-table-card';
    mCard.innerHTML = `
      <div class="mobile-table-row"><span class="mobile-table-lbl">ID:</span><span class="mobile-table-val font-mono">${team.registration_id}</span></div>
      <div class="mobile-table-row"><span class="mobile-table-lbl">Team Name:</span><span class="mobile-table-val font-space" style="font-weight:700">${escapeHtml(team.team_name)} ${checkinTag} ${projectTag}</span></div>
      <div class="mobile-table-row"><span class="mobile-table-lbl">Leader:</span><span class="mobile-table-val">${escapeHtml(leaderObj.full_name || '—')}</span></div>
      <div class="mobile-table-row"><span class="mobile-table-lbl">Status:</span><span class="badge ${badgeClass}">${team.payment_status}</span></div>
      <div class="mobile-actions-row"><button class="btn btn-secondary btn-sm" onclick="viewTeamDetails(${dbId})">View Details</button></div>
    `;
    fallback.appendChild(mCard);
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ---------------------------------------------------------
   Quick verify / reject
   --------------------------------------------------------- */
async function quickVerify(teamId) {
  try {
    await apiFetch('/api/admin/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ team_id: teamId, status: 'Verified' })
    });
    showToast('Payment marked as Verified.');
    refreshAdminView();
  } catch (err) {
    showToast(err.message || 'Failed to verify payment.', 'error');
  }
}

async function quickReject(teamId) {
  try {
    await apiFetch('/api/admin/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ team_id: teamId, status: 'Rejected' })
    });
    showToast('Payment marked as Rejected.');
    refreshAdminView();
  } catch (err) {
    showToast(err.message || 'Failed to reject payment.', 'error');
  }
}

/* ---------------------------------------------------------
   Full refresh helper
   --------------------------------------------------------- */
async function refreshAdminView() {
  await loadAndRenderAdminStats();
  await fetchAndRenderRegistrationsTable();
  // If details modal is open, refresh it
  if (activeViewTeamId !== null) viewTeamDetails(activeViewTeamId);
}

/* ---------------------------------------------------------
   View team details modal
   --------------------------------------------------------- */
function viewTeamDetails(teamId) {
  activeViewTeamId = teamId;
  const team = allTeams.find(t => t.id === teamId);
  if (!team) return;

  document.getElementById('modal-team-name').textContent    = team.team_name;
  document.getElementById('modal-reg-id').textContent       = team.registration_id;
  const statusBadge = document.getElementById('modal-payment-status');
  statusBadge.textContent = team.payment_status;
  statusBadge.className   = `badge badge-${team.payment_status.toLowerCase()}`;
  document.getElementById('modal-transaction-id').textContent = team.transaction_id || 'UTR-NOT-PROVIDED';

  // Venue checkin status
  const checkinBadge = document.getElementById('modal-checkin-status');
  if (checkinBadge) {
    checkinBadge.textContent = team.checked_in ? 'CHECKED IN (PRESENT)' : 'NOT CHECKED IN';
    checkinBadge.className   = `badge ${team.checked_in ? 'badge-verified' : 'badge-pending'}`;
  }
  const checkinBtn = document.getElementById('btn-modal-checkin');
  if (checkinBtn) {
    checkinBtn.textContent = team.checked_in ? 'Mark as Not Checked In' : 'Mark as Checked In';
  }

  // Project Submission Preview
  const projCard = document.getElementById('modal-project-card');
  if (projCard) {
    if (team.project_title) {
      projCard.style.display = 'block';
      document.getElementById('modal-proj-title').textContent = team.project_title;
      document.getElementById('modal-proj-theme').textContent = team.project_theme || 'General Track';
      
      const ghRow = document.getElementById('modal-proj-github-row');
      const ghEl = document.getElementById('modal-proj-github');
      if (team.github_url) {
        ghRow.style.display = 'flex';
        ghEl.href = team.github_url;
        ghEl.textContent = team.github_url;
      } else {
        ghRow.style.display = 'none';
      }

      const demoRow = document.getElementById('modal-proj-demo-row');
      const demoEl = document.getElementById('modal-proj-demo');
      if (team.demo_url) {
        demoRow.style.display = 'flex';
        demoEl.href = team.demo_url;
        demoEl.textContent = team.demo_url;
      } else {
        demoRow.style.display = 'none';
      }

      const descEl = document.getElementById('modal-proj-desc');
      descEl.textContent = team.project_desc || 'No description provided.';
    } else {
      projCard.style.display = 'none';
    }
  }

  const container = document.getElementById('modal-members-container');
  container.innerHTML = '';
  (team.members || []).forEach((m) => {
    const isLeader = m.is_leader === 1;
    const row = document.createElement('div');
    row.className = `modal-member-row ${isLeader ? 'is-leader-row' : ''}`;
    row.innerHTML = `
      <div class="modal-member-row-grid">
        <div class="member-avatar-container">
          <div style="width:52px;height:52px;background:var(--input);border:var(--border-width) solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:700;color:var(--accent);">${m.full_name.charAt(0).toUpperCase()}</div>
        </div>
        <div class="modal-member-text-col">
          <div class="modal-member-name-row">
            <span class="modal-m-name">${m.full_name}</span>
            ${isLeader ? '<span class="leader-badge-indicator">★ Team Leader</span>' : ''}
          </div>
          <div class="modal-m-details-grid">
            <div><strong>College:</strong> ${m.college}</div>
            <div><strong>Branch:</strong> ${m.branch} - Yr ${m.year}</div>
            <div><strong>Phone:</strong> ${m.mobile}</div>
            <div><strong>Email:</strong> ${m.email}</div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(row);
  });

  // Screenshot
  const img     = document.getElementById('modal-screenshot-img');
  const missing = document.getElementById('modal-screenshot-missing');
  const dlBtn   = document.getElementById('btn-modal-receipt-download');

  if (team.screenshot_path) {
    img.src           = team.screenshot_path;
    img.style.display = 'block';
    missing.style.display = 'none';
    if (dlBtn) {
      dlBtn.style.display = 'inline-flex';
      dlBtn.onclick = () => window.open(team.screenshot_path, '_blank');
    }
  } else {
    img.style.display   = 'none';
    missing.style.display = 'block';
    if (dlBtn) dlBtn.style.display = 'none';
  }

  document.getElementById('team-details-modal').classList.add('active');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.quickVerify     = quickVerify;
window.quickReject     = quickReject;
window.viewTeamDetails = viewTeamDetails;

/* ---------------------------------------------------------
   Edit team modal — submit to PUT /api/admin/registrations/:id
   --------------------------------------------------------- */
function openEditModal(teamId) {
  const team = allTeams.find(t => t.id === teamId);
  if (!team) return;

  document.getElementById('team-details-modal').classList.remove('active');

  const editModal = document.getElementById('edit-team-modal');
  document.getElementById('edit-modal-reg-id').textContent = team.registration_id;
  document.getElementById('edit-team-name').value          = team.team_name;

  const container = document.getElementById('edit-members-inputs');
  container.innerHTML = '';

  (team.members || []).forEach((m, idx) => {
    const card = document.createElement('div');
    card.className = 'card member-form-card mb-16';
    card.innerHTML = `
      <div class="member-card-header">
        <h4 class="member-title">Member ${idx + 1}</h4>
        <div class="leader-select-container">
          <label class="leader-radio-label">
            <input type="radio" name="edit-leader-select" value="${idx}" class="leader-radio-input" ${m.is_leader === 1 ? 'checked' : ''}>
            <span class="custom-radio"></span>
            <span class="radio-label-text">Team Leader</span>
          </label>
        </div>
      </div>
      <div class="member-card-body">
        <div class="member-card-body-grid">
          <div style="display: flex; flex-direction: column; gap: 24px; width: 100%;">
            <div class="sub-form-section">
              <h5 class="sub-section-title"><i data-lucide="user"></i> Personal Details</h5>
              <div class="form-row-3">
                <div class="form-group"><label>Full Name</label><input type="text" class="edit-m-input" data-idx="${idx}" data-field="full_name" value="${m.full_name}" required></div>
                <div class="form-group"><label>Age</label><input type="number" class="edit-m-input" data-idx="${idx}" data-field="age" value="${m.age}" min="10" max="100" required></div>
                <div class="form-group"><label>Gender</label>
                  <select class="edit-m-input" data-idx="${idx}" data-field="gender" required>
                    <option value="Male"   ${m.gender === 'Male'   ? 'selected' : ''}>Male</option>
                    <option value="Female" ${m.gender === 'Female' ? 'selected' : ''}>Female</option>
                    <option value="Other"  ${m.gender === 'Other'  ? 'selected' : ''}>Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="sub-form-section">
              <h5 class="sub-section-title"><i data-lucide="book-open"></i> Academic Info</h5>
              <div class="form-row-4">
                <div class="form-group"><label>College</label><input type="text" class="edit-m-input" data-idx="${idx}" data-field="college" value="${m.college}" required></div>
                <div class="form-group"><label>Branch</label><input type="text" class="edit-m-input" data-idx="${idx}" data-field="branch" value="${m.branch}" required></div>
                <div class="form-group"><label>Section</label><input type="text" class="edit-m-input" data-idx="${idx}" data-field="section" value="${m.section}" required></div>
                <div class="form-group"><label>Year</label>
                  <select class="edit-m-input" data-idx="${idx}" data-field="year" required>
                    ${[1,2,3,4,5].map(y => `<option value="${y}" ${m.year == y ? 'selected' : ''}>${y}${['st','nd','rd','th','th'][y-1]} Yr</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
            <div class="sub-form-section">
              <h5 class="sub-section-title"><i data-lucide="phone"></i> Contact Details</h5>
              <div class="form-row-2">
                <div class="form-group"><label>Mobile</label><input type="tel" class="edit-m-input" data-idx="${idx}" data-field="mobile" value="${m.mobile}" required pattern="\\d{10}"></div>
                <div class="form-group"><label>Email</label><input type="email" class="edit-m-input" data-idx="${idx}" data-field="email" value="${m.email}" required></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  editModal.classList.add('active');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ---------------------------------------------------------
   Delete team
   --------------------------------------------------------- */
async function deleteTeam(teamId) {
  if (!confirm('Are you sure you want to permanently delete this team and their account? This cannot be undone.')) return;
  try {
    await apiFetch(`/api/admin/registrations/${teamId}`, { method: 'DELETE' });
    showToast('Team deleted successfully.');
    document.getElementById('team-details-modal').classList.remove('active');
    refreshAdminView();
  } catch (err) {
    showToast(err.message || 'Failed to delete team.', 'error');
  }
}
window.deleteTeam = deleteTeam;

/* ---------------------------------------------------------
   DOMContentLoaded
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  await window.cfReady;
  if (!document.getElementById('registrations-table-body')) return;

  loadAndRenderAdminStats();
  fetchAndRenderRegistrationsTable().then(() => populateFilterDropdowns());

  /* -- Filter / search binds -- */
  ['filter-payment-status', 'filter-college', 'filter-branch', 'filter-year'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => fetchAndRenderRegistrationsTable().then(() => populateFilterDropdowns()));
  });
  document.getElementById('admin-search-input')?.addEventListener('input', fetchAndRenderRegistrationsTable);

  /* -- Sort column headers -- */
  document.querySelectorAll('.data-table th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-sort');
      if (currentSortField === field) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortField = field;
        currentSortOrder = 'asc';
      }
      document.querySelectorAll('.data-table th.sortable i').forEach(icon => icon.setAttribute('data-lucide', 'arrow-up-down'));
      th.querySelector('i')?.setAttribute('data-lucide', currentSortOrder === 'asc' ? 'arrow-up' : 'arrow-down');
      fetchAndRenderRegistrationsTable();
    });
  });

  /* -- Modal: verify / reject / checkin / close -- */
  document.getElementById('btn-modal-verify')?.addEventListener('click', async () => {
    await quickVerify(activeViewTeamId);
    viewTeamDetails(activeViewTeamId);
  });
  document.getElementById('btn-modal-reject')?.addEventListener('click', async () => {
    await quickReject(activeViewTeamId);
    viewTeamDetails(activeViewTeamId);
  });
  document.getElementById('btn-modal-checkin')?.addEventListener('click', async () => {
    if (activeViewTeamId === null) return;
    try {
      const res = await apiFetch('/api/admin/toggle-checkin', {
        method: 'POST',
        body: JSON.stringify({ team_id: activeViewTeamId })
      });
      showToast(res.checked_in ? 'Team marked as Checked In (Present)!' : 'Team marked as Not Checked In.');
      await refreshAdminView();
      viewTeamDetails(activeViewTeamId);
    } catch (err) {
      showToast(err.message || 'Failed to update check-in status.', 'error');
    }
  });
  document.getElementById('btn-close-team-modal')?.addEventListener('click', () => {
    document.getElementById('team-details-modal').classList.remove('active');
  });

  /* -- Lightbox -- */
  document.getElementById('modal-screenshot-frame')?.addEventListener('click', () => {
    const team = allTeams.find(t => t.id === activeViewTeamId);
    if (team && team.screenshot_path) {
      document.getElementById('lightbox-image-target').src = team.screenshot_path;
      document.getElementById('screenshot-lightbox').classList.add('active');
    }
  });
  document.getElementById('btn-close-lightbox')?.addEventListener('click', () => {
    document.getElementById('screenshot-lightbox').classList.remove('active');
  });

  /* -- Edit modal open -- */
  document.getElementById('btn-modal-edit')?.addEventListener('click', () => {
    if (activeViewTeamId !== null) openEditModal(activeViewTeamId);
  });
  document.getElementById('btn-close-edit-modal')?.addEventListener('click', () => {
    document.getElementById('edit-team-modal').classList.remove('active');
  });
  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
    document.getElementById('edit-team-modal').classList.remove('active');
  });

  /* -- Edit form submit -- */
  document.getElementById('edit-team-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox   = document.getElementById('edit-team-error');
    errorBox.style.display = 'none';

    const teamNameVal    = document.getElementById('edit-team-name').value.trim();
    const selectedRadio  = document.querySelector('input[name="edit-leader-select"]:checked');
    const leaderIdx      = parseInt(selectedRadio?.value ?? 0);

    // Collect member data from inputs
    const membersMap = {};
    document.querySelectorAll('.edit-m-input').forEach(input => {
      const idx   = parseInt(input.getAttribute('data-idx'));
      const field = input.getAttribute('data-field');
      if (!membersMap[idx]) membersMap[idx] = {};
      membersMap[idx][field] = input.value.trim();
    });

    const members = Object.values(membersMap).map((m, idx) => ({
      ...m,
      is_leader: idx === leaderIdx ? 1 : 0
    }));

    try {
      await apiFetch(`/api/admin/registrations/${activeViewTeamId}`, {
        method: 'PUT',
        body: JSON.stringify({ team_name: teamNameVal, members })
      });
      showToast('Team updated successfully.');
      document.getElementById('edit-team-modal').classList.remove('active');
      refreshAdminView();
    } catch (err) {
      errorBox.textContent   = err.message || 'Failed to update team.';
      errorBox.style.display = 'block';
    }
  });

  /* -- Export Excel / CSV via Client-Side DB -- */
  document.getElementById('btn-export-excel')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof triggerClientSideExcelExport === 'function') {
      triggerClientSideExcelExport();
      showToast('Registrations exported successfully!');
    } else {
      apiFetch('/api/admin/export-excel');
    }
  });
});

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
