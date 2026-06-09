const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  dashboard: null,
  employees: [],
  policies: [],
  resets: [],
  payments: [],
  robots: null,
  currentView: 'overview'
};

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: options.body ? { 'Content-Type': 'application/json' } : {},
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    const error = new Error(payload.error?.message || 'Request failed.');
    error.code = payload.error?.code;
    throw error;
  }
  return payload.data;
}

function setStatus(message, tone = '') {
  const element = $('#admin-status');
  element.textContent = message;
  element.className = `admin-status ${tone}`.trim();
}

function formatTime(value) {
  return value ? new Date(value).toLocaleString() : 'Not yet';
}

function metricCard(label, data, suffix = '') {
  return `
    <article class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(data.total)}${suffix}</strong>
      <small><b>${escapeHtml(data.online)}</b> online now</small>
    </article>
  `;
}

function renderAudit(target, items) {
  target.innerHTML = items.map((item) => `
    <div class="audit-row">
      <strong>${escapeHtml(item.action)}</strong>
      <span>${escapeHtml(item.actorType)} · ${formatTime(item.createTime)}</span>
    </div>
  `).join('') || '<div class="empty-admin-row">No audit events yet.</div>';
}

function renderDashboard(data) {
  state.dashboard = data;
  $('#overview-date').textContent = `${data.businessDate} UTC business day`;
  $('#policy-version').textContent = `Policy version ${data.system.policyVersion}`;
  $('#metrics').innerHTML = [
    metricCard('Real customers', data.metrics.realCustomers),
    metricCard('Seed customers', data.metrics.seedCustomers),
    metricCard('Robot customers', data.metrics.robotCustomers),
    `<article class="metric"><span>Messages today</span><strong>${data.metrics.messagesToday}</strong><small>UTC business day</small></article>`,
    `<article class="metric"><span>Credits consumed today</span><strong>${data.metrics.creditsConsumedToday}</strong><small>UTC business day</small></article>`,
    `<article class="metric"><span>Revenue today</span><strong>$${Number(data.metrics.revenueToday).toFixed(2)}</strong><small>Successful charges</small></article>`
  ].join('');
  const operationLabels = {
    pendingPasswordResets: 'Pending password resets',
    pendingOutgoingPayments: 'Pending outgoing payments',
    activeEmployees: 'Active employees',
    openConversations: 'Open conversations',
    waitingSeedConversations: 'Seed conversations waiting'
  };
  $('#operation-list').innerHTML = Object.entries(data.operations).map(([key, value]) => `
    <div class="operation-item"><span>${operationLabels[key]}</span><strong>${value}</strong></div>
  `).join('');
  $('#system-list').innerHTML = Object.entries(data.system).map(([key, value]) => `
    <div class="system-row"><span>${escapeHtml(key.replace(/([A-Z])/g, ' $1'))}</span><strong>${escapeHtml(value)}</strong></div>
  `).join('');
  renderAudit($('#overview-audit-list'), data.recentAudit);
  renderAudit($('#audit-list'), data.recentAudit);
  $('#reset-nav-count').textContent = data.operations.pendingPasswordResets
    ? String(data.operations.pendingPasswordResets)
    : '';
  $('#payment-nav-count').textContent = data.operations.pendingOutgoingPayments
    ? String(data.operations.pendingOutgoingPayments)
    : '';
}

async function loadDashboard() {
  renderDashboard(await api('/api/v1/admin/dashboard'));
}

function renderResets() {
  $('#reset-list').innerHTML = state.resets.map((item) => `
    <article class="admin-table-row" data-reset-row="${item.passwordResetRequestId}">
      <div><strong>${escapeHtml(item.customerName)}</strong><span>${escapeHtml(item.contactType)} · ${escapeHtml(item.contactValueMasked)}</span></div>
      <div><span>${formatTime(item.requestTime)}</span><small>${escapeHtml(item.status)}</small></div>
      <div class="row-actions">
        ${item.status === 'Pending' ? `
          <button class="secondary compact-button" type="button" data-reject-reset="${item.passwordResetRequestId}">Reject</button>
          <button class="primary compact-button" type="button" data-approve-reset="${item.passwordResetRequestId}">Approve</button>
        ` : `<span class="state-label">${escapeHtml(item.status)}</span>`}
      </div>
    </article>
  `).join('') || '<div class="empty-admin-row">No password reset requests.</div>';
  const autoPolicy = state.policies.find((item) => item.policyKey === 'password_reset_auto_approve');
  $('#auto-approve-toggle').textContent =
    `Auto approval: ${autoPolicy?.active && autoPolicy.value === 'true' ? 'On' : 'Off'}`;
}

async function loadResets() {
  const [resets, policies] = await Promise.all([
    api('/api/v1/admin/password-reset-requests'),
    state.policies.length ? Promise.resolve({ items: state.policies }) : api('/api/v1/admin/policies')
  ]);
  state.resets = resets.items;
  state.policies = policies.items;
  renderResets();
}

function renderEmployees() {
  $('#employee-list').innerHTML = state.employees.map((employee) => `
    <article class="admin-table-row ${employee.active ? '' : 'inactive'}">
      <div><strong>${escapeHtml(employee.displayName)}</strong><span>${escapeHtml(employee.email)}</span></div>
      <div><strong>${escapeHtml(employee.role.replace('ChatEmployee', 'Chat employee'))}</strong><span>${employee.active ? 'Active' : 'Removed'}</span></div>
      <div class="row-actions">
        <button class="secondary compact-button" type="button" data-edit-employee="${employee.employeeId}">Edit</button>
        ${employee.active ? `<button class="danger-button compact-button" type="button" data-remove-employee="${employee.employeeId}">Remove</button>` : ''}
      </div>
    </article>
  `).join('');
}

async function loadEmployees() {
  const data = await api('/api/v1/admin/employees');
  state.employees = data.items;
  renderEmployees();
}

function paymentMoney(item) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: item.currencyCode,
    maximumFractionDigits: 2
  }).format(item.amount);
}

function renderPayments() {
  const pending = state.payments.filter((item) => item.status === 'Pending').length;
  $('#payment-nav-count').textContent = pending ? String(pending) : '';
  $('#payment-list').innerHTML = state.payments.map((item) => `
    <article class="admin-table-row payment-admin-row">
      <div>
        <strong>${escapeHtml(item.payeeName)}</strong>
        <span>${escapeHtml(item.category)} · ${escapeHtml(item.description)}</span>
      </div>
      <div>
        <strong>${paymentMoney(item)}</strong>
        <span>${formatTime(item.requestTime)} · ${escapeHtml(item.requestedByName)}</span>
      </div>
      <div class="row-actions">
        <span class="payment-status ${item.status.toLowerCase()}">${escapeHtml(item.status)}</span>
      </div>
    </article>
  `).join('') || '<div class="empty-admin-row">No outgoing payment requests.</div>';
}

async function loadPayments() {
  const data = await api('/api/v1/admin/outgoing-payments');
  state.payments = data.items;
  renderPayments();
}

function renderPolicies() {
  $('#policy-list').innerHTML = state.policies.map((policy) => `
    <form class="policy-editor" data-policy-form="${policy.policyId}">
      <div class="policy-editor-heading">
        <div><strong>${escapeHtml(policy.title)}</strong><span>${escapeHtml(policy.policyKey)} · version ${policy.version}</span></div>
        <label class="switch-label"><input name="active" type="checkbox" ${policy.active ? 'checked' : ''}> Enabled</label>
      </div>
      <label>Title<input name="title" value="${escapeHtml(policy.title)}" required></label>
      <label>Description<textarea name="description" rows="2">${escapeHtml(policy.description)}</textarea></label>
      <label>Value<input name="value" value="${escapeHtml(policy.value)}" required></label>
      <div class="dialog-actions"><span>Updated ${formatTime(policy.updateTime)}</span><button class="primary compact-button" type="submit">Save changes</button></div>
    </form>
  `).join('');
}

async function loadPolicies() {
  const data = await api('/api/v1/admin/policies');
  state.policies = data.items;
  renderPolicies();
}

function renderRobots(data) {
  state.robots = data;
  const online = data.robots.filter((robot) => robot.online);
  const menOnline = online.filter((robot) => robot.sex === 'Man').length;
  const womenOnline = online.filter((robot) => robot.sex === 'Woman').length;
  $('#robot-summary').innerHTML = [
    ['Coverage', `${data.coverage.city}, ${data.coverage.state}`, data.coverage.status],
    ['Inventory', data.robots.length, `${data.robots.filter((item) => item.sex === 'Man').length} men · ${data.robots.filter((item) => item.sex === 'Woman').length} women`],
    ['Online now', online.length, `${menOnline} men · ${womenOnline} women`],
    ['AI mode', data.ai.mode === 'LocalOnly' ? 'Local only' : 'Hybrid', data.ai.providerStatus]
  ].map(([label, value, detail]) => `
    <article class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `).join('');
  $('#robot-list').innerHTML = data.robots.map((robot) => `
    <article class="admin-table-row">
      <div><strong>${escapeHtml(robot.displayName)}</strong><span>${escapeHtml(robot.sex)} · ${escapeHtml(data.coverage.city)}</span></div>
      <div><strong>${robot.online ? 'Online' : 'Off shift'}</strong><span>${robot.shiftEnd ? `Until ${formatTime(robot.shiftEnd)}` : 'No current shift'}</span></div>
      <div class="row-actions"><span class="robot-state ${robot.online ? 'online' : ''}">${robot.reserve ? 'Reserve' : robot.online ? 'Active' : 'Ready'}</span></div>
    </article>
  `).join('');
  $('#robot-shift-list').innerHTML = data.shifts.map((shift) => `
    <article class="admin-table-row robot-shift-row">
      <div><strong>${escapeHtml(shift.displayName)}</strong><span>${escapeHtml(shift.sex)} · ${escapeHtml(shift.businessDate)}</span></div>
      <div><strong>${formatTime(shift.startTime)}</strong><span>to ${formatTime(shift.endTime)}</span></div>
      <div class="row-actions"><span class="robot-state ${shift.status === 'Active' ? 'online' : ''}">${escapeHtml(shift.reserve ? `${shift.status} reserve` : shift.status)}</span></div>
    </article>
  `).join('') || '<div class="empty-admin-row">No current or upcoming shifts.</div>';
  const form = $('#robot-ai-form');
  form.elements.mode.value = data.ai.mode;
  form.elements.dailyBudget.value = data.ai.dailyBudget;
  form.elements.monthlyBudget.value = data.ai.monthlyBudget;
  $('#robot-ai-usage').innerHTML = `
    <span>Today: <strong>${data.ai.today.requests}</strong> requests · <strong>$${Number(data.ai.today.estimatedCost).toFixed(4)}</strong></span>
    <span>Month: <strong>${data.ai.month.requests}</strong> requests · <strong>$${Number(data.ai.month.estimatedCost).toFixed(4)}</strong></span>
    <span>${escapeHtml(data.ai.provider)} ${escapeHtml(data.ai.model)} · prototype simulation</span>
  `;
  if (!$('#robot-shift-date').value) {
    const tomorrow = new Date(Date.now() + 86_400_000);
    $('#robot-shift-date').value = tomorrow.toISOString().slice(0, 10);
  }
}

async function loadRobots() {
  renderRobots(await api('/api/v1/admin/robot-operations'));
}

async function loadHealth() {
  const data = await api('/api/v1/admin/health');
  $('#health-checked').textContent = `Checked ${formatTime(data.checkedAt)}`;
  $('#health-list').innerHTML = data.services.map((service) => `
    <article class="health-row">
      <span class="health-dot ${service.status.toLowerCase()}"></span>
      <div><strong>${escapeHtml(service.name)}</strong><span>${escapeHtml(service.detail)}</span></div>
      <b>${escapeHtml(service.status)}</b>
    </article>
  `).join('');
}

async function switchView(view) {
  state.currentView = view;
  $$('.admin-view').forEach((element) => element.classList.add('hidden'));
  $(`#admin-view-${view}`).classList.remove('hidden');
  $$('[data-admin-view]').forEach((button) => button.classList.toggle('active', button.dataset.adminView === view));
  if (view === 'overview' || view === 'audit') await loadDashboard();
  if (view === 'resets') await loadResets();
  if (view === 'payments') await loadPayments();
  if (view === 'employees') await loadEmployees();
  if (view === 'robots') await loadRobots();
  if (view === 'policies') await loadPolicies();
  if (view === 'health') await loadHealth();
}

function openEmployeeDialog(employee = null) {
  const form = $('#employee-form');
  form.reset();
  form.elements.employeeId.value = employee?.employeeId || '';
  form.elements.displayName.value = employee?.displayName || '';
  form.elements.email.value = employee?.email || '';
  form.elements.role.value = employee?.role || 'ChatEmployee';
  form.elements.remark.value = employee?.remark || '';
  form.elements.active.checked = employee?.active ?? true;
  $('#employee-active-label').classList.toggle('hidden', !employee);
  $('#employee-dialog-title').textContent = employee ? 'Edit employee' : 'Add employee';
  $('#employee-dialog').showModal();
}

$('#staff-login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#login-error').textContent = '';
  try {
    const result = await api('/api/v1/auth/staff/login', {
      method: 'POST',
      body: Object.fromEntries(new FormData(event.currentTarget))
    });
    if (!['Administrator', 'CEO'].includes(result.role)) {
      await api('/api/v1/auth/logout', { method: 'POST' });
      throw new Error('Administrator or CEO access is required.');
    }
    $('#admin-name').textContent = `${result.displayName} · ${result.role}`;
    $('#login-view').classList.add('hidden');
    $('#workspace-view').classList.remove('hidden');
    await switchView('overview');
  } catch (error) {
    $('#login-error').textContent = error.message;
  }
});

$('#employee-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget));
  const employeeId = body.employeeId;
  try {
    if (employeeId) {
      body.active = event.currentTarget.elements.active.checked;
      await api(`/api/v1/admin/employees/${employeeId}`, { method: 'PATCH', body });
      setStatus('Employee account updated.', 'success');
    } else {
      const result = await api('/api/v1/admin/employees', { method: 'POST', body });
      setStatus(`Employee created. One-time temporary password: ${result.temporaryPassword}`, 'success');
    }
    $('#employee-dialog').close();
    await loadEmployees();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

$('#policy-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget));
  body.active = event.currentTarget.elements.active.checked;
  try {
    await api('/api/v1/admin/policies', { method: 'POST', body });
    $('#policy-dialog').close();
    setStatus('Policy added.', 'success');
    await loadPolicies();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

$('#payment-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const result = await api('/api/v1/admin/outgoing-payments', {
      method: 'POST',
      body: Object.fromEntries(new FormData(form))
    });
    form.reset();
    form.elements.currencyCode.value = 'USD';
    $('#payment-dialog').close();
    setStatus(`${result.payment.payeeName} payment sent to the CEO approval queue.`, 'success');
    await loadPayments();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

$('#robot-ai-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.dailyBudget = Number(body.dailyBudget);
    body.monthlyBudget = Number(body.monthlyBudget);
    await api('/api/v1/admin/robot-ai-policy', { method: 'PUT', body });
    setStatus('Robot AI policy updated for every robot.', 'success');
    await loadRobots();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-policy-form]');
  if (!form) return;
  event.preventDefault();
  try {
    const body = Object.fromEntries(new FormData(form));
    body.active = form.elements.active.checked;
    await api(`/api/v1/admin/policies/${form.dataset.policyForm}`, { method: 'PATCH', body });
    setStatus('Policy updated and versioned.', 'success');
    await loadPolicies();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.addEventListener('click', async (event) => {
  const target = event.target;
  try {
    if (target.dataset.adminView) return await switchView(target.dataset.adminView);
    if (target.matches('[data-close-dialog]')) return target.closest('dialog').close();
    if (target.id === 'add-employee') return openEmployeeDialog();
    if (target.id === 'add-payment') return $('#payment-dialog').showModal();
    if (target.id === 'add-policy') return $('#policy-dialog').showModal();
    if (target.id === 'refresh-health') return await loadHealth();
    if (target.id === 'refresh-robots') return await loadRobots();
    if (target.id === 'regenerate-robot-shifts') {
      const businessDate = $('#robot-shift-date').value;
      await api(
        `/api/v1/admin/robot-city-coverage/${state.robots.coverage.robotCityCoverageId}/shifts/regenerate`,
        { method: 'POST', body: { businessDate } }
      );
      setStatus(`Robot shifts regenerated for ${businessDate}.`, 'success');
      return await loadRobots();
    }
    if (target.dataset.editEmployee) {
      return openEmployeeDialog(state.employees.find((item) => item.employeeId === target.dataset.editEmployee));
    }
    if (target.dataset.removeEmployee) {
      await api(`/api/v1/admin/employees/${target.dataset.removeEmployee}`, { method: 'DELETE' });
      setStatus('Employee account removed.', 'success');
      return await loadEmployees();
    }
    if (target.dataset.approveReset) {
      const result = await api(`/api/v1/admin/password-reset-requests/${target.dataset.approveReset}/approve`, { method: 'POST' });
      setStatus(`Approved and sent by ${result.deliveryChannel}. One-time temporary password: ${result.temporaryPassword}`, 'success');
      await loadResets();
      return await loadDashboard();
    }
    if (target.dataset.rejectReset) {
      await api(`/api/v1/admin/password-reset-requests/${target.dataset.rejectReset}/reject`, { method: 'POST' });
      setStatus('Password reset request rejected.', 'success');
      return await loadResets();
    }
    if (target.id === 'auto-approve-toggle') {
      const policy = state.policies.find((item) => item.policyKey === 'password_reset_auto_approve');
      const enabled = !(policy.active && policy.value === 'true');
      await api(`/api/v1/admin/policies/${policy.policyId}`, {
        method: 'PATCH',
        body: { value: String(enabled), active: true }
      });
      await loadResets();
      return setStatus(`Password reset auto approval ${enabled ? 'enabled' : 'disabled'}.`, 'success');
    }
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

$('#logout').addEventListener('click', async () => {
  await api('/api/v1/auth/logout', { method: 'POST' });
  $('#workspace-view').classList.add('hidden');
  $('#login-view').classList.remove('hidden');
});

loadDashboard().then(() => {
  $('#login-view').classList.add('hidden');
  $('#workspace-view').classList.remove('hidden');
}).catch(() => {});
