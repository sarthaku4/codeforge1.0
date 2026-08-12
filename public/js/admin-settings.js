/* CODEFORGE — ADMIN CONFIGURATION SETTINGS SCRIPT */

function renderAdminSettings() {
  const config = state.settings;
  if (!config) return;

  document.getElementById('settings-event-name').value = config.event_name || '';
  document.getElementById('settings-fee').value        = config.registration_fee || '';
  document.getElementById('settings-max-teams').value  = config.max_teams || '';

  const toggle = document.getElementById('settings-open-toggle');
  toggle.checked = !!config.registration_open;
  updateToggleLabel(!!config.registration_open);

  document.getElementById('settings-upi-id').value = config.upi_id || '';

  // WhatsApp, Instagram, and announcements
  const whatsappEl = document.getElementById('settings-whatsapp-link');
  if (whatsappEl) whatsappEl.value = config.whatsapp_group_link || '';

  const instagramEl = document.getElementById('settings-instagram-link');
  if (instagramEl) instagramEl.value = config.instagram_link || '';

  const brochureEl = document.getElementById('settings-brochure-link');
  if (brochureEl) brochureEl.value = config.brochure_url || '';

  const annToggle = document.getElementById('settings-announcement-toggle');
  if (annToggle) {
    annToggle.checked = !!config.announcement_active;
    updateAnnouncementLabel(!!config.announcement_active);
  }

  const annTextEl = document.getElementById('settings-announcement-text');
  if (annTextEl) annTextEl.value = config.announcement_text || '';

  const qrPreview = document.getElementById('settings-qr-preview');
  if (config.qr_code_path) {
    qrPreview.src = config.qr_code_path;
    qrPreview.style.display = 'block';
  } else {
    qrPreview.style.display = 'none';
  }

  const colLogoPreview = document.getElementById('settings-college-logo-preview');
  if (config.college_logo_path) {
    colLogoPreview.src = config.college_logo_path;
    colLogoPreview.style.display = 'block';
  } else {
    colLogoPreview.style.display = 'none';
  }

  const evLogoPreview = document.getElementById('settings-event-logo-preview');
  if (config.event_logo_path) {
    evLogoPreview.src = config.event_logo_path;
    evLogoPreview.style.display = 'block';
  } else {
    evLogoPreview.style.display = 'none';
  }

  // Organizer slots
  for (let i = 1; i <= 4; i++) {
    const nameEl  = document.getElementById(`org${i}-name`);
    const phoneEl = document.getElementById(`org${i}-phone`);
    if (nameEl)  nameEl.value  = config[`organizer${i}_name`]  || '';
    if (phoneEl) phoneEl.value = config[`organizer${i}_phone`] || '';
  }
}

function updateToggleLabel(isOpen) {
  const lbl = document.getElementById('settings-open-status-lbl');
  if (lbl) lbl.textContent = isOpen ? 'OPEN' : 'CLOSED';
}

function updateAnnouncementLabel(isActive) {
  const lbl = document.getElementById('settings-announcement-status-lbl');
  if (lbl) lbl.textContent = isActive ? 'ACTIVE / BROADCASTING' : 'DISABLED';
}

/* ---------------------------------------------------------
   Image file preview helpers (unchanged — no upload yet)
   --------------------------------------------------------- */
function bindImagePreview(inputId, previewId) {
  document.getElementById(inputId)?.addEventListener('change', (e) => {
    if (!e.target.files.length) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const preview = document.getElementById(previewId);
      preview.src   = ev.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(e.target.files[0]);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await window.cfReady;
  if (!document.getElementById('event-config-form')) return;

  renderAdminSettings();

  /* -- Toggle labels -- */
  document.getElementById('settings-open-toggle')?.addEventListener('change', (e) => {
    updateToggleLabel(e.target.checked);
  });

  document.getElementById('settings-announcement-toggle')?.addEventListener('change', (e) => {
    updateAnnouncementLabel(e.target.checked);
  });

  /* -- Image preview binds -- */
  bindImagePreview('settings-qr-file',           'settings-qr-preview');
  bindImagePreview('settings-college-logo-file', 'settings-college-logo-preview');
  bindImagePreview('settings-event-logo-file',   'settings-event-logo-preview');

  /* -- Event config form: POST to /api/admin/settings -- */
  document.getElementById('event-config-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

    const formData = new FormData();
    formData.append('event_name',        document.getElementById('settings-event-name').value.trim());
    formData.append('registration_fee',  document.getElementById('settings-fee').value);
    formData.append('max_teams',         document.getElementById('settings-max-teams').value);
    formData.append('registration_open', document.getElementById('settings-open-toggle').checked ? '1' : '0');
    formData.append('upi_id',            document.getElementById('settings-upi-id').value.trim());

    formData.append('whatsapp_group_link', document.getElementById('settings-whatsapp-link')?.value.trim() || '');
    formData.append('instagram_link',      document.getElementById('settings-instagram-link')?.value.trim() || '');
    formData.append('brochure_url',        document.getElementById('settings-brochure-link')?.value.trim() || '');
    formData.append('announcement_active', document.getElementById('settings-announcement-toggle')?.checked ? '1' : '0');
    formData.append('announcement_text',   document.getElementById('settings-announcement-text')?.value.trim() || '');

    // Attach QR file if selected
    const qrFile = document.getElementById('settings-qr-file')?.files[0];
    if (qrFile) formData.append('qr_code', qrFile);

    // Attach college logo if selected
    const colFile = document.getElementById('settings-college-logo-file')?.files[0];
    if (colFile) formData.append('college_logo', colFile);

    // Attach event logo if selected
    const evFile = document.getElementById('settings-event-logo-file')?.files[0];
    if (evFile) formData.append('event_logo', evFile);

    // Organizers
    for (let i = 1; i <= 4; i++) {
      formData.append(`organizer${i}_name`,  document.getElementById(`org${i}-name`)?.value.trim()  || '');
      formData.append(`organizer${i}_phone`, document.getElementById(`org${i}-phone`)?.value.trim() || '');
    }

    try {
      await apiFetch('/api/admin/settings', { method: 'POST', body: formData });
      // Refresh state.settings from server
      state.settings = await apiFetch('/api/settings');
      applyGlobalBranding();
      showToast('Settings saved successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      if (btn) {
        btn.disabled    = false;
        btn.textContent = 'Save Settings';
      }
    }
  });

  /* -- Branding + organizers form: combined into event-config-form above.
        If you have a separate branding-organizer-form, wire it here. -- */
  document.getElementById('branding-organizer-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

    const formData = new FormData();

    const colFile = document.getElementById('settings-college-logo-file')?.files[0];
    if (colFile) formData.append('college_logo', colFile);
    const evFile = document.getElementById('settings-event-logo-file')?.files[0];
    if (evFile) formData.append('event_logo', evFile);

    for (let i = 1; i <= 4; i++) {
      formData.append(`organizer${i}_name`,  document.getElementById(`org${i}-name`)?.value.trim()  || '');
      formData.append(`organizer${i}_phone`, document.getElementById(`org${i}-phone`)?.value.trim() || '');
    }

    try {
      await apiFetch('/api/admin/settings', { method: 'POST', body: formData });
      state.settings = await apiFetch('/api/settings');
      applyGlobalBranding();
      showToast('Branding and contacts saved!');
    } catch (err) {
      showToast(err.message || 'Failed to save branding.', 'error');
    } finally {
      if (btn) {
        btn.disabled    = false;
        btn.textContent = 'Save Branding';
      }
    }
  });

  /* -- Export Database Backup JSON -- */
  document.getElementById('btn-export-backup')?.addEventListener('click', async () => {
    try {
      const data = await apiFetch('/api/admin/backup');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `CodeForge_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Backup JSON downloaded successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to download database backup.', 'error');
    }
  });

  /* -- Import Database Backup JSON -- */
  const backupInput = document.getElementById('input-import-backup');
  const filenameLabel = document.getElementById('lbl-backup-filename');

  backupInput?.addEventListener('change', async (e) => {
    if (!e.target.files.length) return;
    const file = e.target.files[0];
    if (filenameLabel) filenameLabel.textContent = file.name;

    if (!confirm('Are you sure you want to restore? This will overwrite all current team registrations, users, payments, and settings settings!')) {
      e.target.value = '';
      if (filenameLabel) filenameLabel.textContent = 'No file chosen';
      return;
    }

    const formData = new FormData();
    formData.append('backupFile', file);

    try {
      showToast('Restoring database...', 'info');
      const res = await apiFetch('/api/admin/restore', {
        method: 'POST',
        body: formData
      });
      showToast(res.message || 'Database restored successfully!');
      
      // Reload page to reflect new settings/theme/database state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      showToast(err.message || 'Failed to restore database.', 'error');
      e.target.value = '';
      if (filenameLabel) filenameLabel.textContent = 'No file chosen';
    }
  });
});
