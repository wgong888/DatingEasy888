const $ = (selector) => document.querySelector(selector);

const state = {
  workspace: null,
  selectedSeedId: null,
  activeConversationId: null,
  drafts: new Map()
};

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
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers,
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

function photoStyle(profile) {
  return `--photo: url("${profile.photo.src}"); --position: ${profile.photo.position}`;
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
        <span><strong>No gifts</strong> · Employee replies only</span>
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
}

async function sendResponse(conversationId, text, preparedReplyId = null) {
  const cleaned = String(text || '').trim();
  if (!cleaned) {
    setStatus('Write or select an answer first.', 'error');
    return;
  }
  setStatus('Sending response...');
  try {
    const result = await api(
      `/api/v1/backend/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
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
  state.drafts.set(form.dataset.sendForm, {
    text: form.elements.text.value,
    preparedReplyId: form.elements.preparedReplyId.value || null
  });
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
