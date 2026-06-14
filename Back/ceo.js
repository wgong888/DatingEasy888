const $ = (selector) => document.querySelector(selector);

const state = {
  dashboard: null,
  selectedApprovalId: null
};

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      headers: options.body ? { 'Content-Type': 'application/json' } : {},
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    throw new Error('Cannot reach the DatingEasy888 service. Please refresh after the server is running.');
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Request failed with status ${response.status}.`);
  }
  if (!response.ok || !payload.success) {
    const error = new Error(payload.error?.message || 'Request failed.');
    error.code = payload.error?.code;
    throw error;
  }
  return payload.data;
}

function setStatus(message, tone = '') {
  const element = $('#ceo-status');
  element.textContent = message;
  element.className = `admin-status ${tone}`.trim();
}

function money(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(Number(value));
}

function formatTime(value) {
  return new Date(value).toLocaleString();
}

function selectedApproval() {
  return state.dashboard?.approvals.find(
    (item) => item.outgoingPaymentRequestId === state.selectedApprovalId
  );
}

function renderFinance(data) {
  const periods = [
    ['Current year', 'year'],
    ['Current month', 'month'],
    ['Current day', 'day']
  ];
  $('#finance-grid').innerHTML = periods.map(([label, key]) => `
    <article class="finance-period">
      <span>${label}</span>
      <div><small>Revenue</small><strong>${money(data.revenue[key])}</strong></div>
      <div><small>Expense</small><strong>${money(data.expense[key])}</strong></div>
      <div class="net-value"><small>Net</small><strong>${money(data.revenue[key] - data.expense[key])}</strong></div>
    </article>
  `).join('');
}

function renderOnline(data) {
  const items = [
    ['Real customers', data.realCustomers],
    ['Employees', data.employees],
    ['Seed customers', data.seedCustomers],
    ['Robot customers', data.robotCustomers]
  ];
  $('#online-grid').innerHTML = items.map(([label, value]) => `
    <article><span class="online-dot"></span><div><strong>${value}</strong><span>${label}</span></div></article>
  `).join('');
}

function renderHealth(data) {
  $('#health-checked').textContent = `Checked ${formatTime(data.checkedAt)}`;
  $('#ceo-health-list').innerHTML = data.services.map((service) => `
    <article>
      <span class="health-dot ${service.status.toLowerCase()}"></span>
      <div><strong>${escapeHtml(service.name)}</strong><span>${escapeHtml(service.detail)}</span></div>
      <b>${escapeHtml(service.status)}</b>
    </article>
  `).join('');
}

function renderApprovalDetail() {
  const item = selectedApproval();
  if (!item) {
    $('#approval-detail').innerHTML = `
      <div class="approval-empty">
        <strong>${state.dashboard.approvals.length ? 'Select a payment request' : 'No approvals waiting'}</strong>
        <span>${state.dashboard.approvals.length ? 'Review the full request before approving or denying it.' : 'The outgoing-payment queue is clear.'}</span>
      </div>
    `;
    return;
  }
  $('#approval-detail').innerHTML = `
    <div class="approval-detail-heading">
      <span>${escapeHtml(item.category)}</span>
      <strong>${money(item.amount)}</strong>
    </div>
    <dl>
      <div><dt>Payee</dt><dd>${escapeHtml(item.payeeName)}</dd></div>
      <div><dt>Prepared by</dt><dd>${escapeHtml(item.requestedByName)}</dd></div>
      <div><dt>Requested</dt><dd>${formatTime(item.requestTime)}</dd></div>
      <div><dt>Description</dt><dd>${escapeHtml(item.description)}</dd></div>
    </dl>
    <label>Decision note<textarea id="decision-remark" rows="3" maxlength="500" placeholder="Optional note for the audit record"></textarea></label>
    <div class="approval-actions">
      <button class="danger-button" type="button" data-decision="deny">Deny</button>
      <button class="primary" type="button" data-decision="approve">Approve payment</button>
    </div>
  `;
}

function renderApprovals(items) {
  $('#approval-count').textContent = `${items.length} waiting`;
  if (!items.some((item) => item.outgoingPaymentRequestId === state.selectedApprovalId)) {
    state.selectedApprovalId = items[0]?.outgoingPaymentRequestId || null;
  }
  $('#approval-list').innerHTML = items.map((item) => `
    <button
      class="ceo-approval-row ${item.outgoingPaymentRequestId === state.selectedApprovalId ? 'active' : ''}"
      type="button"
      data-approval-id="${item.outgoingPaymentRequestId}"
    >
      <span><strong>${escapeHtml(item.payeeName)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(item.requestedByName)}</small></span>
      <span><strong>${money(item.amount)}</strong><small>${formatTime(item.requestTime)}</small></span>
    </button>
  `).join('') || '<div class="approval-empty"><strong>No approvals waiting</strong><span>New outgoing-payment requests will appear here.</span></div>';
  renderApprovalDetail();
}

function render(data) {
  state.dashboard = data;
  $('#finance-as-of').textContent = `As of ${formatTime(data.finance.asOf)}`;
  renderFinance(data.finance);
  renderOnline(data.online);
  renderHealth(data.health);
  renderApprovals(data.approvals);
  $('#login-view').classList.add('hidden');
  $('#workspace-view').classList.remove('hidden');
}

async function loadDashboard() {
  render(await api('/api/v1/ceo/dashboard'));
}

async function decide(decision) {
  const item = selectedApproval();
  if (!item) return;
  setStatus(`${decision === 'approve' ? 'Approving' : 'Denying'} payment...`);
  try {
    const result = await api(
      `/api/v1/ceo/outgoing-payments/${item.outgoingPaymentRequestId}/${decision}`,
      {
        method: 'POST',
        body: { remark: $('#decision-remark')?.value || '' }
      }
    );
    state.selectedApprovalId = null;
    await loadDashboard();
    setStatus(`${item.payeeName} payment ${result.status.toLowerCase()}.`, 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

$('#ceo-login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#login-error').textContent = '';
  try {
    const login = await api('/api/v1/auth/staff/login', {
      method: 'POST',
      body: Object.fromEntries(new FormData(event.currentTarget))
    });
    if (login.role !== 'CEO') {
      await api('/api/v1/auth/logout', { method: 'POST' });
      throw new Error('CEO access is required.');
    }
    $('#ceo-name').textContent = login.displayName;
    await loadDashboard();
  } catch (error) {
    $('#login-error').textContent = error.message;
  }
});

document.addEventListener('click', async (event) => {
  const approval = event.target.closest('[data-approval-id]');
  if (approval) {
    state.selectedApprovalId = approval.dataset.approvalId;
    renderApprovals(state.dashboard.approvals);
    return;
  }
  const decision = event.target.closest('[data-decision]');
  if (decision) await decide(decision.dataset.decision);
});

$('#refresh-ceo').addEventListener('click', async () => {
  try {
    await loadDashboard();
    setStatus('Dashboard refreshed.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

$('#logout').addEventListener('click', async () => {
  await api('/api/v1/auth/logout', { method: 'POST' });
  state.dashboard = null;
  state.selectedApprovalId = null;
  $('#workspace-view').classList.add('hidden');
  $('#login-view').classList.remove('hidden');
});

loadDashboard().catch(() => {});
