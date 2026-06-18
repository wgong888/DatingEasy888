const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  dashboard: null,
  employees: [],
  policies: [],
  resets: [],
  payments: [],
  robots: null,
  locations: null,
  currentView: 'overview',
  viewRequestId: 0
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
  const element = $('#admin-status');
  element.textContent = message;
  element.className = `admin-status ${tone}`.trim();
}

function formatTime(value) {
  return value ? new Date(value).toLocaleString() : 'Not yet';
}

function stateCode(locationState) {
  return String(locationState.id || locationState.name || '').split('-').pop();
}

function optionHtml(value, label, selectedValue = '') {
  return `<option value="${escapeHtml(value)}" ${value === selectedValue ? 'selected' : ''}>${escapeHtml(label)}</option>`;
}

function fallbackLocations() {
  return {
    countries: [
      {
        code: 'US',
        name: 'United States',
        states: [
          {
            id: 'US-CA',
            name: 'California',
            cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Long Beach']
          }
        ]
      }
    ]
  };
}

async function loadLocations() {
  if (state.locations) return state.locations;
  try {
    state.locations = await fetch('/data/countries_states_cities.json')
      .then((response) => {
        if (!response.ok) throw new Error('Location data unavailable.');
        return response.json();
      });
  } catch {
    state.locations = fallbackLocations();
  }
  return state.locations;
}

function selectedCountry(countryCode = 'US') {
  const countries = state.locations?.countries || [];
  return countries.find((country) => country.code === countryCode) || countries[0];
}

function selectedState(country, submittedState = 'CA') {
  return country?.states.find((item) => (
    stateCode(item) === submittedState || item.name === submittedState || item.id === submittedState
  )) || country?.states[0];
}

function renderRobotCountryOptions(countryCode = 'US') {
  const country = selectedCountry(countryCode);
  $('#robot-form').elements.countryCode.innerHTML = (state.locations?.countries || [])
    .map((item) => optionHtml(item.code, item.name, country?.code))
    .join('');
  renderRobotStateOptions(country?.code || countryCode, 'CA');
}

function renderRobotStateOptions(countryCode = 'US', submittedState = 'CA') {
  const form = $('#robot-form');
  const country = selectedCountry(countryCode);
  const locationState = selectedState(country, submittedState);
  form.elements.state.innerHTML = (country?.states || [])
    .map((item) => optionHtml(stateCode(item), item.name, stateCode(locationState)))
    .join('');
  renderRobotCityOptions(country?.code || countryCode, stateCode(locationState), 'Los Angeles');
}

function renderRobotCityOptions(countryCode = 'US', submittedState = 'CA', submittedCity = 'Los Angeles') {
  const form = $('#robot-form');
  const country = selectedCountry(countryCode);
  const locationState = selectedState(country, submittedState);
  const cities = locationState?.cities || [];
  const selectedCity = cities.includes(submittedCity) ? submittedCity : cities[0];
  form.elements.city.innerHTML = cities
    .map((city) => optionHtml(city, city, selectedCity))
    .join('');
}

function renderRobotFilterCountryOptions(selectedValue = '') {
  const form = $('#robot-filter-form');
  form.elements.countryCode.innerHTML = [
    optionHtml('', 'Any country', selectedValue),
    ...(state.locations?.countries || []).map((country) => optionHtml(country.code, country.name, selectedValue))
  ].join('');
  renderRobotFilterStateOptions(selectedValue, '');
}

function renderRobotFilterStateOptions(countryCode = '', selectedValue = '') {
  const form = $('#robot-filter-form');
  const country = countryCode ? selectedCountry(countryCode) : null;
  form.elements.state.innerHTML = [
    optionHtml('', 'Any state', selectedValue),
    ...((country?.states || []).map((item) => optionHtml(stateCode(item), item.name, selectedValue)))
  ].join('');
  form.elements.state.disabled = !countryCode;
  renderRobotFilterCityOptions(countryCode, selectedValue, '');
}

function renderRobotFilterCityOptions(countryCode = '', submittedState = '', selectedValue = '') {
  const form = $('#robot-filter-form');
  const country = countryCode ? selectedCountry(countryCode) : null;
  const locationState = country && submittedState ? selectedState(country, submittedState) : null;
  form.elements.city.innerHTML = [
    optionHtml('', 'Any city', selectedValue),
    ...((locationState?.cities || []).map((city) => optionHtml(city, city, selectedValue)))
  ].join('');
  form.elements.city.disabled = !locationState;
}

function robotFilterParams() {
  const form = $('#robot-filter-form');
  const params = new URLSearchParams();
  for (const key of ['countryCode', 'state', 'city', 'active']) {
    const value = String(form.elements[key]?.value || '').trim();
    if (value) params.set(key, value);
  }
  return params;
}

function ageFromBirthDate(value) {
  if (!value) return '';
  const birthDate = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birthDate.getUTCDate())) age -= 1;
  return age;
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
    api('/api/v1/admin/policies')
  ]);
  state.resets = resets.items;
  state.policies = policies.items;
  renderResets();
}

function renderEmployees() {
  $('#employee-list').innerHTML = state.employees.map((employee) => `
    <article class="admin-table-row ${employee.active ? '' : 'inactive'}">
      <div><strong>${escapeHtml(employee.displayName)}</strong><span>${escapeHtml(employee.email)} · ${escapeHtml(employee.phone || 'No phone')}</span></div>
      <div>
        <strong>${escapeHtml(employee.role.replace('ChatEmployee', 'Chat employee'))}</strong>
        <span>${escapeHtml(employee.sex || 'NotSpecified')} · ${escapeHtml(employee.education || 'No education')} · ${employee.active ? 'Active' : 'Removed'}</span>
      </div>
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
  const approvedInventory = data.robots.filter(
    (robot) => robot.active && robot.reviewStatus === 'Approved'
  );
  const draftCount = data.robots.length - approvedInventory.length;
  const menOnline = online.filter((robot) => robot.sex === 'Man').length;
  const womenOnline = online.filter((robot) => robot.sex === 'Woman').length;
  $('#robot-summary').innerHTML = [
    ['Coverage', `${data.coverage.city}, ${data.coverage.state}`, data.coverage.status],
    [
      'Approved inventory',
      approvedInventory.length,
      `${approvedInventory.filter((item) => item.sex === 'Man').length} men · ${approvedInventory.filter((item) => item.sex === 'Woman').length} women${draftCount ? ` · ${draftCount} draft` : ''}`
    ],
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
    <article class="admin-table-row ${robot.active ? '' : 'inactive'}">
      <div><strong>${escapeHtml(robot.displayName)}</strong><span>${escapeHtml(robot.sex)} · ${escapeHtml(robot.city)}, ${escapeHtml(robot.state || robot.countryCode)}</span></div>
      <div>
        <strong>${robot.online ? 'Online' : robot.active ? 'Off shift' : 'Inactive draft'}</strong>
        <span>${robot.shiftEnd ? `Until ${formatTime(robot.shiftEnd)}` : `${escapeHtml(robot.creationSource)} · ${escapeHtml(robot.reviewStatus)}`}</span>
      </div>
      <div class="row-actions">
        <span class="robot-state ${robot.online ? 'online' : ''}">${robot.reserve ? 'Reserve' : robot.online ? 'Active' : robot.active ? 'Ready' : 'Review'}</span>
        <button class="secondary compact-button" type="button" data-edit-robot="${robot.customerId}">Edit</button>
        <button class="${robot.active ? 'danger-button' : 'primary'} compact-button" type="button" data-toggle-robot="${robot.customerId}" data-active="${robot.active ? 'false' : 'true'}">${robot.active ? 'Deactivate' : 'Activate'}</button>
      </div>
    </article>
  `).join('') || '<div class="empty-admin-row">No robots match the selected filters.</div>';
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
  await loadLocations();
  if (!$('#robot-filter-form').elements.countryCode.options.length) {
    renderRobotFilterCountryOptions('');
  }
  const params = robotFilterParams();
  renderRobots(await api(`/api/v1/admin/robot-operations${params.toString() ? `?${params}` : ''}`));
}

async function filterRobots() {
  await loadRobots();
  setStatus('Robot inventory filtered.', 'success');
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
  const requestId = ++state.viewRequestId;
  state.currentView = view;
  setStatus('Loading...', '');
  try {
    if (view === 'overview' || view === 'audit') await loadDashboard();
    if (view === 'resets') await loadResets();
    if (view === 'payments') await loadPayments();
    if (view === 'employees') await loadEmployees();
    if (view === 'robots') await loadRobots();
    if (view === 'policies') await loadPolicies();
    if (view === 'health') await loadHealth();
  } catch (error) {
    if (requestId === state.viewRequestId) throw error;
    return;
  }
  if (requestId !== state.viewRequestId) return;
  $$('.admin-view').forEach((element) => element.classList.add('hidden'));
  $(`#admin-view-${view}`).classList.remove('hidden');
  $$('[data-admin-view]').forEach((button) => button.classList.toggle('active', button.dataset.adminView === view));
  setStatus('', '');
}

function openEmployeeDialog(employee = null) {
  const form = $('#employee-form');
  form.reset();
  form.elements.employeeId.value = employee?.employeeId || '';
  form.elements.displayName.value = employee?.displayName || '';
  form.elements.email.value = employee?.email || '';
  form.elements.sex.value = employee?.sex || 'NotSpecified';
  form.elements.birthDate.value = employee?.birthDate || '1990-01-01';
  form.elements.phone.value = employee?.phone || '';
  form.elements.address.value = employee?.address || '';
  form.elements.education.value = employee?.education || '';
  form.elements.role.value = employee?.role || 'ChatEmployee';
  form.elements.remark.value = employee?.remark || '';
  form.elements.active.checked = employee?.active ?? true;
  $('#employee-active-label').classList.toggle('hidden', !employee);
  $('#employee-dialog-title').textContent = employee ? 'Edit employee' : 'Add employee';
  $('#employee-dialog').showModal();
}

function updateRobotCreationMode() {
  const form = $('#robot-form');
  const fullProfile = form.elements.creationMode.value === 'FullProfile';
  $('#robot-full-fields').classList.toggle('hidden', !fullProfile);
  $('#robot-mode-guidance').textContent = fullProfile
    ? 'Complete every profile field. The system derives the birth date from the entered age.'
    : 'The system will create a complete inactive draft from these required details.';
  $$('#robot-full-fields input, #robot-full-fields select, #robot-full-fields textarea')
    .forEach((field) => {
      field.required = fullProfile && !field.hasAttribute('data-optional');
    });
  if (fullProfile && !form.elements.profilePhoto.value) {
    const suffix = form.elements.sex.value === 'Man'
      ? 'man'
      : form.elements.sex.value === 'Woman'
        ? 'woman'
        : 'neutral';
    form.elements.profilePhoto.value = `/assets/profiles/default-${suffix}.svg`;
  }
}

async function openRobotDialog(robot = null) {
  const form = $('#robot-form');
  await loadLocations();
  form.reset();
  form.elements.customerId.value = robot?.customerId || '';
  form.elements.creationMode.disabled = Boolean(robot);
  form.elements.creationMode.value = robot ? 'FullProfile' : 'AutoFill';
  form.elements.displayName.value = robot?.displayName || '';
  form.elements.age.value = robot ? ageFromBirthDate(robot.birthDate) : '';
  form.elements.sex.value = robot?.sex || 'Woman';
  renderRobotCountryOptions(robot?.countryCode || 'US');
  renderRobotStateOptions(robot?.countryCode || 'US', robot?.state || 'CA');
  renderRobotCityOptions(robot?.countryCode || 'US', robot?.state || 'CA', robot?.city || 'Los Angeles');
  if (robot) {
    form.elements.lookingFor.value = robot.lookingFor || '';
    form.elements.maritalStatus.value = robot.maritalStatus || '';
    form.elements.workField.value = robot.workField || '';
    form.elements.englishLevel.value = robot.englishLevel || '';
    form.elements.preferredAgeMin.value = robot.preferredAgeMin || '';
    form.elements.preferredAgeMax.value = robot.preferredAgeMax || '';
    form.elements.languages.value = (robot.languages || []).join(', ');
    form.elements.traits.value = (robot.traits || []).join(', ');
    form.elements.interests.value = (robot.interests || []).join(', ');
    form.elements.movies.value = (robot.movies || []).join(', ');
    form.elements.music.value = (robot.music || []).join(', ');
    form.elements.goals.value = (robot.goals || []).join(', ');
    form.elements.personalityType.value = robot.personalityType || '';
    form.elements.bio.value = robot.bio || '';
    form.elements.story.value = robot.story || '';
    form.elements.profilePhoto.value = robot.profilePhoto || '';
    form.elements.publicPhotos.value = (robot.publicPhotos || []).join(', ');
    form.elements.privatePhotos.value = (robot.privatePhotos || []).join(', ');
    form.elements.active.checked = Boolean(robot.active);
  }
  $('#robot-dialog .dialog-heading h2').textContent = robot ? 'Edit robot customer' : 'Create robot customer';
  $('#robot-active-label').classList.toggle('hidden', !robot);
  $('#robot-submit-button').textContent = robot ? 'Save robot profile' : 'Create robot draft';
  $('#robot-review-guidance').textContent = robot
    ? 'Editing changes the robot customer profile used in search and chat. Active controls whether the robot can appear in inventory and shifts.'
    : 'New robot customers remain inactive until originality, adult-appearance, and human review are approved.';
  updateRobotCreationMode();
  $('#robot-dialog').showModal();
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

$('#robot-form').addEventListener('change', (event) => {
  if (event.target.name === 'creationMode') updateRobotCreationMode();
  if (event.target.name === 'countryCode') {
    renderRobotStateOptions(event.target.value);
  }
  if (event.target.name === 'state') {
    const form = $('#robot-form');
    renderRobotCityOptions(form.elements.countryCode.value, event.target.value);
  }
  if (event.target.name === 'sex' && $('#robot-form').elements.creationMode.value === 'FullProfile') {
    const photo = $('#robot-form').elements.profilePhoto;
    if (!photo.value || photo.value.startsWith('/assets/profiles/default-')) {
      const suffix = event.target.value === 'Man'
        ? 'man'
        : event.target.value === 'Woman'
          ? 'woman'
          : 'neutral';
      photo.value = `/assets/profiles/default-${suffix}.svg`;
    }
  }
});

$('#robot-filter-form').addEventListener('change', (event) => {
  if (event.target.name === 'countryCode') {
    renderRobotFilterStateOptions(event.target.value, '');
  }
  if (event.target.name === 'state') {
    const form = $('#robot-filter-form');
    renderRobotFilterCityOptions(form.elements.countryCode.value, event.target.value, '');
  }
});

$('#robot-filter-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await filterRobots();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

$('#robot-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const body = Object.fromEntries(new FormData(form));
  const customerId = body.customerId;
  body.age = Number(body.age);
  if (customerId || body.creationMode === 'FullProfile') {
    for (const field of [
      'languages', 'traits', 'interests', 'movies', 'music', 'goals',
      'publicPhotos', 'privatePhotos'
    ]) {
      body[field] = String(body[field] || '').split(',').map((item) => item.trim()).filter(Boolean);
    }
    body.preferredAgeMin = Number(body.preferredAgeMin);
    body.preferredAgeMax = Number(body.preferredAgeMax);
  }
  try {
    if (customerId) {
      body.active = form.elements.active.checked;
      const result = await api(`/api/v1/admin/robot-customers/${customerId}`, { method: 'PATCH', body });
      $('#robot-dialog').close();
      setStatus(`${result.displayName} robot profile updated.`, 'success');
    } else {
      const result = await api('/api/v1/admin/robot-customers', { method: 'POST', body });
      $('#robot-dialog').close();
      setStatus(
        `${result.displayName} created as an inactive ${result.creationMode === 'AutoFill' ? 'auto-filled' : 'full-profile'} robot draft.`,
        'success'
      );
    }
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
  const target = event.target.closest('button, [data-admin-view], [data-edit-employee], [data-remove-employee], [data-edit-robot], [data-toggle-robot], [data-filter-robots], [data-approve-reset], [data-reject-reset], [data-close-dialog]');
  if (!target) return;
  try {
    if (target.dataset.adminView) return await switchView(target.dataset.adminView);
    if (target.matches('[data-close-dialog]')) return target.closest('dialog').close();
    if (target.id === 'add-employee') return openEmployeeDialog();
    if (target.id === 'add-payment') return $('#payment-dialog').showModal();
    if (target.id === 'add-policy') return $('#policy-dialog').showModal();
    if (target.id === 'add-robot') return await openRobotDialog();
    if (target.id === 'refresh-health') return await loadHealth();
    if (target.id === 'refresh-robots') return await loadRobots();
    if (target.dataset.filterRobots !== undefined) return await filterRobots();
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
    if (target.dataset.editRobot) {
      const robot = state.robots?.robots.find((item) => item.customerId === target.dataset.editRobot);
      if (!robot) throw new Error('Robot profile is not loaded.');
      return await openRobotDialog(robot);
    }
    if (target.dataset.toggleRobot) {
      const active = target.dataset.active === 'true';
      const result = await api(`/api/v1/admin/robot-customers/${target.dataset.toggleRobot}`, {
        method: 'PATCH',
        body: { active }
      });
      setStatus(`${result.displayName} ${active ? 'activated' : 'deactivated'}.`, 'success');
      return await loadRobots();
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
