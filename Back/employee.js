const $ = (selector) => document.querySelector(selector);

const state = {
  workspace: null,
  selectedSeedId: null,
  activeConversationId: null,
  drafts: new Map(),
  liveRefreshTimer: null,
  refreshInFlight: false
};

const MAX_MESSAGE_WORDS = 60;
const LIVE_REFRESH_MS = 500;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  let response;
  try {
    response = await fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers,
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

function photoStyle(profile) {
  return `--photo: url("${profile.photo.src}"); --position: ${profile.photo.position}; --size: ${profile.photo.size || 'cover'}`;
}

function timeLabel(value) {
  return new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function setStatus(message, tone = '') {
  const element = $('#workspace-status');
  element.textContent = message;
  element.className = `workspace-status ${tone}`.trim();
}

function wordCount(text) {
  return String(text || '').trim().split(/\s+/u).filter(Boolean).length;
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

function selectedSeed() {
  return state.workspace?.assignedSeeds.find(
    (seed) => seed.customerId === state.selectedSeedId
  );
}

function conversationsForSelectedSeed() {
  return (state.workspace?.chatSlots || [])
    .filter((slot) => slot.seed.customerId === state.selectedSeedId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function activeConversation() {
  return conversationsForSelectedSeed().find(
    (slot) => slot.conversationId === state.activeConversationId
  );
}

function selectInitialContext() {
  if (!state.workspace?.assignedSeeds.length) {
    state.selectedSeedId = null;
    state.activeConversationId = null;
    return;
  }
  if (!selectedSeed()) {
    const firstWorkingSlot = state.workspace.chatSlots[0];
    state.selectedSeedId =
      firstWorkingSlot?.seed.customerId || state.workspace.assignedSeeds[0].customerId;
  }
  const seedConversations = conversationsForSelectedSeed();
  if (!activeConversation()) {
    state.activeConversationId = seedConversations[0]?.conversationId || null;
  }
}

function renderSeedList() {
  $('#seed-list').innerHTML = state.workspace.assignedSeeds.map((seed) => `
    <button
      class="seed-row ${seed.customerId === state.selectedSeedId ? 'active' : ''}"
      data-seed-id="${seed.customerId}"
      type="button"
      title="${escapeHtml(seed.displayName)} · ${escapeHtml(seed.city)}"
    >
      <span class="seed-photo-wrap">
        <span class="seed-photo" style='${photoStyle(seed)}'></span>
        ${seed.waitingCount ? `
          <span
            class="seed-notification-dot"
            aria-label="${seed.waitingCount} conversation${seed.waitingCount === 1 ? '' : 's'} waiting for a response"
            title="${seed.waitingCount} waiting"
          ></span>
        ` : ''}
      </span>
      <span class="seed-summary">
        <strong>${escapeHtml(seed.displayName)}</strong>
        <span>${seed.conversationCount} chat${seed.conversationCount === 1 ? '' : 's'}</span>
      </span>
    </button>
  `).join('');
}

function latestMessage(slot) {
  return slot.messages.at(-1);
}

function renderCustomerList() {
  const slots = conversationsForSelectedSeed();
  $('#customer-count').textContent = String(slots.length);
  if (!slots.length) {
    $('#customer-list').innerHTML = `
      <div class="panel-empty">
        <strong>No conversations</strong>
        <span>This seed has no current request or chat history.</span>
      </div>
    `;
    return;
  }
  $('#customer-list').innerHTML = slots.map((slot) => {
    const latest = latestMessage(slot);
    return `
      <button
        class="customer-row ${slot.conversationId === state.activeConversationId ? 'active' : ''}"
        data-conversation-id="${slot.conversationId}"
        type="button"
      >
        <span class="customer-photo" style='${photoStyle(slot.realCustomer)}'></span>
        <span class="customer-summary">
          <span><strong>${escapeHtml(slot.realCustomer.displayName)}</strong><time>${latest ? timeLabel(latest.chatTime) : ''}</time></span>
          <span>${escapeHtml(latest?.text || 'Conversation ready')}</span>
          <small class="${slot.waitingForEmployee ? 'waiting' : ''}">${escapeHtml(slot.status)}</small>
        </span>
      </button>
    `;
  }).join('');
}

function renderMessage(message, slot) {
  const fromSeed = message.senderId === slot.seed.customerId;
  return `
    <div class="main-message ${fromSeed ? 'seed-message' : 'customer-message'}">
      <div>
        <strong>${escapeHtml(fromSeed ? slot.seed.displayName : slot.realCustomer.displayName)}</strong>
        <time>${timeLabel(message.chatTime)}</time>
      </div>
      <p>${escapeHtml(message.text)}</p>
      ${message.responseSource ? `<small>${escapeHtml(message.responseSource.replace(/([A-Z])/g, ' $1').trim())}</small>` : ''}
    </div>
  `;
}

function renderMainChat() {
  const slot = activeConversation();
  const seed = selectedSeed();
  if (!seed) {
    $('#main-chat').innerHTML = '<div class="main-chat-empty">Select an active seed in Panel A.</div>';
    return;
  }
  if (!slot) {
    $('#main-chat').innerHTML = `
      <div class="main-chat-empty">
        <strong>${escapeHtml(seed.displayName)} is selected</strong>
        <span>Select a real customer in Panel B when a request or history is available.</span>
      </div>
    `;
    return;
  }
  const draft = state.drafts.get(slot.conversationId) || {
    text: '',
    preparedReplyId: null
  };
  $('#main-chat').innerHTML = `
    <header class="main-chat-header">
      <div class="chat-identity">
        <span class="chat-avatar" style='${photoStyle(seed)}'></span>
        <span><small>Responding as seed</small><strong>${escapeHtml(seed.displayName)}</strong></span>
      </div>
      <span class="chat-direction">to</span>
      <div class="chat-identity customer">
        <span class="chat-avatar" style='${photoStyle(slot.realCustomer)}'></span>
        <span><small>Real customer</small><strong>${escapeHtml(slot.realCustomer.displayName)}</strong></span>
      </div>
      <span class="conversation-state ${slot.waitingForEmployee ? 'waiting' : ''}">${escapeHtml(slot.status)}</span>
    </header>
    <div id="main-chat-history" class="main-chat-history">
      ${slot.messages.map((message) => renderMessage(message, slot)).join('')}
    </div>
    <form id="main-composer" class="main-composer" data-send-form="${slot.conversationId}">
      <textarea
        name="text"
        rows="4"
        maxlength="600"
        aria-label="Reply as ${escapeHtml(seed.displayName)} to ${escapeHtml(slot.realCustomer.displayName)}"
        placeholder="Write as ${escapeHtml(seed.displayName)}..."
      >${escapeHtml(draft.text)}</textarea>
      <input name="preparedReplyId" type="hidden" value="${escapeHtml(draft.preparedReplyId || '')}">
      <div class="composer-footer">
        <span><strong>No gifts</strong> · <span data-word-count>${wordCount(draft.text)} / ${MAX_MESSAGE_WORDS} words</span></span>
        <button class="primary" type="submit">Send response</button>
      </div>
    </form>
  `;
  requestAnimationFrame(() => {
    const history = $('#main-chat-history');
    history.scrollTop = history.scrollHeight;
  });
}

function groupPreparedReplies() {
  return state.workspace.preparedReplies.reduce((groups, reply) => {
    const group = groups.get(reply.category) || [];
    group.push(reply);
    groups.set(reply.category, group);
    return groups;
  }, new Map());
}

function renderPreparedFiles() {
  const hasConversation = Boolean(activeConversation());
  $('#prepared-files').innerHTML = [...groupPreparedReplies()].map(([category, replies]) => `
    <details class="prepared-folder" open>
      <summary><span aria-hidden="true">▾</span>${escapeHtml(category)}<small>${replies.length}</small></summary>
      <div class="prepared-folder-files">
        ${replies.map((reply, index) => `
          <button
            class="prepared-file"
            data-prepared-id="${reply.preparedReplyId}"
            type="button"
            ${hasConversation ? '' : 'disabled'}
            title="Insert into the main chat box"
          >
            <span aria-hidden="true">≡</span>
            <span><strong>Answer ${index + 1}</strong><small>${escapeHtml(reply.text)}</small></span>
          </button>
        `).join('')}
      </div>
    </details>
  `).join('');
}

function renderWorkspace() {
  selectInitialContext();
  const data = state.workspace;
  $('#employee-name').textContent = data.employee.displayName;
  $('#seed-capacity').textContent =
    `${data.capacity.activeSeeds} / ${data.capacity.maximumActiveSeeds} active seeds`;
  $('#chat-capacity').textContent =
    `${data.capacity.openChats} / ${data.capacity.maximumOpenChats} open chats`;
  renderSeedList();
  renderCustomerList();
  renderMainChat();
  renderPreparedFiles();
  $('#login-view').classList.add('hidden');
  $('#workspace-view').classList.remove('hidden');
}

async function loadWorkspace({ preserveContext = true } = {}) {
  const priorSeed = preserveContext ? state.selectedSeedId : null;
  const priorConversation = preserveContext ? state.activeConversationId : null;
  state.workspace = await api('/api/v1/backend/workspace');
  state.selectedSeedId = priorSeed;
  state.activeConversationId = priorConversation;
  renderWorkspace();
  startLiveRefresh();
}

function captureComposerSnapshot() {
  const form = $('#main-composer');
  const textarea = $('#main-composer textarea');
  if (!form || !textarea) return null;
  state.drafts.set(form.dataset.sendForm, {
    text: textarea.value,
    preparedReplyId: form.elements.preparedReplyId.value || null
  });
  return {
    conversationId: form.dataset.sendForm,
    focused: document.activeElement === textarea,
    selectionStart: textarea.selectionStart,
    selectionEnd: textarea.selectionEnd
  };
}

function restoreComposerSnapshot(snapshot) {
  if (!snapshot?.focused || snapshot.conversationId !== state.activeConversationId) return;
  requestAnimationFrame(() => {
    const textarea = $('#main-composer textarea');
    if (!textarea) return;
    textarea.focus();
    const start = Math.min(snapshot.selectionStart, textarea.value.length);
    const end = Math.min(snapshot.selectionEnd, textarea.value.length);
    textarea.setSelectionRange(start, end);
  });
}

async function refreshWorkspace() {
  if (
    state.refreshInFlight ||
    !state.workspace ||
    document.hidden ||
    $('#workspace-view').classList.contains('hidden')
  ) {
    return;
  }
  state.refreshInFlight = true;
  const snapshot = captureComposerSnapshot();
  try {
    await loadWorkspace();
    restoreComposerSnapshot(snapshot);
  } catch (error) {
    if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
      stopLiveRefresh();
      state.workspace = null;
      $('#workspace-view').classList.add('hidden');
      $('#login-view').classList.remove('hidden');
    }
  } finally {
    state.refreshInFlight = false;
  }
}

function startLiveRefresh() {
  if (state.liveRefreshTimer) return;
  state.liveRefreshTimer = setInterval(refreshWorkspace, LIVE_REFRESH_MS);
}

function stopLiveRefresh() {
  if (!state.liveRefreshTimer) return;
  clearInterval(state.liveRefreshTimer);
  state.liveRefreshTimer = null;
}

function selectSeed(seedId) {
  state.selectedSeedId = seedId;
  state.activeConversationId = conversationsForSelectedSeed()[0]?.conversationId || null;
  renderWorkspace();
}

function selectConversation(conversationId) {
  state.activeConversationId = conversationId;
  renderWorkspace();
  $('#main-composer textarea')?.focus();
  refreshWorkspace();
}

async function sendResponse(conversationId, text, preparedReplyId = null) {
  const cleaned = String(text || '').trim();
  if (!cleaned) {
    setStatus('Write or select an answer first.', 'error');
    return;
  }
  const count = wordCount(cleaned);
  if (count > MAX_MESSAGE_WORDS) {
    setStatus(`Response may contain at most ${MAX_MESSAGE_WORDS} words. Current response has ${count}.`, 'error');
    return;
  }
  setStatus('Sending response...');
  try {
    const result = await api(
      `/api/v1/backend/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey() },
        body: { text: cleaned, preparedReplyId }
      }
    );
    state.drafts.delete(conversationId);
    await loadWorkspace();
    setStatus(`Sent as ${selectedSeed()?.displayName || 'the selected seed'} · ${result.responseSource}`, 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

$('#staff-login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#login-error').textContent = '';
  try {
    await api('/api/v1/auth/staff/login', {
      method: 'POST',
      body: Object.fromEntries(new FormData(event.currentTarget))
    });
    await loadWorkspace({ preserveContext: false });
  } catch (error) {
    $('#login-error').textContent = error.message;
  }
});

$('#logout').addEventListener('click', async () => {
  stopLiveRefresh();
  await api('/api/v1/auth/logout', { method: 'POST' });
  state.workspace = null;
  state.selectedSeedId = null;
  state.activeConversationId = null;
  state.drafts.clear();
  $('#workspace-view').classList.add('hidden');
  $('#login-view').classList.remove('hidden');
});

document.addEventListener('input', (event) => {
  const form = event.target.closest('[data-send-form]');
  if (!form) return;
  const count = wordCount(form.elements.text.value);
  const wordCountLabel = form.querySelector('[data-word-count]');
  if (wordCountLabel) wordCountLabel.textContent = `${count} / ${MAX_MESSAGE_WORDS} words`;
  state.drafts.set(form.dataset.sendForm, {
    text: form.elements.text.value,
    preparedReplyId: form.elements.preparedReplyId.value || null
  });
});

document.addEventListener('keydown', (event) => {
  if (
    !event.target.matches('#main-composer textarea') ||
    event.key !== 'Enter' ||
    event.shiftKey ||
    event.isComposing
  ) {
    return;
  }
  event.preventDefault();
  event.target.closest('form')?.requestSubmit();
});

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-send-form]');
  if (!form) return;
  event.preventDefault();
  await sendResponse(
    form.dataset.sendForm,
    form.elements.text.value,
    form.elements.preparedReplyId.value || null
  );
});

document.addEventListener('click', (event) => {
  const seedButton = event.target.closest('[data-seed-id]');
  if (seedButton) {
    selectSeed(seedButton.dataset.seedId);
    return;
  }

  const customerButton = event.target.closest('[data-conversation-id]');
  if (customerButton) {
    selectConversation(customerButton.dataset.conversationId);
    return;
  }

  const preparedFile = event.target.closest('[data-prepared-id]');
  if (!preparedFile) return;
  const slot = activeConversation();
  const reply = state.workspace.preparedReplies.find(
    (item) => item.preparedReplyId === preparedFile.dataset.preparedId
  );
  if (!slot || !reply) return;
  state.drafts.set(slot.conversationId, {
    text: reply.text,
    preparedReplyId: reply.preparedReplyId
  });
  renderMainChat();
  $('#main-composer textarea')?.focus();
  setStatus('Prepared text inserted. Send it directly or edit it first.');
});

loadWorkspace({ preserveContext: false }).catch(() => {});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshWorkspace();
});

window.addEventListener('focus', () => {
  refreshWorkspace();
});
