const $ = (selector) => document.querySelector(selector);

const state = {
  workspace: null,
  selectedSeedId: null,
  activeConversationId: null,
  drafts: new Map(),
  messageRefreshTimer: null,
  workspaceRefreshTimer: null,
  keepaliveTimer: null,
  activeEventSource: null,
  eventSourceConversationId: null,
  messageRefreshInFlight: false,
  workspaceRefreshInFlight: false,
  sendingConversationIds: new Set()
};

const MAX_MESSAGE_WORDS = 60;
const MESSAGE_REFRESH_MS = 500;
const WORKSPACE_REFRESH_MS = 15000;
const STAFF_SESSION_KEEPALIVE_MS = 60_000;

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
  return slot?.messages?.at(-1);
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

function appendMessageToSlot(conversationId, message) {
  if (!state.workspace) return null;
  const slot = state.workspace.chatSlots.find((item) => item.conversationId === conversationId);
  if (!slot) return null;
  if (!slot.messages.some((item) => item.chatRecordId === message.chatRecordId)) {
    slot.messages.push(message);
  }
  slot.updatedAt = message.chatTime;
  slot.waitingForEmployee = message.senderId !== slot.seed.customerId;
  slot.status = slot.waitingForEmployee ? 'Waiting for response' : 'Responded';
  return slot;
}

function renderMainChatHistory(slot) {
  const history = $('#main-chat-history');
  if (!history) return;
  const wasNearBottom = history.scrollHeight - history.scrollTop - history.clientHeight < 80;
  history.innerHTML = slot.messages.map((message) => renderMessage(message, slot)).join('');
  if (wasNearBottom) {
    requestAnimationFrame(() => {
      history.scrollTop = history.scrollHeight;
    });
  }
}

function applyUpdatedSlot(updatedSlot) {
  if (!updatedSlot || updatedSlot.conversationId !== state.activeConversationId) return;
  const current = activeConversation();
  const currentLatest = latestMessage(current || {})?.chatRecordId || '';
  const updatedLatest = latestMessage(updatedSlot)?.chatRecordId || '';
  replaceChatSlot(updatedSlot);
  if (currentLatest !== updatedLatest || current?.status !== updatedSlot.status) {
    renderCustomerList();
    renderConversationState(updatedSlot);
    renderMainChatHistory(updatedSlot);
  }
}

function updateComposerWordCount(form) {
  if (!form) return;
  const count = wordCount(form.elements.text.value);
  const wordCountLabel = form.querySelector('[data-word-count]');
  if (wordCountLabel) wordCountLabel.textContent = `${count} / ${MAX_MESSAGE_WORDS} words`;
}

function resizeComposerTextBox(input) {
  if (!input) return;
  input.style.height = 'auto';
  input.style.height = `${input.scrollHeight}px`;
}

function sendComposerForm(form) {
  return sendResponse(
    form.dataset.sendForm,
    form.elements.text.value,
    form.elements.preparedReplyId.value || null
  );
}

function handleComposerReturn(event, form) {
  const enterPressed =
    event.key === 'Enter' ||
    event.key === 'Return' ||
    event.code === 'Enter' ||
    event.code === 'NumpadEnter' ||
    event.inputType === 'insertLineBreak' ||
    event.inputType === 'insertParagraph';
  if (!enterPressed || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  event.stopPropagation();
  sendComposerForm(form);
}

function bindComposerEvents() {
  const form = $('#main-composer');
  const input = $('#main-composer [name="text"]');
  if (!form || !input) return;
  input.addEventListener('keydown', (event) => handleComposerReturn(event, form), true);
  input.addEventListener('beforeinput', (event) => handleComposerReturn(event, form), true);
  input.addEventListener('input', () => {
    updateComposerWordCount(form);
    resizeComposerTextBox(input);
    state.drafts.set(form.dataset.sendForm, {
      text: form.elements.text.value,
      preparedReplyId: form.elements.preparedReplyId.value || null
    });
  });
  resizeComposerTextBox(input);
}

function renderConversationState(slot) {
  const stateElement = $('.conversation-state');
  if (!stateElement) return;
  stateElement.className = `conversation-state ${slot.waitingForEmployee ? 'waiting' : ''}`;
  stateElement.textContent = slot.status;
}

function renderMainChat() {
  const slot = activeConversation();
  const seed = selectedSeed();
  if (!seed) {
    stopConversationStream();
    $('#main-chat').innerHTML = '<div class="main-chat-empty">Select an active seed in Panel A.</div>';
    return;
  }
  if (!slot) {
    stopConversationStream();
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
    <div id="main-chat-history" class="main-chat-history"></div>
    <form id="main-composer" class="main-composer" data-send-form="${slot.conversationId}">
      <textarea
        name="text"
        rows="2"
        maxlength="600"
        autocomplete="off"
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
  renderMainChatHistory(slot);
  bindComposerEvents();
  startConversationStream(slot.conversationId);
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
  const input = $('#main-composer [name="text"]');
  if (!form || !input) return null;
  state.drafts.set(form.dataset.sendForm, {
    text: input.value,
    preparedReplyId: form.elements.preparedReplyId.value || null
  });
  return {
    conversationId: form.dataset.sendForm,
    focused: document.activeElement === input,
    selectionStart: input.selectionStart,
    selectionEnd: input.selectionEnd
  };
}

function restoreComposerSnapshot(snapshot) {
  if (!snapshot?.focused || snapshot.conversationId !== state.activeConversationId) return;
  requestAnimationFrame(() => {
    const input = $('#main-composer [name="text"]');
    if (!input) return;
    input.focus();
    const start = Math.min(snapshot.selectionStart, input.value.length);
    const end = Math.min(snapshot.selectionEnd, input.value.length);
    input.setSelectionRange(start, end);
    resizeComposerTextBox(input);
  });
}

async function refreshWorkspace() {
  if (
    state.workspaceRefreshInFlight ||
    !state.workspace ||
    $('#workspace-view').classList.contains('hidden')
  ) {
    return;
  }
  state.workspaceRefreshInFlight = true;
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
    state.workspaceRefreshInFlight = false;
  }
}

async function keepStaffSessionAlive() {
  if (!state.workspace || $('#workspace-view').classList.contains('hidden')) return;
  try {
    await api('/api/v1/auth/staff/keepalive', { method: 'POST' });
  } catch (error) {
    if (error.code === 'UNAUTHORIZED' || error.code === 'SESSION_EXPIRED') {
      stopLiveRefresh();
      state.workspace = null;
      $('#workspace-view').classList.add('hidden');
      $('#login-view').classList.remove('hidden');
    }
  }
}

function startLiveRefresh() {
  if (!state.messageRefreshTimer) {
    state.messageRefreshTimer = setInterval(refreshActiveConversation, MESSAGE_REFRESH_MS);
  }
  if (!state.workspaceRefreshTimer) {
    state.workspaceRefreshTimer = setInterval(refreshWorkspace, WORKSPACE_REFRESH_MS);
  }
  keepStaffSessionAlive();
  if (!state.keepaliveTimer) {
    state.keepaliveTimer = setInterval(keepStaffSessionAlive, STAFF_SESSION_KEEPALIVE_MS);
  }
}

function stopLiveRefresh() {
  if (state.messageRefreshTimer) clearInterval(state.messageRefreshTimer);
  if (state.workspaceRefreshTimer) clearInterval(state.workspaceRefreshTimer);
  if (state.keepaliveTimer) clearInterval(state.keepaliveTimer);
  state.messageRefreshTimer = null;
  state.workspaceRefreshTimer = null;
  state.keepaliveTimer = null;
  stopConversationStream();
}

function replaceChatSlot(updatedSlot) {
  if (!state.workspace) return;
  const index = state.workspace.chatSlots.findIndex(
    (slot) => slot.conversationId === updatedSlot.conversationId
  );
  if (index >= 0) state.workspace.chatSlots[index] = updatedSlot;
  else state.workspace.chatSlots.unshift(updatedSlot);
}

async function refreshActiveConversation() {
  if (
    state.messageRefreshInFlight ||
    !state.activeConversationId ||
    !state.workspace ||
    $('#workspace-view').classList.contains('hidden')
  ) {
    return;
  }
  state.messageRefreshInFlight = true;
  try {
    const updatedSlot = await api(
      `/api/v1/backend/conversations/${encodeURIComponent(state.activeConversationId)}/messages`
    );
    applyUpdatedSlot(updatedSlot);
  } catch (error) {
    if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
      stopLiveRefresh();
      state.workspace = null;
      $('#workspace-view').classList.add('hidden');
      $('#login-view').classList.remove('hidden');
    }
  } finally {
    state.messageRefreshInFlight = false;
  }
}

function stopConversationStream() {
  if (state.activeEventSource) state.activeEventSource.close();
  state.activeEventSource = null;
  state.eventSourceConversationId = null;
}

function startConversationStream(conversationId) {
  if (!conversationId || state.eventSourceConversationId === conversationId) return;
  stopConversationStream();
  const source = new EventSource(
    `/api/v1/backend/conversations/${encodeURIComponent(conversationId)}/events`
  );
  state.activeEventSource = source;
  state.eventSourceConversationId = conversationId;
  source.onmessage = (event) => {
    try {
      applyUpdatedSlot(JSON.parse(event.data));
    } catch {
      // Ignore malformed stream events; fallback polling remains active.
    }
  };
  source.onerror = () => {
    // Keep the polling fallback active. EventSource will retry automatically.
  };
}

function selectSeed(seedId) {
  state.selectedSeedId = seedId;
  state.activeConversationId = conversationsForSelectedSeed()[0]?.conversationId || null;
  renderWorkspace();
  refreshActiveConversation();
}

function selectConversation(conversationId) {
  state.activeConversationId = conversationId;
  renderWorkspace();
  $('#main-composer [name="text"]')?.focus();
  refreshActiveConversation();
}

async function sendResponse(conversationId, text, preparedReplyId = null) {
  if (state.sendingConversationIds.has(conversationId)) return;
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
  state.sendingConversationIds.add(conversationId);
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
    const slot = appendMessageToSlot(conversationId, result);
    if (slot) {
      renderCustomerList();
      renderConversationState(slot);
      renderMainChatHistory(slot);
      const composerInput = $('#main-composer [name="text"]');
      composerInput.value = '';
      resizeComposerTextBox(composerInput);
      updateComposerWordCount($('#main-composer'));
    }
    setStatus(`Sent as ${selectedSeed()?.displayName || 'the selected seed'} · ${result.responseSource}`, 'success');
    await refreshActiveConversation();
    await refreshWorkspace();
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    state.sendingConversationIds.delete(conversationId);
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
  updateComposerWordCount(form);
  state.drafts.set(form.dataset.sendForm, {
    text: form.elements.text.value,
    preparedReplyId: form.elements.preparedReplyId.value || null
  });
});

document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented) return;
  const form = event.target.closest('form');
  if (!event.target.matches('#main-composer [name="text"]') || !form) return;
  handleComposerReturn(event, form);
}, true);

document.addEventListener('beforeinput', (event) => {
  if (event.defaultPrevented) return;
  const form = event.target.closest('form');
  if (!event.target.matches('#main-composer [name="text"]') || !form) return;
  handleComposerReturn(event, form);
}, true);

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-send-form]');
  if (!form) return;
  event.preventDefault();
  await sendComposerForm(form);
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
  $('#main-composer [name="text"]')?.focus();
  setStatus('Prepared text inserted. Send it directly or edit it first.');
});

loadWorkspace({ preserveContext: false }).catch(() => {});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    refreshWorkspace();
    refreshActiveConversation();
  }
});

window.addEventListener('focus', () => {
  refreshWorkspace();
  refreshActiveConversation();
});
