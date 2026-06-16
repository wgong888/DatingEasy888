const state = {
  me: null,
  profiles: [],
  favorites: [],
  conversations: [],
  gifts: [],
  activeConversationId: null,
  activeChatPartner: null,
  pendingProfilePhoto: null,
  pendingPrivatePhoto: null,
  selectedCreditPackageId: 2,
  currentView: 'messages',
  previousListView: 'discover',
  discoveryTimer: null,
  discoverLocations: null,
  discoveryRequestId: 0
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const CONFIGURED_SERVICE_ORIGIN = localStorage.getItem('datingeasyServiceOrigin');
const DEFAULT_LOCAL_SERVICE_ORIGIN = 'http://127.0.0.1:4173';

function apiEndpoint(path) {
  if (/^https?:\/\//u.test(path)) return path;
  if (CONFIGURED_SERVICE_ORIGIN) {
    return `${CONFIGURED_SERVICE_ORIGIN}${path}`;
  }
  if (window.location.protocol === 'file:') {
    return `${DEFAULT_LOCAL_SERVICE_ORIGIN}${path}`;
  }
  return path;
}

async function api(path, options = {}) {
  let response;
  const endpoint = apiEndpoint(path);
  const crossOrigin = /^https?:\/\//u.test(endpoint) && new URL(endpoint).origin !== window.location.origin;
  try {
    response = await fetch(endpoint, {
      credentials: crossOrigin ? 'include' : 'same-origin',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {})
      },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    throw new Error('Cannot reach the DatingEasy888 service. Please refresh after the server is running.');
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error?.message || 'The request failed.');
    error.code = payload?.error?.code;
    error.status = response.status;
    throw error;
  }
  return payload.data;
}

function idempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join('')
  ].join('-');
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function pulseButton(button) {
  if (!button || button.disabled) return;
  button.classList.add('is-pressed');
  clearTimeout(button.pressTimer);
  button.pressTimer = setTimeout(() => button.classList.remove('is-pressed'), 160);
}

async function withButtonBusy(button, action) {
  if (!button) return await action();
  if (button.disabled) return null;
  button.classList.add('is-loading');
  button.disabled = true;
  try {
    return await action();
  } finally {
    button.disabled = false;
    button.classList.remove('is-loading');
  }
}

function setBalance(value) {
  if (!state.me) state.me = {};
  state.me.creditBalance = value;
  $('#credit-balance').textContent = value.toLocaleString();
  $('#me-balance').textContent = value.toLocaleString();
}

function photoStyle(profile) {
  return `--photo: url("${profile.photo.src}"); --position: ${profile.photo.position}; --size: ${profile.photo.size || 'cover'}`;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function optionHtml(value, label, selectedValue = '') {
  return `<option value="${escapeHtml(value)}" ${value === selectedValue ? 'selected' : ''}>${escapeHtml(label)}</option>`;
}

async function loadDiscoverLocations() {
  if (state.discoverLocations) return state.discoverLocations;
  state.discoverLocations = await api('/api/v1/customer/discovery/locations');
  return state.discoverLocations;
}

function selectedDiscoverCountry(countryCode = '') {
  const countries = state.discoverLocations?.countries || [];
  return countries.find((country) => country.code === countryCode) || null;
}

function selectedDiscoverState(country, submittedState = '') {
  return country?.states.find((item) => item.code === submittedState) || null;
}

function renderDiscoverCountryOptions(selectedValue = '') {
  const form = $('#discover-filter-form');
  const countries = state.discoverLocations?.countries || [];
  form.elements.countryCode.innerHTML = [
    optionHtml('', 'Any country', selectedValue),
    ...countries.map((country) => optionHtml(country.code, country.name, selectedValue))
  ].join('');
  renderDiscoverStateOptions(selectedValue, '');
}

function renderDiscoverStateOptions(countryCode = '', selectedValue = '') {
  const form = $('#discover-filter-form');
  const country = selectedDiscoverCountry(countryCode);
  const states = country?.states || [];
  form.elements.state.disabled = !country;
  form.elements.state.innerHTML = [
    optionHtml('', 'Any state', selectedValue),
    ...states.map((item) => optionHtml(item.code, item.name, selectedValue))
  ].join('');
  renderDiscoverCityOptions(countryCode, selectedValue, '');
}

function renderDiscoverCityOptions(countryCode = '', stateCode = '', selectedValue = '') {
  const form = $('#discover-filter-form');
  const country = selectedDiscoverCountry(countryCode);
  const locationState = selectedDiscoverState(country, stateCode);
  const cities = locationState?.cities || [];
  form.elements.city.disabled = !locationState;
  form.elements.city.innerHTML = [
    optionHtml('', 'Any city', selectedValue),
    ...cities.map((city) => optionHtml(city, city, selectedValue))
  ].join('');
}

function renderTags(items) {
  if (!items?.length) return '';
  return `<div class="profile-tags">${items.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>`;
}

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function transactionLabel(type) {
  return {
    PrototypeOpeningBalance: 'Prototype opening balance',
    RegistrationReward: 'Registration reward',
    TextMessageCharge: 'Text message',
    CreditPurchase: 'Credit purchase',
    GiftSent: 'Gift sent',
    GiftReceived: 'Gift received'
  }[type] || type;
}

async function bootstrap() {
  try {
    state.me = await api('/api/v1/customer/me');
    showApplication();
    await Promise.all([loadConversations(), loadGifts()]);
    switchView('messages');
  } catch (error) {
    if (error.status !== 401) showToast(error.message);
    showAuthentication();
  }
}

function showAuthentication() {
  $('#auth-view').classList.remove('hidden');
  $('#app-view').classList.add('hidden');
}

function fillProfileEditor() {
  const form = $('#profile-edit-form');
  const fields = [
    'displayName', 'birthDate', 'sex', 'lookingFor', 'countryCode', 'state',
    'city', 'maritalStatus', 'workField', 'englishLevel', 'preferredAgeMin',
    'preferredAgeMax', 'personalityType', 'bio', 'story'
  ];
  fields.forEach((name) => {
    if (form.elements[name]) form.elements[name].value = state.me[name] ?? '';
  });
  form.elements.languages.value = (state.me.languages || []).join(', ');
  $$('[data-choice]', form).forEach((group) => {
    const selected = new Set(state.me[group.dataset.choice] || []);
    $$('input[type=checkbox]', group).forEach((input) => {
      input.checked = selected.has(input.value);
    });
  });
  state.pendingProfilePhoto = state.me.profilePhoto;
  state.pendingPrivatePhoto = state.me.privatePhotos?.[0] || null;
  $('#profile-photo-preview').src = state.me.profilePhoto;
}

function showApplication() {
  $('#auth-view').classList.add('hidden');
  $('#app-view').classList.remove('hidden');
  $('#app-view').classList.remove('nav-open');
  $('#menu-button').setAttribute('aria-expanded', 'false');
  $('#me-name').textContent = state.me.displayName;
  $('#me-title').textContent = `${state.me.displayName}'s profile`;
  $('#me-location').textContent = [state.me.city, state.me.state].filter(Boolean).join(', ');
  $('#me-photo').src = state.me.profilePhoto;
  $('#me-photo').alt = `${state.me.displayName}'s profile portrait`;
  fillProfileEditor();
  setBalance(state.me.creditBalance);
  $('#password-required').classList.toggle('hidden', !state.me.mustChangePassword);
  $('#profile-required').classList.toggle('hidden', state.me.profileCompleted);
  $('#profile-completeness').textContent = `${state.me.profileCompleteness}%`;
  $('#save-profile-button').textContent = state.me.profileCompleted
    ? 'Save profile'
    : 'Complete profile';
  $('#app-view').classList.toggle('profile-incomplete', !state.me.profileCompleted);
  loadDiscoverLocations()
    .then(() => renderDiscoverCountryOptions($('#discover-filter-form').elements.countryCode.value))
    .catch((error) => showToast(error.message));
}

function discoverFilterParams() {
  const form = $('#discover-filter-form');
  const params = new URLSearchParams();
  if (!form) return params;
  ['query', 'countryCode', 'state', 'city', 'minAge', 'maxAge', 'sex'].forEach((name) => {
    const value = String(form.elements[name]?.value || '').trim();
    if (value) params.set(name, value);
  });
  return params;
}

function scheduleProfileSearch() {
  clearTimeout(state.discoveryTimer);
  state.discoveryTimer = setTimeout(() => {
    loadProfiles().catch((error) => showToast(error.message));
  }, 250);
}

async function loadProfiles() {
  const requestId = ++state.discoveryRequestId;
  const params = discoverFilterParams();
  const suffix = params.toString() ? `?${params}` : '';
  const data = await api(`/api/v1/customer/discovery/profiles${suffix}`);
  if (requestId !== state.discoveryRequestId) return;
  state.profiles = data.items;
  renderProfileGrid($('#profile-grid'), state.profiles, 'No profiles match this search.');
}

async function loadFavorites() {
  const data = await api('/api/v1/customer/favorites');
  state.favorites = data.items;
  renderProfileGrid($('#favorite-grid'), state.favorites, 'You have not saved any profiles yet.');
}

function renderProfileGrid(grid, profiles, emptyMessage) {
  if (!profiles.length) {
    grid.innerHTML = `<div class="list-empty"><h2>${escapeHtml(emptyMessage)}</h2><p>Return to Discover to review more profiles.</p></div>`;
    return;
  }
  grid.innerHTML = profiles.map((profile) => `
    <article class="profile-card">
      <button class="profile-photo" style='${photoStyle(profile)}' type="button"
        data-profile="${profile.customerId}" aria-label="View ${escapeHtml(profile.displayName)}"></button>
      <div class="profile-card-body">
        <div class="profile-identity">
          <div>
            <h2>${escapeHtml(profile.displayName)}, ${profile.age}</h2>
            <p class="profile-location">${escapeHtml(profile.city)}, ${escapeHtml(profile.state || profile.countryCode)}</p>
          </div>
          ${profile.online ? '<span class="presence">Online</span>' : ''}
        </div>
        <p class="profile-bio">${escapeHtml(profile.bio)}</p>
        <div class="card-actions">
          <button class="primary-button" type="button" data-profile="${profile.customerId}">View profile</button>
          <button class="favorite-button ${profile.favorite ? 'active' : ''}" type="button"
            data-favorite="${profile.customerId}" aria-label="${profile.favorite ? 'Remove favorite' : 'Add favorite'}"
            title="${profile.favorite ? 'Remove favorite' : 'Add favorite'}">♥</button>
        </div>
      </div>
    </article>
  `).join('');
}

function findKnownProfile(customerId) {
  return [...state.profiles, ...state.favorites, state.activeChatPartner]
    .filter(Boolean)
    .find((item) => item.customerId === customerId);
}

async function openProfile(customerId) {
  state.previousListView = ['messages', 'favorites'].includes(state.currentView)
    ? state.currentView
    : 'discover';
  $('#profile-page').innerHTML = '<div class="panel-loading">Opening profile…</div>';
  switchView('profile', { load: false });
  const profile = await api(`/api/v1/customer/profiles/${customerId}`);
  $('#profile-page').innerHTML = `
    <button class="back-link" type="button" data-back-profile>‹ Back to ${state.previousListView}</button>
    <article class="profile-page-layout">
      <div class="profile-page-photo" style='${photoStyle(profile)}'></div>
      <div class="profile-page-copy">
        <div class="profile-detail-title">
          <div>
            <p class="eyebrow">Profile</p>
            <h1>${escapeHtml(profile.displayName)}, ${profile.age}</h1>
            <p class="profile-location">${escapeHtml(profile.city)}, ${escapeHtml(profile.state || profile.countryCode)}</p>
          </div>
          ${profile.online ? '<span class="presence">Online</span>' : ''}
        </div>
        <section class="profile-about">
          <h2>About ${escapeHtml(profile.displayName)}</h2>
          <p>${escapeHtml(profile.story || profile.bio)}</p>
          <dl>
            <div><dt>Gender</dt><dd>${escapeHtml(profile.sex)}</dd></div>
            <div><dt>Looking for</dt><dd>${escapeHtml(profile.lookingFor || 'Conversation')}</dd></div>
            <div><dt>Marital status</dt><dd>${escapeHtml(profile.maritalStatus || 'Not specified')}</dd></div>
            <div><dt>Field of work</dt><dd>${escapeHtml(profile.workField || 'Not specified')}</dd></div>
            <div><dt>English</dt><dd>${escapeHtml(profile.englishLevel || 'Not specified')}</dd></div>
            <div><dt>Personality</dt><dd>${escapeHtml(profile.personalityType || 'Not specified')}</dd></div>
          </dl>
          ${profile.languages?.length ? `<h3>Languages</h3>${renderTags(profile.languages)}` : ''}
          ${profile.traits?.length ? `<h3>Traits</h3>${renderTags(profile.traits)}` : ''}
          ${profile.interests?.length ? `<h3>Interests</h3>${renderTags(profile.interests)}` : ''}
          ${profile.goals?.length ? `<h3>Goals</h3>${renderTags(profile.goals)}` : ''}
        </section>
        <div class="profile-detail-actions">
          <button class="primary-button" type="button" data-message="${profile.customerId}">Chat with ${escapeHtml(profile.displayName)}</button>
          <button class="secondary-button" type="button" data-favorite="${profile.customerId}">
            ${profile.favorite ? 'Remove favorite' : 'Add to favorites'}
          </button>
        </div>
      </div>
    </article>
  `;
}

async function toggleFavorite(customerId) {
  const profile = findKnownProfile(customerId);
  const favorite = profile?.favorite ?? Boolean(
    state.favorites.find((item) => item.customerId === customerId)
  );
  await api(`/api/v1/customer/profiles/${customerId}/favorite`, {
    method: favorite ? 'DELETE' : 'POST'
  });
  [...state.profiles, ...state.favorites, state.activeChatPartner]
    .filter(Boolean)
    .filter((item) => item.customerId === customerId)
    .forEach((item) => { item.favorite = !favorite; });
  if (state.currentView === 'discover') {
    renderProfileGrid($('#profile-grid'), state.profiles, 'No profiles match this search.');
  }
  if (state.currentView === 'favorites') await loadFavorites();
  if (state.currentView === 'profile') await openProfile(customerId);
  const chatFavorite = $('.chat-favorite');
  if (chatFavorite && state.activeChatPartner?.customerId === customerId) {
    chatFavorite.classList.toggle('active', !favorite);
    chatFavorite.setAttribute('aria-label', !favorite ? 'Remove favorite' : 'Add favorite');
    chatFavorite.title = !favorite ? 'Remove favorite' : 'Add favorite';
  }
  showToast(favorite ? 'Removed from favorites' : 'Added to favorites');
}

async function startConversation(customerId) {
  const data = await api(`/api/v1/customer/conversations/with/${customerId}`, { method: 'POST' });
  await loadConversations();
  switchView('messages', { load: false });
  await openConversation(data.conversationId);
}

async function loadConversations() {
  const data = await api('/api/v1/customer/conversations');
  state.conversations = data.items;
  renderConversationList();
}

function renderConversationList() {
  const list = $('#conversation-list');
  if (!state.conversations.length) {
    list.innerHTML = '<div class="list-empty"><h2>No conversations yet.</h2><p>Open Discover to review a profile and begin chatting.</p></div>';
    return;
  }
  list.innerHTML = state.conversations.map((conversation) => `
    <button class="conversation-item ${state.activeConversationId === conversation.conversationId ? 'active' : ''}"
      type="button" data-conversation="${conversation.conversationId}"
      data-customer="${conversation.otherCustomer.customerId}">
      <span class="mini-photo" style='${photoStyle(conversation.otherCustomer)}'></span>
      <span class="conversation-copy">
        <strong>${escapeHtml(conversation.otherCustomer.displayName)}</strong>
        <span>${escapeHtml(conversation.lastText || 'Start the conversation')}</span>
        <time>${formatTime(conversation.updatedAt)}</time>
      </span>
    </button>
  `).join('');
}

async function loadGifts() {
  const data = await api('/api/v1/customer/gifts');
  state.gifts = data.items;
}

function renderGiftStrip() {
  return `
    <section class="gift-strip" aria-label="Send a gift">
      <div class="gift-strip-heading"><strong>Gifts</strong><span>Select to send immediately</span></div>
      <div class="gift-list">
        ${state.gifts.map((gift) => `
          <button class="gift-button ${state.me.creditBalance < gift.senderCost ? 'insufficient' : ''}"
            type="button" data-gift="${gift.giftId}" title="Send ${escapeHtml(gift.name)} for ${gift.senderCost} credits">
            <span class="gift-icon" aria-hidden="true">${gift.icon}</span>
            <span>${escapeHtml(gift.name)}</span>
            <strong>${gift.senderCost.toLocaleString()}</strong>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

async function openConversation(conversationId) {
  state.activeConversationId = conversationId;
  renderConversationList();
  const panel = $('#conversation-panel');
  panel.classList.remove('empty-state');
  panel.innerHTML = '<div class="panel-loading">Opening conversation…</div>';
  const data = await api(`/api/v1/customer/conversations/${conversationId}/messages`);
  state.activeChatPartner = data.otherCustomer;
  renderConversationList();
  panel.innerHTML = `
    <header class="chat-header">
      <button class="icon-button mobile-only" type="button" data-close-chat aria-label="Back to conversations" title="Back">‹</button>
      <button class="chat-person" type="button" data-profile="${data.otherCustomer.customerId}">
        <span class="chat-photo" style='${photoStyle(data.otherCustomer)}'></span>
        <span>
          <strong>${escapeHtml(data.otherCustomer.displayName)}</strong>
        </span>
      </button>
      <button class="favorite-button chat-favorite ${data.otherCustomer.favorite ? 'active' : ''}"
        type="button" data-favorite="${data.otherCustomer.customerId}"
        aria-label="${data.otherCustomer.favorite ? 'Remove favorite' : 'Add favorite'}"
        title="${data.otherCustomer.favorite ? 'Remove favorite' : 'Add favorite'}">♥</button>
    </header>
    <div class="chat-messages">
      ${data.messages.map((message) => `
        <div class="message ${message.senderId === state.me.customerId ? 'outgoing' : 'incoming'} ${message.messageType === 'Gift' ? 'gift-message' : ''}">
          ${escapeHtml(message.text)}
          <time>${formatTime(message.chatTime)}${message.creditUsed ? ` · ${message.creditUsed} credits` : ''}</time>
        </div>
      `).join('')}
    </div>
    <form class="composer" data-composer>
      <textarea name="text" maxlength="500" placeholder="Write up to 60 words" aria-label="Message" required></textarea>
      <button class="primary-button" type="button" data-send-message>Send</button>
      <div class="composer-meta"><span data-word-count>0 / 60 words</span><span>Balance: ${state.me.creditBalance}</span></div>
    </form>
    ${renderGiftStrip()}
  `;
  requestAnimationFrame(() => {
    const messages = $('.chat-messages', panel);
    messages.scrollTop = messages.scrollHeight;
  });
}

async function sendMessage(form) {
  const text = new FormData(form).get('text').trim();
  if (!text) return;
  const conversationId = state.activeConversationId;
  const button = $('[data-send-message], button[type=submit]', form);
  if (button) button.disabled = true;
  try {
    const result = await api(
      `/api/v1/customer/conversations/${conversationId}/messages/text`,
      {
        method: 'POST',
        body: { text },
        idempotencyKey: idempotencyKey()
      }
    );
    setBalance(result.creditBalance);
    form.reset();
    await loadConversations();
    await openConversation(conversationId);
  } catch (error) {
    if (error.code === 'INSUFFICIENT_CREDITS') {
      showToast('Message not sent. You need at least 5 credits.');
    } else {
      throw error;
    }
  } finally {
    if (button) button.disabled = false;
  }
}

async function sendGift(giftId) {
  const gift = state.gifts.find((item) => item.giftId === Number(giftId));
  const conversationId = state.activeConversationId;
  try {
    const result = await api(
      `/api/v1/customer/conversations/${conversationId}/gifts`,
      {
        method: 'POST',
        body: { giftId: Number(giftId) },
        idempotencyKey: idempotencyKey()
      }
    );
    setBalance(result.creditBalance);
    await loadConversations();
    await openConversation(conversationId);
    showToast(`${gift.name} sent`);
  } catch (error) {
    if (error.code === 'INSUFFICIENT_CREDITS') {
      showToast(`${gift.name} was not sent. It costs ${gift.senderCost} credits.`);
    } else {
      throw error;
    }
  }
}

async function loadLedger() {
  const data = await api('/api/v1/customer/credits/ledger');
  $('#ledger-list').innerHTML = data.items.map((item) => `
    <div class="ledger-row">
      <div>
        <strong>${escapeHtml(transactionLabel(item.transactionType))}</strong>
        <time>${formatTime(item.transactionTime)} · Balance ${item.balanceAfter}</time>
      </div>
      <span class="ledger-change ${item.creditsChange >= 0 ? 'positive' : 'negative'}">
        ${item.creditsChange >= 0 ? '+' : ''}${item.creditsChange}
      </span>
    </div>
  `).join('') || '<p>No credit activity.</p>';
}

async function openCredits() {
  const data = await api('/api/v1/customer/credits/packages');
  $('#package-list').innerHTML = data.items.map((item) => `
    <button class="package-button ${state.selectedCreditPackageId === item.packageId ? 'selected' : ''}"
      type="button" data-select-package="${item.packageId}"
      aria-pressed="${state.selectedCreditPackageId === item.packageId}">
      <strong>${item.credits.toLocaleString()} credits</strong>
      <span>$${item.amount}</span>
      <em>${(item.credits / item.amount).toFixed(0)} credits per $1</em>
    </button>
  `).join('');
  $('#credits-dialog').showModal();
}

function selectCreditPackage(packageId) {
  state.selectedCreditPackageId = Number(packageId);
  $$('.package-button').forEach((button) => {
    const selected = Number(button.dataset.selectPackage) === state.selectedCreditPackageId;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

async function buyCredits(form) {
  const body = Object.fromEntries(new FormData(form));
  body.packageId = state.selectedCreditPackageId;
  body.expirationMonth = Number(body.expirationMonth);
  body.expirationYear = Number(body.expirationYear);
  const button = $('#purchase-credits-button');
  button.disabled = true;
  button.textContent = 'Adding credits...';
  const result = await api('/api/v1/customer/credit-purchases/simulate', {
    method: 'POST',
    idempotencyKey: idempotencyKey(),
    body
  });
  try {
    setBalance(result.creditBalance);
    $('#credits-dialog').close();
    showToast(`${result.creditsBought} Arfa credits added. No real card was charged.`);
    if (state.currentView === 'me') await loadLedger();
    if (state.activeConversationId) await openConversation(state.activeConversationId);
  } finally {
    button.disabled = false;
    button.textContent = 'Add selected credits';
  }
}

function switchView(view, options = {}) {
  if (state.me && !state.me.profileCompleted && view !== 'me') {
    view = 'me';
    showToast('Complete your profile before continuing.');
  }
  $('#app-view').classList.remove('nav-open');
  $('#menu-button').setAttribute('aria-expanded', 'false');
  state.currentView = view;
  $$('.app-main > .app-view').forEach((section) => section.classList.add('hidden'));
  $(`#view-${view}`).classList.remove('hidden');
  $$('[data-view]').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });
  if (options.load === false) return;
  if (view === 'messages') loadConversations().catch((error) => showToast(error.message));
  if (view === 'discover') loadProfiles().catch((error) => showToast(error.message));
  if (view === 'favorites') loadFavorites().catch((error) => showToast(error.message));
  if (view === 'me') loadLedger().catch((error) => showToast(error.message));
  history.replaceState(null, '', `#${view}`);
}

function setAuthTab(tab) {
  $$('[data-auth-tab]').forEach((button) => button.classList.toggle('active', button.dataset.authTab === tab));
  $('#login-form').classList.toggle('hidden', tab !== 'login');
  $('#register-form').classList.toggle('hidden', tab !== 'register');
  $('#recovery-form').classList.toggle('hidden', tab !== 'recovery');
  $('#auth-error').textContent = '';
}

document.addEventListener('click', (event) => {
  pulseButton(event.target.closest('button'));
}, true);

document.addEventListener('click', async (event) => {
  const avatar = event.target.closest('.conversation-item .mini-photo');
  if (avatar) {
    event.preventDefault();
    event.stopPropagation();
    const conversation = avatar.closest('.conversation-item');
    await openProfile(conversation.dataset.customer);
    return;
  }
  const target = event.target.closest('button, [data-open-credits]');
  if (!target) return;
  try {
    if (target.dataset.authTab) return setAuthTab(target.dataset.authTab);
    if (target.dataset.view) return switchView(target.dataset.view);
    if (target.dataset.profile) {
      return await withButtonBusy(target, () => openProfile(target.dataset.profile));
    }
    if (target.dataset.backProfile !== undefined) return switchView(state.previousListView);
    if (target.dataset.favorite) {
      return await withButtonBusy(target, () => toggleFavorite(target.dataset.favorite));
    }
    if (target.dataset.message) {
      return await withButtonBusy(target, () => startConversation(target.dataset.message));
    }
    if (target.dataset.conversation) {
      return await openConversation(target.dataset.conversation);
    }
    if (target.id === 'menu-button') {
      const open = !$('#app-view').classList.contains('nav-open');
      $('#app-view').classList.toggle('nav-open', open);
      target.setAttribute('aria-expanded', String(open));
      return;
    }
    if (target.dataset.gift) {
      return await withButtonBusy(target, () => sendGift(target.dataset.gift));
    }
    if (target.dataset.selectPackage) return selectCreditPackage(target.dataset.selectPackage);
    if (target.matches('[data-open-credits]') || target.id === 'credits-button') {
      return await withButtonBusy(target, () => openCredits());
    }
    if (target.matches('[data-close-dialog]')) return target.closest('dialog').close();
    if (target.matches('[data-close-chat]')) {
      state.activeConversationId = null;
      $('#conversation-panel').className = 'conversation-panel empty-state';
      $('#conversation-panel').innerHTML = '<div><span class="empty-icon">✉</span><h2>Choose a conversation</h2><p>Your messages will appear here.</p></div>';
      return;
    }
    if (target.id === 'demo-login') {
      $('#login-form [name=email]').value = 'demo@datingeasy.test';
      $('#login-form [name=password]').value = 'Demo123!';
      return $('#login-form').requestSubmit();
    }
    if (target.id === 'logout-button') {
      return await withButtonBusy(target, async () => {
        await api('/api/v1/auth/logout', { method: 'POST' });
        state.me = null;
        showAuthentication();
        showToast('Signed out');
      });
    }
  } catch (error) {
    showToast(error.message);
  }
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-send-message]');
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  sendMessage(button.closest('[data-composer]')).catch((error) => showToast(error.message));
}, true);

document.addEventListener('dblclick', (event) => {
  const avatar = event.target.closest('.conversation-item .mini-photo');
  if (!avatar) return;
  event.preventDefault();
  event.stopPropagation();
  const conversation = avatar.closest('.conversation-item');
  openProfile(conversation.dataset.customer).catch((error) => showToast(error.message));
});

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#auth-error').textContent = '';
  await withButtonBusy(event.submitter, async () => {
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const login = await api('/api/v1/auth/customer/login', { method: 'POST', body });
      state.me = await api('/api/v1/customer/me');
      showApplication();
      await Promise.all([loadConversations(), loadGifts()]);
      switchView(
        login.mustChangePassword || login.mustCompleteProfile ? 'me' : 'messages',
        { load: false }
      );
      if (login.mustChangePassword) showToast('Choose a new password to continue securely.');
      if (login.mustCompleteProfile) showToast('Complete your profile to begin.');
    } catch (error) {
      $('#auth-error').textContent = error.message;
    }
  });
});

$('#recovery-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#auth-error').textContent = '';
  await withButtonBusy(event.submitter, async () => {
    try {
      const result = await api('/api/v1/auth/customer/password-reset-requests', {
        method: 'POST',
        body: Object.fromEntries(new FormData(event.currentTarget))
      });
      setAuthTab('login');
      $('#auth-error').textContent = result.status === 'AutoApproved'
        ? 'A temporary password was sent through the selected contact channel.'
        : 'Your request was received and is waiting for administrator approval.';
    } catch (error) {
      $('#auth-error').textContent = error.message;
    }
  });
});

$('#register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#auth-error').textContent = '';
  await withButtonBusy(event.submitter, async () => {
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api('/api/v1/auth/customer/register', { method: 'POST', body });
      state.me = await api('/api/v1/customer/me');
      showApplication();
      await Promise.all([loadConversations(), loadGifts()]);
      switchView('me', { load: false });
      showToast('Your account is ready. Complete your profile to begin.');
    } catch (error) {
      $('#auth-error').textContent = error.message;
    }
  });
});

$('#profile-edit-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  await withButtonBusy(event.submitter, async () => {
    try {
      const formData = new FormData(event.currentTarget);
      const body = Object.fromEntries(formData);
      body.languages = String(body.languages || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      $$('[data-choice]', event.currentTarget).forEach((group) => {
        body[group.dataset.choice] = $$('input:checked', group).map((input) => input.value);
      });
      body.preferredAgeMin = Number(body.preferredAgeMin);
      body.preferredAgeMax = Number(body.preferredAgeMax);
      body.profilePhoto = state.pendingProfilePhoto || state.me.profilePhoto;
      body.publicPhotos = [body.profilePhoto];
      body.privatePhotos = state.pendingPrivatePhoto ? [state.pendingPrivatePhoto] : [];
      body.completeProfile = !state.me.profileCompleted;
      const updated = await api('/api/v1/customer/me', {
        method: 'PATCH',
        body
      });
      Object.assign(state.me, updated);
      showApplication();
      switchView('me', { load: false });
      showToast(state.me.profileCompleted ? 'Profile saved' : 'Profile progress saved');
    } catch (error) {
      showToast(error.message);
    }
  });
});

async function resizeProfilePhoto(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose a readable image file.');
  }
  const image = await createImageBitmap(file);
  const scale = Math.min(100 / image.width, 100 / image.height, 1);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(image, 0, 0, width, height);
  image.close();
  return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86);
}

$('#profile-photo-input').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  try {
    state.pendingProfilePhoto = await resizeProfilePhoto(file);
    $('#profile-photo-preview').src = state.pendingProfilePhoto;
    showToast('Public photo ready to save.');
  } catch (error) {
    event.target.value = '';
    showToast(error.message);
  }
});

$('#private-photo-input').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  try {
    state.pendingPrivatePhoto = await resizeProfilePhoto(file);
    showToast('Private photo ready to save.');
  } catch (error) {
    event.target.value = '';
    showToast(error.message);
  }
});

$$('[data-choice]').forEach((group) => {
  group.addEventListener('change', (event) => {
    if (!event.target.matches('input[type=checkbox]')) return;
    const maximum = Number(group.dataset.max);
    const selected = $$('input:checked', group);
    if (selected.length > maximum) {
      event.target.checked = false;
      showToast(`Select up to ${maximum} options.`);
    }
  });
});

$('#password-change-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  await withButtonBusy(event.submitter, async () => {
    try {
      await api('/api/v1/customer/me/password', {
        method: 'POST',
        body: Object.fromEntries(new FormData(event.currentTarget))
      });
      event.currentTarget.reset();
      state.me.mustChangePassword = false;
      $('#password-required').classList.add('hidden');
      showToast('Password changed.');
    } catch (error) {
      showToast(error.message);
    }
  });
});

$('#discover-filter-form').addEventListener('input', () => {
  scheduleProfileSearch();
});

$('#discover-filter-form').addEventListener('submit', (event) => {
  event.preventDefault();
  clearTimeout(state.discoveryTimer);
  loadProfiles().catch((error) => showToast(error.message));
});

$('#discover-filter-form').addEventListener('change', (event) => {
  const form = event.currentTarget;
  if (event.target.name === 'countryCode') {
    renderDiscoverStateOptions(event.target.value, '');
  }
  if (event.target.name === 'state') {
    renderDiscoverCityOptions(form.elements.countryCode.value, event.target.value, '');
  }
  scheduleProfileSearch();
});

$('#discover-filter-form').addEventListener('reset', () => {
  setTimeout(() => {
    renderDiscoverCountryOptions('');
    loadProfiles().catch((error) => showToast(error.message));
  });
});

document.addEventListener('submit', (event) => {
  if (!event.target.matches('[data-composer]')) return;
  event.preventDefault();
  sendMessage(event.target).catch((error) => showToast(error.message));
});

document.addEventListener('keydown', (event) => {
  if (
    !event.target.matches('.composer textarea') ||
    event.key !== 'Enter' ||
    event.shiftKey ||
    event.isComposing
  ) {
    return;
  }
  event.preventDefault();
  event.target.closest('form').requestSubmit();
});

document.addEventListener('input', (event) => {
  if (!event.target.matches('.composer textarea')) return;
  const count = event.target.value.trim().split(/\s+/).filter(Boolean).length;
  $('[data-word-count]', event.target.closest('form')).textContent = `${count} / 60 words`;
});

$('#credit-purchase-form').addEventListener('submit', (event) => {
  event.preventDefault();
  buyCredits(event.currentTarget).catch((error) => {
    $('#purchase-credits-button').disabled = false;
    $('#purchase-credits-button').textContent = 'Add selected credits';
    showToast(error.message);
  });
});

bootstrap();
