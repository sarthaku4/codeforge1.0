/* CODEFORGE — PARTICIPANT DASHBOARD SCRIPT */

async function renderDashboardContent() {
  const container = document.getElementById('dashboard-content');
  const indicator = document.getElementById('dashboard-team-indicator');
  if (!container || !indicator) return;

  container.innerHTML = '<p class="text-dim text-center" style="padding: 32px;">Loading your registration...</p>';

  let data;
  try {
    data = await apiFetch('/api/team/my-team');
  } catch (err) {
    container.innerHTML = `<div class="error-region text-center">${err.message}</div>`;
    return;
  }

  if (!data.registered) {
    state.user.hasTeam = false;

    if (state.settings && !state.settings.registration_open) {
      indicator.textContent = 'Account Status: Unregistered';
      container.innerHTML = `
        <div class="card max-w-640 mx-auto header-glow-card">
          <div class="card-body text-center">
            <div class="closed-icon-container">
              <i data-lucide="lock" class="icon-red"></i>
            </div>
            <h3 class="card-title text-uppercase">Registrations Closed</h3>
            <p class="card-desc mt-16">New team registrations are currently closed. If you need assistance, please contact the organizers.</p>
          </div>
        </div>
      `;
    } else {
      indicator.textContent = 'Account Status: Unregistered';
      container.innerHTML = `
        <div class="card max-w-640 mx-auto text-center header-glow-card">
          <div class="card-body">
            <div class="card-icon-container mx-auto">
              <i data-lucide="rocket" class="icon-amber"></i>
            </div>
            <h3 class="card-title text-uppercase">Start Your Journey</h3>
            <p class="card-desc mt-16">Establish your 4-member team to register for CodeForge 2026. Make sure you have details for all 4 members before starting.</p>
            <a href="register.html" class="btn btn-primary btn-block">
              Start Team Registration <span class="btn-underline"></span>
            </a>
          </div>
        </div>
      `;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  // Team exists
  const team    = data.team;
  const members = data.members;
  const payment = data.payment;
  state.user.hasTeam = true;

  const leader = members.find(m => m.is_leader === 1) || members[0];
  const payStatus = team.payment_status;
  const statusBadgeClass = `badge-${payStatus.toLowerCase()}`;

  indicator.innerHTML = `Team Status: <span class="badge ${statusBadgeClass}">${payStatus}</span>`;

  container.innerHTML = `
    <div class="card max-w-640 mx-auto header-glow-card">
      <div class="card-body">
        <div class="justify-between" style="display: flex; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="font-mono text-xs text-dim">REGISTRATION ID: <span class="text-amber">${team.registration_id}</span></span>
            <h3 class="card-title mt-16 text-uppercase">${team.team_name}</h3>
          </div>
          <div class="badge ${statusBadgeClass}">${payStatus}</div>
        </div>

        <div class="confirm-details-list mt-24">
          <div class="detail-row">
            <span class="detail-label">Team Leader:</span>
            <span class="detail-val">${leader ? leader.full_name : 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Members:</span>
            <span class="detail-val">4 Registered</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Mode:</span>
            <span class="detail-val">UPI Scan</span>
          </div>
        </div>

        <div id="dashboard-status-actions">
          ${renderDashboardActions(payStatus, team, payment)}
        </div>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderDashboardActions(status, team, payment) {
  const whatsappLink = state.settings?.whatsapp_group_link;

  if (status === 'Pending') {
    return `
      <div class="btn-group mt-24">
        <a href="payment.html" class="btn btn-primary btn-block">
          Continue to Payment <i data-lucide="wallet" class="w-14"></i>
          <span class="btn-underline"></span>
        </a>
      </div>
    `;
  } else if (status === 'Submitted') {
    return `
      <div class="alert-info mt-24">
        <i data-lucide="clock"></i>
        <p>Your payment details are submitted and are under review. No further action is required.</p>
      </div>
      ${whatsappLink ? `
        <a href="${whatsappLink}" target="_blank" rel="noopener" class="btn btn-block mt-16" style="background:#25D366; color:#000; font-weight:700; border:none; display:flex; align-items:center; justify-content:center; gap:8px;">
          <i data-lucide="message-circle" class="w-16"></i> Join Official WhatsApp Group
        </a>
      ` : ''}
    `;
  } else if (status === 'Verified') {
    return `
      <div class="alert-info mt-24" style="border-color: var(--verified-green)">
        <i data-lucide="check-circle" style="color: var(--verified-green)"></i>
        <p style="color: var(--verified-green)">Verification successful! Your team's slot is secured for CodeForge 2026. See you at the venue!</p>
      </div>

      ${whatsappLink ? `
        <a href="${whatsappLink}" target="_blank" rel="noopener" class="btn btn-block mt-16" style="background:#25D366; color:#000; font-weight:700; border:none; display:flex; align-items:center; justify-content:center; gap:8px; padding: 12px;">
          <i data-lucide="message-circle" class="w-16"></i> Join Official WhatsApp Group for Live Updates
        </a>
      ` : ''}

      <div class="btn-group mt-16">
        <button class="btn btn-secondary btn-block" onclick="downloadReceipt()">
          <i data-lucide="ticket" class="w-14"></i> Download Digital Entry Pass (Print / PDF)
        </button>
      </div>

      <!-- Hackathon Project Submission Portal -->
      <div class="card mt-24" style="border: var(--border-width) solid var(--border); background: var(--card); text-align: left;">
        <div class="card-body">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <h4 class="card-title text-uppercase" style="display:flex; align-items:center; gap:8px; font-size: var(--font-sm); margin: 0;">
              <i data-lucide="code-2" class="text-amber"></i> Project Submission
            </h4>
            ${team.project_title ? '<span class="badge badge-verified" style="font-size: 11px;">Submitted</span>' : '<span class="badge badge-pending" style="font-size: 11px;">Not Submitted</span>'}
          </div>
          <p class="card-desc mt-8" style="font-size: var(--font-xs); color: var(--muted-foreground);">Submit your project repository and demo links during the hackathon for the judging panel.</p>
          
          <form id="project-submission-form" class="mt-16" onsubmit="submitProjectDetails(event)">
            <div class="form-group mb-12">
              <label for="proj-title" style="font-size: var(--font-xs);">Project Title *</label>
              <input type="text" id="proj-title" value="${escapeHtml(team.project_title || '')}" required placeholder="e.g. AI-Powered Medical Diagnosis">
            </div>
            
            <div class="form-group mb-12">
              <label for="proj-theme" style="font-size: var(--font-xs);">Selected Track / Theme</label>
              <select id="proj-theme">
                <option value="Smart Healthcare" ${team.project_theme === 'Smart Healthcare' ? 'selected' : ''}>Smart Healthcare</option>
                <option value="Education & EdTech" ${team.project_theme === 'Education & EdTech' ? 'selected' : ''}>Education & EdTech</option>
                <option value="Smart Web & Automation" ${team.project_theme === 'Smart Web & Automation' ? 'selected' : ''}>Smart Web & Automation</option>
                <option value="Open Innovation" ${team.project_theme === 'Open Innovation' ? 'selected' : ''}>Open Innovation</option>
              </select>
            </div>
            
            <div class="form-group mb-12">
              <label for="proj-github" style="font-size: var(--font-xs);">GitHub Repository URL</label>
              <input type="url" id="proj-github" value="${escapeHtml(team.github_url || '')}" placeholder="https://github.com/username/repo">
            </div>
            
            <div class="form-group mb-12">
              <label for="proj-demo" style="font-size: var(--font-xs);">Live Demo / Presentation Link</label>
              <input type="url" id="proj-demo" value="${escapeHtml(team.demo_url || '')}" placeholder="https://demo-app.com or Google Drive Video">
            </div>
            
            <div class="form-group mb-16">
              <label for="proj-desc" style="font-size: var(--font-xs);">Project Description / Summary</label>
              <textarea id="proj-desc" rows="3" style="width:100%; border-radius:4px; padding:8px 12px; background:var(--input); color:var(--foreground); border:var(--border-width) solid var(--border); font-size: var(--font-xs);" placeholder="Explain key features, tech stack, and what you built...">${escapeHtml(team.project_desc || '')}</textarea>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" id="btn-save-project">
              <span>${team.project_title ? 'Update Project Submission' : 'Submit Project'}</span>
              <i data-lucide="send" class="w-14"></i>
              <span class="btn-underline"></span>
            </button>
          </form>
        </div>
      </div>
    `;
  } else if (status === 'Rejected') {
    return `
      <div class="error-region mt-24">
        <p><strong>Payment Rejected:</strong> The organizer rejected your payment verification. Please re-submit payment details.</p>
      </div>
      <div class="btn-group mt-24">
        <a href="payment.html" class="btn btn-primary btn-block">
          Re-submit Payment Details <i data-lucide="refresh-cw" class="w-14"></i>
          <span class="btn-underline"></span>
        </a>
      </div>
    `;
  }
  return '';
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function submitProjectDetails(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-project');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

  const payload = {
    project_title: document.getElementById('proj-title').value.trim(),
    project_theme: document.getElementById('proj-theme').value,
    github_url:    document.getElementById('proj-github').value.trim(),
    demo_url:      document.getElementById('proj-demo').value.trim(),
    project_desc:  document.getElementById('proj-desc').value.trim()
  };

  try {
    const res = await apiFetch('/api/team/submit-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showToast(res.message || 'Project submitted successfully!');
    renderDashboardContent();
  } catch (err) {
    showToast(err.message || 'Failed to submit project.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Submit Project</span> <i data-lucide="send" class="w-14"></i><span class="btn-underline"></span>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }
}

async function downloadReceipt() {
  let data;
  try {
    data = await apiFetch('/api/team/my-team');
  } catch (_) { return; }

  if (!data.registered) return;

  const team    = data.team;
  const members = data.members;
  const payment = data.payment;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(team.registration_id)}`;

  // Create printable popup ticket
  const ticketWindow = window.open('', '_blank', 'width=800,height=900');
  if (!ticketWindow) {
    showToast('Please allow popups to print entry pass', 'error');
    return;
  }

  ticketWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CodeForge Entry Pass — ${team.registration_id}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #0f1117; color: #f3f4f6; padding: 32px; display: flex; justify-content: center; }
        .pass-card { max-width: 680px; width: 100%; border: 2px solid #27272a; border-radius: 12px; background: #18181b; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .pass-header { background: #09090b; padding: 24px 32px; border-bottom: 2px solid #ff5722; display: flex; justify-content: space-between; align-items: center; }
        .logo-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .logo-accent { color: #ff5722; }
        .college-sub { font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
        .pass-badge { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid #22c55e; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .pass-body { padding: 32px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 140px; gap: 24px; align-items: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px dashed #27272a; }
        .reg-num { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #ff9800; font-weight: 700; letter-spacing: 0.05em; }
        .team-title { font-size: 26px; font-weight: 800; color: #fff; margin-top: 6px; text-transform: uppercase; }
        .qr-box { background: #fff; padding: 8px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .qr-box img { width: 124px; height: 124px; }
        .section-title { font-size: 12px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
        .members-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .member-card { background: #27272a; padding: 12px 14px; border-radius: 6px; border-left: 3px solid #71717a; }
        .member-card.leader { border-left-color: #ff5722; background: #2a221f; }
        .member-name { font-weight: 700; font-size: 14px; color: #fff; }
        .member-meta { font-size: 11px; color: #a1a1aa; margin-top: 4px; line-height: 1.4; }
        .pass-footer { background: #09090b; padding: 16px 32px; font-size: 11px; color: #71717a; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #27272a; }
        .btn-print { background: #ff5722; color: #fff; border: none; padding: 10px 20px; font-weight: 700; border-radius: 6px; cursor: pointer; font-size: 13px; margin-top: 16px; }
        @media print {
          body { background: #fff; color: #000; padding: 0; }
          .pass-card { border-color: #000; background: #fff; color: #000; box-shadow: none; max-width: 100%; }
          .pass-header, .pass-footer { background: #f4f4f5; color: #000; }
          .team-title, .member-name { color: #000; }
          .member-card { background: #f4f4f5; border-color: #000; }
          .btn-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="pass-card">
        <div class="pass-header">
          <div>
            <div class="logo-title">Code<span class="logo-accent">Forge</span> 2026</div>
            <div class="college-sub">Baba Saheb Naik College of Engineering, Pusad</div>
          </div>
          <div class="pass-badge">Official Entry Pass</div>
        </div>
        <div class="pass-body">
          <div class="grid-2">
            <div>
              <div class="reg-num">REG ID: ${team.registration_id}</div>
              <div class="team-title">${team.team_name}</div>
              <div style="font-size: 12px; color: #a1a1aa; margin-top: 8px;">
                Transaction Ref: <strong style="color: #fff;">${payment ? payment.transaction_id : 'VERIFIED'}</strong> | Registered: ${new Date(team.created_at).toLocaleDateString()}
              </div>
            </div>
            <div class="qr-box">
              <img src="${qrUrl}" alt="QR">
            </div>
          </div>

          <div class="section-title">Verified Team Roster (4 Members)</div>
          <div class="members-grid">
            ${members.map((m, idx) => `
              <div class="member-card ${m.is_leader ? 'leader' : ''}">
                <div class="member-name">${m.is_leader ? '★ ' : ''}${m.full_name}</div>
                <div class="member-meta">
                  Year ${m.year}, ${m.branch} (${m.section})<br>
                  ${m.college}<br>
                  <span style="font-family: monospace;">${m.mobile}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="text-align: center;">
            <button class="btn-print" onclick="window.print()">🖨️ Print Pass / Save as PDF</button>
          </div>
        </div>
        <div class="pass-footer">
          <span>Reporting: 8:30 AM at Department of CSE</span>
          <span>Security Verification Seal: VALID</span>
        </div>
      </div>
    </body>
    </html>
  `);
  ticketWindow.document.close();
}

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for db.js to finish loading session + settings before rendering
  await window.cfReady;
  renderDashboardContent();
});
