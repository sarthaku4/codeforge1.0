/* CODEFORGE — PAYMENT SCREEN SCRIPT */

let selectedFile = null;   // The actual File object for multer upload

async function renderPaymentView() {
  // Load settings for fee / UPI / QR
  const settings = state.settings || {};
  const payFee   = document.getElementById('payment-fee-amount');
  const payUpi   = document.getElementById('payment-upi-id');
  const qrImage  = document.getElementById('payment-qr-image');
  const qrFallback = document.getElementById('payment-qr-fallback');

  if (payFee) payFee.textContent = `₹ ${settings.registration_fee || '—'}.00`;
  if (payUpi) payUpi.textContent  = settings.upi_id || 'N/A';

  if (qrImage && qrFallback) {
    if (settings.qr_code_path) {
      qrImage.src            = settings.qr_code_path;
      qrImage.style.display  = 'block';
      qrFallback.style.display = 'none';
    } else {
      qrImage.style.display  = 'none';
      qrFallback.style.display = 'flex';
    }
  }

  // Get team data to show current status badge
  let teamData;
  try {
    teamData = await apiFetch('/api/team/my-team');
  } catch (_) {
    window.location.href = 'dashboard.html';
    return;
  }

  if (!teamData.registered) {
    window.location.href = 'dashboard.html';
    return;
  }

  const statusBadge = document.getElementById('payment-status-badge');
  if (statusBadge) {
    const ps = teamData.team.payment_status;
    statusBadge.textContent = ps;
    statusBadge.className   = `badge badge-${ps.toLowerCase()}`;
  }

  // Reset UI
  selectedFile = null;
  document.getElementById('payment-form').reset();
  document.getElementById('payment-error-box').style.display = 'none';
  document.getElementById('btn-submit-payment').disabled = true;
  document.getElementById('upload-zone-content-default').style.display = 'flex';
  document.getElementById('upload-zone-preview-pane').style.display   = 'none';

  /* -- File drop zone -- */
  const dropZone  = document.getElementById('file-drop-zone');
  const fileInput = document.getElementById('pay-screenshot');
  const txInput   = document.getElementById('pay-transaction-id');

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent)';
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border)';
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border)';
    if (e.dataTransfer.files.length) handleSelectedFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleSelectedFile(e.target.files[0]);
  });

  txInput.addEventListener('input', checkPaymentFormValidity);

  document.getElementById('btn-replace-upload').addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null;
    document.getElementById('upload-zone-content-default').style.display = 'flex';
    document.getElementById('upload-zone-preview-pane').style.display   = 'none';
    fileInput.value = '';
    checkPaymentFormValidity();
  });

  /* -- Copy UPI button -- */
  const btnCopy = document.getElementById('btn-copy-upi');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const upiText = document.getElementById('payment-upi-id').textContent;
      navigator.clipboard.writeText(upiText).then(() => {
        const icon = btnCopy.querySelector('i');
        icon.setAttribute('data-lucide', 'check');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => {
          icon.setAttribute('data-lucide', 'copy');
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 1500);
      });
    });
  }

  /* -- Form submit — send multipart/form-data to the API -- */
  document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('payment-error-box');
    errorBox.style.display = 'none';

    const transactionVal = document.getElementById('pay-transaction-id').value.trim();
    if (!transactionVal || !selectedFile) return;

    const btn = document.getElementById('btn-submit-payment');
    btn.disabled     = true;
    btn.textContent  = 'Submitting…';

    const formData = new FormData();
    formData.append('transaction_id', transactionVal);
    formData.append('screenshot', selectedFile);

    try {
      await apiFetch('/api/team/submit-payment', {
        method: 'POST',
        body: formData
      });
      window.location.href = 'success.html';
    } catch (err) {
      errorBox.textContent   = err.message || 'Failed to submit payment. Please try again.';
      errorBox.style.display = 'block';
      btn.disabled           = false;
      btn.innerHTML          = 'Submit Payment <span class="btn-underline"></span>';
    }
  });
}

function handleSelectedFile(file) {
  const errorBox = document.getElementById('payment-error-box');
  errorBox.style.display = 'none';

  if (file.size > 5 * 1024 * 1024) {
    errorBox.textContent   = 'File is too large. Screenshot must be under 5MB.';
    errorBox.style.display = 'block';
    return;
  }

  selectedFile = file;

  // Show thumbnail preview via FileReader
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('upload-zone-content-default').style.display = 'none';
    document.getElementById('upload-zone-preview-pane').style.display   = 'flex';
    document.getElementById('upload-image-thumbnail').src = e.target.result;
    document.getElementById('upload-filename-text').textContent = file.name;
    checkPaymentFormValidity();
  };
  reader.readAsDataURL(file);
}

function checkPaymentFormValidity() {
  const txVal   = document.getElementById('pay-transaction-id').value.trim();
  const isValid = txVal.length >= 6 && selectedFile !== null;
  document.getElementById('btn-submit-payment').disabled = !isValid;
}

document.addEventListener('DOMContentLoaded', async () => {
  await window.cfReady;
  renderPaymentView();
});
