// Theme Initialization (Avoid visual flashes of theme transitions)
(function() {
  const savedTheme = localStorage.getItem('cf_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

/* =========================================================
   CODEFORGE — FULLY CLIENT-SIDE DATABASE & AUTH ENGINE
   100% Pure HTML + CSS + JavaScript (Zero Server Required)
   Runs entirely in the browser and ready for Static Hosting.
   ========================================================= */

const DB_KEYS = {
  USERS:       'cf_users',
  TEAMS:       'cf_teams',
  MEMBERS:     'cf_members',
  PAYMENTS:    'cf_payments',
  SETTINGS:    'cf_settings',
  SESSION:     'cf_session',
  FORM_CLICKS: 'cf_form_clicks'
};

const DEFAULT_SETTINGS = {
  id: 1,
  event_name: 'CodeForge 2026',
  registration_fee: 400.0,
  registration_open: 1,
  max_teams: 40,
  upi_id: 'codeforge@upi',
  organizer1_name: 'Krishna Anantwar',
  organizer1_phone: '+91 84463 34754',
  organizer2_name: 'Aayush Bhaskarwar',
  organizer2_phone: '+91 94035 88874',
  organizer3_name: 'Anuj Thakare',
  organizer3_phone: '+91 90224 64865',
  organizer4_name: 'Sarthak Ubale',
  organizer4_phone: '+91 94221 20054',
  whatsapp_group_link: 'https://chat.whatsapp.com/EXKse2ergW1GGqwP6yzrMN?s=sh&p=a&ilr=4',
  instagram_link: 'https://www.instagram.com/codeforge1.0?igsh=NWptZmF2cG0xMThy',
  announcement_text: '🚀 Welcome to CodeForge 2026! Registrations are now open.',
  announcement_active: 0,
  brochure_url: 'img/CodeForge26_STUDENT HANDBOOK.pdf.pdf',
  college_logo_path: '',
  qr_code_path: ''
};

const DEFAULT_USERS = [
  { id: 1, email: 'admin@codeforge.org', password: 'admin', role: 'admin', created_at: new Date().toISOString() },
  { id: 2, email: 'coordinator@bncoe.ac.in', password: 'admin', role: 'admin', created_at: new Date().toISOString() }
];

// Helper functions for LocalStorage DB
function getDB(key, fallback = []) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    console.error('Error reading localStorage key:', key, e);
    return fallback;
  }
}

function setDB(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Error saving localStorage key:', key, e);
  }
}

// Initialize seed data if missing
function initClientDatabase() {
  if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
    setDB(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
  } else {
    // Ensure all keys exist in settings
    const current = getDB(DB_KEYS.SETTINGS, {});
    if (current.registration_fee === 500) {
      current.registration_fee = 400.0;
    }
    if (current.max_teams === 100) {
      current.max_teams = 40;
    }
    if (current.brochure_url && current.brochure_url.includes('STUDENT_HANDBOOK_final')) {
      current.brochure_url = 'img/CodeForge26_STUDENT HANDBOOK.pdf.pdf';
    }
    if (!current.whatsapp_group_link || current.whatsapp_group_link.includes('CodeForge2026')) {
      current.whatsapp_group_link = 'https://chat.whatsapp.com/EXKse2ergW1GGqwP6yzrMN?s=sh&p=a&ilr=4';
    }
    if (!current.instagram_link) {
      current.instagram_link = 'https://www.instagram.com/codeforge1.0?igsh=NWptZmF2cG0xMThy';
    }
    const merged = { ...DEFAULT_SETTINGS, ...current };
    setDB(DB_KEYS.SETTINGS, merged);
  }

  if (!localStorage.getItem(DB_KEYS.USERS)) {
    setDB(DB_KEYS.USERS, DEFAULT_USERS);
  }
  if (!localStorage.getItem(DB_KEYS.TEAMS)) {
    setDB(DB_KEYS.TEAMS, []);
  }
  if (!localStorage.getItem(DB_KEYS.MEMBERS)) {
    setDB(DB_KEYS.MEMBERS, []);
  }
  if (!localStorage.getItem(DB_KEYS.PAYMENTS)) {
    setDB(DB_KEYS.PAYMENTS, []);
  }
  if (!localStorage.getItem(DB_KEYS.FORM_CLICKS)) {
    setDB(DB_KEYS.FORM_CLICKS, []);
  }
}

initClientDatabase();

// Global in-memory state
const state = {
  user: null,       // populated on cfReady
  settings: null    // populated on cfReady
};
window.state = state;

/* ---------------------------------------------------------
   Core Client-Side API Router (apiFetch)
   Seamlessly handles all /api/* requests inside pure JavaScript
   --------------------------------------------------------- */
async function apiFetch(url, options = {}) {
  // Ultra-fast simulated network response
  await new Promise(r => setTimeout(r, 20));

  const method = (options.method || 'GET').toUpperCase();
  const parsedUrl = new URL(url, window.location.origin || 'http://localhost');
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  let body = null;
  if (options.body) {
    if (typeof options.body === 'string') {
      try { body = JSON.parse(options.body); } catch (_) { body = options.body; }
    } else if (options.body instanceof FormData) {
      body = {};
      for (const [k, v] of options.body.entries()) {
        body[k] = v;
      }
    } else {
      body = options.body;
    }
  }

  // --- Route Handlers ---

  // GET /api/settings
  if (pathname === '/api/settings' && method === 'GET') {
    return getDB(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  // POST /api/track/form-click
  if (pathname === '/api/track/form-click' && method === 'POST') {
    const clicks = getDB(DB_KEYS.FORM_CLICKS, []);
    clicks.push({
      event: 'google_form_click',
      ts: (body && body.ts) || new Date().toISOString()
    });
    setDB(DB_KEYS.FORM_CLICKS, clicks);
    return { success: true, count: clicks.length };
  }

  // GET /api/admin/form-clicks
  if (pathname === '/api/admin/form-clicks' && method === 'GET') {
    const clicks = getDB(DB_KEYS.FORM_CLICKS, []);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayClicks = clicks.filter(c => (c.ts || '').startsWith(todayStr));
    return {
      total: clicks.length,
      today: todayClicks.length
    };
  }

  // POST /api/auth/signup
  if (pathname === '/api/auth/signup' && method === 'POST') {
    const { email, password } = body || {};
    if (!email || !password) throw new Error('Email and password are required.');
    const users = getDB(DB_KEYS.USERS, []);
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) throw new Error('An account with this email already exists.');

    const newUser = {
      id: Date.now(),
      email: email.toLowerCase().trim(),
      password: password,
      role: 'participant',
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    setDB(DB_KEYS.USERS, users);

    // Auto login
    setDB(DB_KEYS.SESSION, { user_id: newUser.id, logged_in_at: new Date().toISOString() });
    return { id: newUser.id, email: newUser.email, role: newUser.role, hasTeam: false };
  }

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const { email, password } = body || {};
    if (!email || !password) throw new Error('Email and password are required.');
    const users = getDB(DB_KEYS.USERS, []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password.');
    }

    const teams = getDB(DB_KEYS.TEAMS, []);
    const team = teams.find(t => t.user_id === user.id);

    setDB(DB_KEYS.SESSION, { user_id: user.id, logged_in_at: new Date().toISOString() });
    return { id: user.id, email: user.email, role: user.role, hasTeam: !!team };
  }

  // GET /api/auth/me
  if (pathname === '/api/auth/me' && method === 'GET') {
    const session = getDB(DB_KEYS.SESSION, null);
    if (!session || !session.user_id) {
      return { loggedIn: false };
    }
    const users = getDB(DB_KEYS.USERS, []);
    const user = users.find(u => u.id === session.user_id);
    if (!user) {
      setDB(DB_KEYS.SESSION, null);
      return { loggedIn: false };
    }
    const teams = getDB(DB_KEYS.TEAMS, []);
    const team = teams.find(t => t.user_id === user.id);
    return { loggedIn: true, id: user.id, email: user.email, role: user.role, hasTeam: !!team };
  }

  // POST /api/auth/logout
  if (pathname === '/api/auth/logout' && method === 'POST') {
    setDB(DB_KEYS.SESSION, null);
    return { success: true };
  }

  // GET /api/team/my-team
  if (pathname === '/api/team/my-team' && method === 'GET') {
    const session = getDB(DB_KEYS.SESSION, null);
    if (!session || !session.user_id) throw new Error('Not authenticated.');
    const teams = getDB(DB_KEYS.TEAMS, []);
    const team = teams.find(t => t.user_id === session.user_id);
    if (!team) return { registered: false };

    const members = getDB(DB_KEYS.MEMBERS, []).filter(m => m.team_id === team.id);
    const payment = getDB(DB_KEYS.PAYMENTS, []).find(p => p.team_id === team.id) || null;

    return { registered: true, team, members, payment };
  }

  // POST /api/team/register
  if (pathname === '/api/team/register' && method === 'POST') {
    const session = getDB(DB_KEYS.SESSION, null);
    if (!session || !session.user_id) throw new Error('Not authenticated.');
    const settings = getDB(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
    if (!settings.registration_open) throw new Error('Registration is currently closed.');

    const teams = getDB(DB_KEYS.TEAMS, []);
    const existingTeam = teams.find(t => t.user_id === session.user_id);
    if (existingTeam) throw new Error('You have already registered a team.');

    const { team_name, members } = body || {};
    if (!team_name || !team_name.trim()) throw new Error('Team name is required.');
    if (!members || members.length !== 4) throw new Error('Registration requires exactly 4 team members.');

    const nameDuplicate = teams.find(t => t.team_name.toLowerCase() === team_name.trim().toLowerCase());
    if (nameDuplicate) throw new Error('This team name is already taken. Please choose another.');

    const regId = 'CF2026-' + (1000 + teams.length + 1);
    const newTeam = {
      id: Date.now(),
      user_id: session.user_id,
      registration_id: regId,
      team_name: team_name.trim(),
      payment_status: 'Pending',
      checked_in: 0,
      project_title: '',
      project_theme: '',
      github_url: '',
      demo_url: '',
      project_desc: '',
      created_at: new Date().toISOString()
    };
    teams.push(newTeam);
    setDB(DB_KEYS.TEAMS, teams);

    const allMembers = getDB(DB_KEYS.MEMBERS, []);
    members.forEach((m, idx) => {
      allMembers.push({
        id: Date.now() + idx,
        team_id: newTeam.id,
        full_name: m.full_name,
        age: m.age,
        gender: m.gender,
        college: m.college,
        branch: m.branch,
        section: m.section,
        year: m.year,
        mobile: m.mobile,
        email: m.email,
        is_leader: m.is_leader ? 1 : 0,
        photo: m.photo || ''
      });
    });
    setDB(DB_KEYS.MEMBERS, allMembers);

    const allPayments = getDB(DB_KEYS.PAYMENTS, []);
    allPayments.push({
      id: Date.now(),
      team_id: newTeam.id,
      transaction_id: '',
      screenshot_path: '',
      status: 'Pending',
      created_at: new Date().toISOString()
    });
    setDB(DB_KEYS.PAYMENTS, allPayments);

    return { success: true, registrationId: regId };
  }

  // POST /api/team/payment or /api/team/submit-payment
  if ((pathname === '/api/team/payment' || pathname === '/api/team/submit-payment') && method === 'POST') {
    const session = getDB(DB_KEYS.SESSION, null);
    if (!session || !session.user_id) throw new Error('Not authenticated.');
    const teams = getDB(DB_KEYS.TEAMS, []);
    const team = teams.find(t => t.user_id === session.user_id);
    if (!team) throw new Error('No team found for current user.');

    const txId = (body.transaction_id || '').toString().trim();
    if (!txId) throw new Error('Transaction ID / UTR is required.');

    let screenshotData = '';
    if (body.screenshot instanceof File) {
      screenshotData = await fileToDataURL(body.screenshot);
    } else if (typeof body.screenshot === 'string') {
      screenshotData = body.screenshot;
    }

    const allPayments = getDB(DB_KEYS.PAYMENTS, []);
    let payment = allPayments.find(p => p.team_id === team.id);
    if (!payment) {
      payment = { id: Date.now(), team_id: team.id };
      allPayments.push(payment);
    }
    payment.transaction_id = txId;
    if (screenshotData) payment.screenshot_path = screenshotData;
    payment.status = 'Submitted';
    payment.submitted_at = new Date().toISOString();
    setDB(DB_KEYS.PAYMENTS, allPayments);

    team.payment_status = 'Submitted';
    setDB(DB_KEYS.TEAMS, teams);

    return { success: true, message: 'Payment details submitted successfully!' };
  }

  // POST /api/team/submit-project
  if (pathname === '/api/team/submit-project' && method === 'POST') {
    const session = getDB(DB_KEYS.SESSION, null);
    if (!session || !session.user_id) throw new Error('Not authenticated.');
    const teams = getDB(DB_KEYS.TEAMS, []);
    const team = teams.find(t => t.user_id === session.user_id);
    if (!team) throw new Error('No team found.');

    team.project_title = (body.project_title || '').trim();
    team.project_theme = (body.project_theme || '').trim();
    team.github_url    = (body.github_url || '').trim();
    team.demo_url      = (body.demo_url || '').trim();
    team.project_desc  = (body.project_desc || '').trim();
    setDB(DB_KEYS.TEAMS, teams);

    return { success: true, message: 'Project details updated successfully!' };
  }

  // GET /api/admin/stats
  if (pathname === '/api/admin/stats' && method === 'GET') {
    const users = getDB(DB_KEYS.USERS, []);
    const teams = getDB(DB_KEYS.TEAMS, []);
    const members = getDB(DB_KEYS.MEMBERS, []);

    const pending = teams.filter(t => t.payment_status === 'Pending').length;
    const submitted = teams.filter(t => t.payment_status === 'Submitted').length;
    const verified = teams.filter(t => t.payment_status === 'Verified').length;
    const rejected = teams.filter(t => t.payment_status === 'Rejected').length;
    const checkedIn = teams.filter(t => t.checked_in === 1).length;
    const projectsSubmitted = teams.filter(t => t.project_title && t.project_title.trim().length > 0).length;

    return {
      totalUsers: users.length,
      totalTeams: teams.length,
      totalParticipants: members.length,
      pending,
      submitted,
      verified,
      rejected,
      checkedIn,
      projectsSubmitted
    };
  }

  // GET /api/admin/registrations
  if (pathname === '/api/admin/registrations' && method === 'GET') {
    const teams = getDB(DB_KEYS.TEAMS, []);
    const allMembers = getDB(DB_KEYS.MEMBERS, []);
    const allPayments = getDB(DB_KEYS.PAYMENTS, []);

    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const status = searchParams.get('payment_status') || '';
    const college = (searchParams.get('college') || '').toLowerCase().trim();
    const branch = (searchParams.get('branch') || '').toLowerCase().trim();
    const year = searchParams.get('year') || '';
    const sortBy = searchParams.get('sort_by') || 'registration_id';
    const sortOrder = searchParams.get('sort_order') || 'asc';

    let result = teams.map(t => {
      const teamMembers = allMembers.filter(m => m.team_id === t.id);
      const teamPayment = allPayments.find(p => p.team_id === t.id) || {};
      return {
        ...t,
        members: teamMembers,
        transaction_id: teamPayment.transaction_id || '',
        screenshot_path: teamPayment.screenshot_path || ''
      };
    });

    if (search) {
      result = result.filter(t => {
        const matchTeam = t.team_name.toLowerCase().includes(search) || t.registration_id.toLowerCase().includes(search);
        const matchMember = (t.members || []).some(m =>
          (m.full_name || '').toLowerCase().includes(search) ||
          (m.email || '').toLowerCase().includes(search) ||
          (m.mobile || '').includes(search) ||
          (m.college || '').toLowerCase().includes(search)
        );
        return matchTeam || matchMember;
      });
    }

    if (status) result = result.filter(t => t.payment_status === status);
    if (college) result = result.filter(t => (t.members || []).some(m => (m.college || '').toLowerCase() === college));
    if (branch) result = result.filter(t => (t.members || []).some(m => (m.branch || '').toLowerCase() === branch));
    if (year) result = result.filter(t => (t.members || []).some(m => String(m.year) === year));

    result.sort((a, b) => {
      let vA = a[sortBy] || '';
      let vB = b[sortBy] || '';
      if (typeof vA === 'string') vA = vA.toLowerCase();
      if (typeof vB === 'string') vB = vB.toLowerCase();
      if (vA < vB) return sortOrder === 'asc' ? -1 : 1;
      if (vA > vB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }

  // POST /api/admin/verify-payment
  if (pathname === '/api/admin/verify-payment' && method === 'POST') {
    const { team_id, status: newStatus } = body || {};
    const teams = getDB(DB_KEYS.TEAMS, []);
    const team = teams.find(t => t.id === Number(team_id));
    if (!team) throw new Error('Team not found.');

    team.payment_status = newStatus;
    setDB(DB_KEYS.TEAMS, teams);

    const payments = getDB(DB_KEYS.PAYMENTS, []);
    const payment = payments.find(p => p.team_id === team.id);
    if (payment) {
      payment.status = newStatus;
      payment.reviewed_at = new Date().toISOString();
      setDB(DB_KEYS.PAYMENTS, payments);
    }

    return { success: true, message: `Team status updated to ${newStatus}` };
  }

  // POST /api/admin/toggle-checkin
  if (pathname === '/api/admin/toggle-checkin' && method === 'POST') {
    const { team_id } = body || {};
    const teams = getDB(DB_KEYS.TEAMS, []);
    const team = teams.find(t => t.id === Number(team_id));
    if (!team) throw new Error('Team not found.');

    team.checked_in = team.checked_in ? 0 : 1;
    setDB(DB_KEYS.TEAMS, teams);

    return { success: true, checked_in: team.checked_in };
  }

  // PUT /api/admin/registrations/:id
  if (pathname.startsWith('/api/admin/registrations/') && method === 'PUT') {
    const teamId = Number(pathname.split('/').pop());
    const teams = getDB(DB_KEYS.TEAMS, []);
    const team = teams.find(t => t.id === teamId);
    if (!team) throw new Error('Team not found.');

    const { team_name, members } = body || {};
    if (team_name) team.team_name = team_name.trim();
    setDB(DB_KEYS.TEAMS, teams);

    if (members && Array.isArray(members)) {
      const allMembers = getDB(DB_KEYS.MEMBERS, []);
      const otherMembers = allMembers.filter(m => m.team_id !== teamId);
      members.forEach((m, idx) => {
        otherMembers.push({
          id: Date.now() + idx,
          team_id: teamId,
          full_name: m.full_name || '',
          age: m.age || '',
          gender: m.gender || '',
          college: m.college || '',
          branch: m.branch || '',
          section: m.section || '',
          year: m.year || '',
          mobile: m.mobile || '',
          email: m.email || '',
          is_leader: m.is_leader ? 1 : 0
        });
      });
      setDB(DB_KEYS.MEMBERS, otherMembers);
    }

    return { success: true, message: 'Team updated successfully.' };
  }

  // DELETE /api/admin/registrations/:id
  if (pathname.startsWith('/api/admin/registrations/') && method === 'DELETE') {
    const teamId = Number(pathname.split('/').pop());
    const teams = getDB(DB_KEYS.TEAMS, []);
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) throw new Error('Team not found.');

    const team = teams[teamIndex];
    teams.splice(teamIndex, 1);
    setDB(DB_KEYS.TEAMS, teams);

    // Remove members, payments, and associated user
    const members = getDB(DB_KEYS.MEMBERS, []).filter(m => m.team_id !== teamId);
    setDB(DB_KEYS.MEMBERS, members);

    const payments = getDB(DB_KEYS.PAYMENTS, []).filter(p => p.team_id !== teamId);
    setDB(DB_KEYS.PAYMENTS, payments);

    const users = getDB(DB_KEYS.USERS, []).filter(u => u.id !== team.user_id);
    setDB(DB_KEYS.USERS, users);

    return { success: true, message: 'Team and account deleted successfully.' };
  }

  // POST / PUT /api/admin/settings
  if ((pathname === '/api/admin/settings' && (method === 'POST' || method === 'PUT'))) {
    const current = getDB(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);

    for (const [key, val] of Object.entries(body)) {
      if (val instanceof File) {
        if (val.size > 0) {
          const b64 = await fileToDataURL(val);
          if (key === 'qr_code') current.qr_code_path = b64;
          if (key === 'college_logo') current.college_logo_path = b64;
          if (key === 'event_logo') current.event_logo_path = b64;
        }
      } else if (typeof val === 'string' || typeof val === 'number') {
        if (key === 'registration_fee') current.registration_fee = parseFloat(val) || 0;
        else if (key === 'registration_open') current.registration_open = parseInt(val) || 0;
        else if (key === 'announcement_active') current.announcement_active = parseInt(val) || 0;
        else if (key === 'max_teams') current.max_teams = parseInt(val) || 100;
        else current[key] = val;
      }
    }

    setDB(DB_KEYS.SETTINGS, current);
    return { success: true, settings: current };
  }

  // GET /api/admin/backup
  if (pathname === '/api/admin/backup' && method === 'GET') {
    return {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      settings: getDB(DB_KEYS.SETTINGS, DEFAULT_SETTINGS),
      users: getDB(DB_KEYS.USERS, []),
      teams: getDB(DB_KEYS.TEAMS, []),
      members: getDB(DB_KEYS.MEMBERS, []),
      payments: getDB(DB_KEYS.PAYMENTS, []),
      form_clicks: getDB(DB_KEYS.FORM_CLICKS, [])
    };
  }

  // POST /api/admin/restore
  if (pathname === '/api/admin/restore' && method === 'POST') {
    let backupObj = body;
    if (body.backupFile instanceof File) {
      const text = await body.backupFile.text();
      backupObj = JSON.parse(text);
    }
    if (!backupObj || !backupObj.teams || !backupObj.users) {
      throw new Error('Invalid backup JSON file.');
    }

    if (backupObj.settings)    setDB(DB_KEYS.SETTINGS, backupObj.settings);
    if (backupObj.users)       setDB(DB_KEYS.USERS, backupObj.users);
    if (backupObj.teams)       setDB(DB_KEYS.TEAMS, backupObj.teams);
    if (backupObj.members)     setDB(DB_KEYS.MEMBERS, backupObj.members);
    if (backupObj.payments)    setDB(DB_KEYS.PAYMENTS, backupObj.payments);
    if (backupObj.form_clicks) setDB(DB_KEYS.FORM_CLICKS, backupObj.form_clicks);

    return { success: true, message: 'Database successfully restored from backup!' };
  }

  // GET /api/admin/export-excel
  if (pathname === '/api/admin/export-excel') {
    triggerClientSideExcelExport();
    return { success: true };
  }

  // Default fallback for unhandled routes
  return {};
}
window.apiFetch = apiFetch;

// Helper to convert File to base64 DataURL
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------------------------------------------------------
   Client-Side Spreadsheet & CSV Export Generator
   Generates a full UTF-8 BOM CSV compatible with MS Excel
   --------------------------------------------------------- */
function triggerClientSideExcelExport() {
  const teams = getDB(DB_KEYS.TEAMS, []);
  const allMembers = getDB(DB_KEYS.MEMBERS, []);
  const allPayments = getDB(DB_KEYS.PAYMENTS, []);

  const headers = [
    'Registration ID', 'Team Name', 'Created Date', 'Payment Status', 'Transaction ID / UTR',
    'Venue Checked-In', 'Project Title', 'Project Track', 'GitHub Link', 'Demo Link', 'Project Summary',
    'Leader Name', 'Leader Email', 'Leader Phone', 'Leader College', 'Leader Branch', 'Leader Year',
    'Member 2 Name', 'Member 2 Email', 'Member 2 Phone', 'Member 2 College', 'Member 2 Branch', 'Member 2 Year',
    'Member 3 Name', 'Member 3 Email', 'Member 3 Phone', 'Member 3 College', 'Member 3 Branch', 'Member 3 Year',
    'Member 4 Name', 'Member 4 Email', 'Member 4 Phone', 'Member 4 College', 'Member 4 Branch', 'Member 4 Year'
  ];

  const rows = [headers];

  teams.forEach(t => {
    const members = allMembers.filter(m => m.team_id === t.id);
    const payment = allPayments.find(p => p.team_id === t.id) || {};
    const leader = members.find(m => m.is_leader === 1) || members[0] || {};
    const nonLeaders = members.filter(m => m.id !== leader.id);

    const m2 = nonLeaders[0] || {};
    const m3 = nonLeaders[1] || {};
    const m4 = nonLeaders[2] || {};

    const row = [
      t.registration_id,
      t.team_name,
      new Date(t.created_at).toLocaleString(),
      t.payment_status,
      payment.transaction_id || 'N/A',
      t.checked_in ? 'YES (Present)' : 'NO',
      t.project_title || '',
      t.project_theme || '',
      t.github_url || '',
      t.demo_url || '',
      t.project_desc || '',

      // Leader
      leader.full_name || '',
      leader.email || '',
      leader.mobile || '',
      leader.college || '',
      leader.branch || '',
      leader.year || '',

      // M2
      m2.full_name || '',
      m2.email || '',
      m2.mobile || '',
      m2.college || '',
      m2.branch || '',
      m2.year || '',

      // M3
      m3.full_name || '',
      m3.email || '',
      m3.mobile || '',
      m3.college || '',
      m3.branch || '',
      m3.year || '',

      // M4
      m4.full_name || '',
      m4.email || '',
      m4.mobile || '',
      m4.college || '',
      m4.branch || '',
      m4.year || ''
    ];

    rows.push(row);
  });

  const csvContent = rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CodeForge_Master_Registrations_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
window.triggerClientSideExcelExport = triggerClientSideExcelExport;

/* ---------------------------------------------------------
   Apply global branding from settings (header logo + footer)
   --------------------------------------------------------- */
function applyGlobalBranding() {
  if (!state.settings) return;

  const logoIcon = document.getElementById('logo-icon-fallback');
  const logoImg  = document.getElementById('header-college-logo');

  if (logoImg && logoIcon) {
    if (state.settings.college_logo_path) {
      logoImg.src = state.settings.college_logo_path;
      logoImg.style.display = 'block';
      logoIcon.style.display = 'none';
    } else {
      logoImg.style.display = 'none';
      logoIcon.style.display = 'block';
    }
  }

  const container = document.getElementById('footer-organizers-list');
  if (container) {
    container.innerHTML = '';
    const orgs = [
      { name: state.settings.organizer1_name, phone: state.settings.organizer1_phone },
      { name: state.settings.organizer2_name, phone: state.settings.organizer2_phone },
      { name: state.settings.organizer3_name, phone: state.settings.organizer3_phone },
      { name: state.settings.organizer4_name, phone: state.settings.organizer4_phone }
    ];
    orgs.forEach(org => {
      if (org.name && org.phone) {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="org-name">${org.name}</span>
          <span class="org-phone font-mono">${org.phone}</span>
        `;
        container.appendChild(li);
      }
    });

    // Append dynamic student coordinators note
    let note = document.getElementById('footer-organizers-note');
    if (!note && container.parentNode) {
      note = document.createElement('div');
      note.id = 'footer-organizers-note';
      note.className = 'footer-about-text mt-12';
      note.style.fontSize = 'var(--font-xs)';
      note.style.color = 'var(--muted-foreground)';
      note.style.lineHeight = 'var(--lh-normal)';
      note.innerHTML = `<span style="font-weight:600; color:var(--foreground);">Note:</span> The organizers are students, so please try to call them between 8:00–11:00 AM or 6:00–10:00 PM. They may be attending lectures during other hours. If they are unavailable when you call, they will return your call once they are free.`;
      container.parentNode.appendChild(note);
    }
  }

  // Render Top Announcement Banner if active
  if (state.settings.announcement_active && state.settings.announcement_text && state.settings.announcement_text.trim()) {
    let banner = document.getElementById('global-announcement-bar');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'global-announcement-bar';
      banner.style.cssText = 'background: linear-gradient(90deg, #ff5722, #ff9800); color: #000; font-weight: 600; font-size: 13px; text-align: center; padding: 8px 16px; display: flex; align-items: center; justify-content: center; gap: 8px; z-index: 9999; position: relative; letter-spacing: 0.02em;';
      banner.innerHTML = `<i data-lucide="megaphone" style="width: 16px; height: 16px; flex-shrink: 0;"></i> <span>${state.settings.announcement_text}</span>`;
      document.body.insertBefore(banner, document.body.firstChild);
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  // Update brochure download link if present
  const brochureBtn = document.getElementById('btn-download-brochure');
  if (brochureBtn) {
    const defaultBrochure = 'img/CodeForge26_STUDENT HANDBOOK.pdf.pdf';
    const activeUrl = (state.settings && state.settings.brochure_url && state.settings.brochure_url.trim()) ? state.settings.brochure_url.trim() : defaultBrochure;
    brochureBtn.href = activeUrl;
    brochureBtn.onclick = null;
  }
}

/* ---------------------------------------------------------
   Update header nav: show profile email + logout button,
   inject theme toggle.
   --------------------------------------------------------- */
function updateHeaderNavigation() {
  const rightCol = document.querySelector('.header-right');
  if (rightCol) {
    let toggle = document.getElementById('theme-toggle-btn');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.id = 'theme-toggle-btn';
      toggle.className = 'header-social-btn';
      toggle.setAttribute('title', 'Toggle Theme');
      toggle.setAttribute('aria-label', 'Toggle Theme');
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      toggle.innerHTML = `<i data-lucide="${currentTheme === 'dark' ? 'sun' : 'moon'}" class="w-14"></i>`;
      toggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('cf_theme', theme);
        toggle.innerHTML = `<i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}" class="w-14"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      });
      rightCol.insertBefore(toggle, rightCol.firstChild);
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    const waLink = (state.settings && state.settings.whatsapp_group_link) || 'https://chat.whatsapp.com/EXKse2ergW1GGqwP6yzrMN?s=sh&p=a&ilr=4';
    let waBtn = document.getElementById('header-whatsapp-btn');
    if (!waBtn) {
      waBtn = document.createElement('a');
      waBtn.id = 'header-whatsapp-btn';
      waBtn.className = 'header-social-btn whatsapp-btn';
      waBtn.href = waLink;
      waBtn.target = '_blank';
      waBtn.rel = 'noopener noreferrer';
      waBtn.setAttribute('title', 'Join WhatsApp Group');
      waBtn.setAttribute('aria-label', 'WhatsApp Group');
      waBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`;
      toggle.after(waBtn);
    } else {
      waBtn.href = waLink;
    }

    const igLink = (state.settings && state.settings.instagram_link) || 'https://www.instagram.com/codeforge1.0?igsh=NWptZmF2cG0xMThy';
    let igBtn = document.getElementById('header-instagram-btn');
    if (!igBtn) {
      igBtn = document.createElement('a');
      igBtn.id = 'header-instagram-btn';
      igBtn.className = 'header-social-btn instagram-btn';
      igBtn.href = igLink;
      igBtn.target = '_blank';
      igBtn.rel = 'noopener noreferrer';
      igBtn.setAttribute('title', 'Follow on Instagram');
      igBtn.setAttribute('aria-label', 'Instagram Profile');
      igBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`;
      waBtn.after(igBtn);
    } else {
      igBtn.href = igLink;
    }
  }

  const menu  = document.getElementById('user-profile-menu');
  const badge = document.getElementById('profile-badge-text');
  const email = document.getElementById('profile-email-text');

  if (menu && badge && email) {
    if (state.user && state.user.loggedIn) {
      menu.style.display = 'flex';
      badge.textContent = state.user.email.charAt(0).toUpperCase();
      email.textContent = state.user.email;
    } else {
      menu.style.display = 'none';
    }
  }
}

/* ---------------------------------------------------------
   Page guards — controls routing between public & private pages
   --------------------------------------------------------- */
function enforcePageGuards() {
  const path = window.location.pathname.toLowerCase();
  const page = path.split('/').pop() || 'index.html';
  const user = state.user;

  // Never redirect away from public information pages
  const publicPages = ['index.html', '', 'about.html', 'sponsors.html', 'contact.html', 'closed.html', 'terms.html', 'privacy.html'];
  if (publicPages.includes(page)) {
    return;
  }

  if (user && user.loggedIn) {
    if (user.role === 'admin') {
      if (page === 'admin-login.html') {
        window.location.replace('admin-dashboard.html');
      }
    } else {
      // Participant
      if (['admin-dashboard.html', 'admin-settings.html', 'admin-login.html'].includes(page)) {
        window.location.replace('dashboard.html');
      }
      if (page === 'register.html') {
        if (user.hasTeam) {
          window.location.replace('dashboard.html');
        } else if (state.settings && !state.settings.registration_open) {
          window.location.replace('closed.html');
        }
      }
    }
  } else {
    // Unauthenticated user trying to access private dashboard or settings
    const adminPages = ['admin-dashboard.html', 'admin-settings.html'];
    const participantPages = ['dashboard.html', 'payment.html', 'confirmation.html'];

    if (adminPages.includes(page)) {
      window.location.replace('admin-login.html');
    } else if (participantPages.includes(page)) {
      window.location.replace('index.html');
    }
  }
}

/* ---------------------------------------------------------
   Global toast notification renderer
   --------------------------------------------------------- */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close"><i data-lucide="x"></i></button>
  `;

  container.appendChild(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  });

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

/* ---------------------------------------------------------
   Logout helper (used by multiple pages)
   --------------------------------------------------------- */
async function doLogout() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (_) { /* ignore */ }
  state.user = null;
  window.location.replace('index.html');
}

/* ---------------------------------------------------------
   Bootstrap: load settings + session, then enforce guards.
   This runs on every page.
   --------------------------------------------------------- */
let _cfReadyResolve;
window.cfReady = new Promise(resolve => { _cfReadyResolve = resolve; });

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Fetch public settings
  try {
    state.settings = await apiFetch('/api/settings');
  } catch (_) {
    state.settings = DEFAULT_SETTINGS;
  }

  // 2. Check current session
  try {
    const me = await apiFetch('/api/auth/me');
    state.user = me;
  } catch (_) {
    state.user = { loggedIn: false };
  }

  // 3. Apply branding + navigation
  applyGlobalBranding();
  updateHeaderNavigation();

  // 4. Enforce page access rules
  enforcePageGuards();

  // 5. Check pending toast queue (cross-page notifications)
  const pendingToast = sessionStorage.getItem('cf_toast');
  if (pendingToast) {
    try {
      const data = JSON.parse(pendingToast);
      showToast(data.message, data.type);
    } catch (_) {}
    sessionStorage.removeItem('cf_toast');
  }

  // 6. Wire logout button if present
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', doLogout);
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();

  // 7. Signal to page scripts that bootstrap is done
  _cfReadyResolve();
});
