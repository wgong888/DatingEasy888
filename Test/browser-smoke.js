const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'CodeSource', 'Test');
const ORIGIN = process.env.PROTOTYPE_URL || 'http://127.0.0.1:4173';
const EDGE = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';

async function smokeScreenshot(page, filename) {
  await page.screenshot({
    path: path.join(OUTPUT, filename),
    fullPage: true,
    animations: 'disabled',
    timeout: 90_000
  });
}

async function customerFlow(browser, viewport, suffix) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(ORIGIN);
  await page.locator('[data-auth-tab="register"]').click();
  await page.locator('#register-form:not(.hidden)').waitFor();
  await page.locator('[data-auth-tab="recovery"]').click();
  await page.locator('#recovery-form:not(.hidden)').waitFor();
  await page.locator('[data-auth-tab="login"]').click();
  await page.locator('#login-form:not(.hidden)').waitFor();
  if (suffix === 'desktop') {
    await page.locator('#demo-login').click();
  } else {
    await page.locator('#login-form').getByRole('button', { name: 'Sign in', exact: true }).click();
  }
  await page.locator('#view-messages:not(.hidden)').waitFor();
  await page.getByRole('button', { name: 'Discover', exact: true }).click();
  await page.locator('#profile-grid .profile-card').first().waitFor();
  if (suffix === 'mobile') {
    await page.locator('#menu-button').click();
    await page.locator('#app-view.nav-open #side-nav').waitFor();
    await page.locator('#side-nav [data-view="favorites"]').click();
    await page.locator('#view-favorites:not(.hidden)').waitFor();
    assert.equal(await page.locator('#app-view.nav-open').count(), 0);
    await page.locator('.bottom-nav [data-view="discover"]').click();
    await page.locator('#profile-grid .profile-card').first().waitFor();
  }
  assert.equal(await page.locator('#profile-grid .profile-card').count(), 20);
  assert.equal(await page.locator('#profile-grid .profile-card', { hasText: /Daniel|Ethan|Lucas|Noah|Marcus|Adrian/ }).count(), 0);
  assert.equal(await page.locator('.disclosure').count(), 0);
  assert.equal(await page.getByText(/seed customer|robot customer/i).count(), 0);
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth
  }));
  assert.ok(
    dimensions.width <= dimensions.viewport,
    `customer ${suffix} page overflows: ${dimensions.width} > ${dimensions.viewport}`
  );
  await smokeScreenshot(page, `customer-discovery-${suffix}.png`);
  await page.locator('.profile-photo').first().click();
  await page.locator('#view-profile:not(.hidden)').waitFor();
  const publicProfile = page.locator('#view-profile');
  await publicProfile.getByRole('heading', { name: 'Short bio' }).waitFor();
  await publicProfile.getByRole('heading', { name: 'Short story' }).waitFor();
  await publicProfile.getByRole('heading', { name: 'Interests' }).waitFor();
  await publicProfile.getByRole('heading', { name: 'Movie preferences' }).waitFor();
  await publicProfile.getByRole('heading', { name: 'Music preferences' }).waitFor();
  const publicProfileText = await publicProfile.innerText();
  assert.doesNotMatch(publicProfileText, /@virtual\.datingeasy\.test|555-/iu);
  await smokeScreenshot(page, `customer-profile-${suffix}.png`);
  if (suffix === 'mobile') {
    await page.getByRole('button', { name: /^Chat with / }).click();
    await page.locator('.conversation-panel:not(.empty-state)').waitFor();
    await page.locator('[data-composer] textarea').fill(
      'Mobile chat should be easy to send.'
    );
    await page.locator('[data-composer]').getByRole('button', { name: 'Send', exact: true }).click();
    await page.locator('.message.outgoing', {
      hasText: 'Mobile chat should be easy to send.'
    }).waitFor();
    const chatDimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      sendHeight: document.querySelector('[data-send-message]').getBoundingClientRect().height,
      textHeight: document.querySelector('[data-composer] textarea').getBoundingClientRect().height
    }));
    assert.ok(
      chatDimensions.width <= chatDimensions.viewport,
      `customer ${suffix} chat overflows: ${chatDimensions.width} > ${chatDimensions.viewport}`
    );
    assert.ok(chatDimensions.sendHeight >= 48, 'mobile Send button should be easy to tap');
    assert.ok(chatDimensions.textHeight >= 48, 'mobile chat input should be easy to tap');
    await smokeScreenshot(page, 'customer-chat-mobile.png');
  }
  if (suffix === 'desktop') {
    await page.getByRole('button', { name: /^Chat with / }).click();
    await page.locator('[data-composer] textarea').fill(
      'Your profile made me smile. What is your ideal relaxed weekend?'
    );
    await page.locator('[data-composer]').getByRole('button', { name: 'Send', exact: true }).click();
    await page.locator('.message.outgoing').last().waitFor();
    await page.locator('#credit-balance').filter({ hasText: '245' }).waitFor();
    const chatOrder = await page.evaluate(() => {
      const composer = document.querySelector('[data-composer]');
      const gifts = document.querySelector('.gift-strip');
      return Boolean(composer && gifts && composer.compareDocumentPosition(gifts) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    assert.equal(chatOrder, true);
    await page.locator('[data-composer] textarea').fill(
      'The Enter key should send this second Arfa message.'
    );
    await page.locator('[data-composer] textarea').press('Enter');
    await page.locator('.message.outgoing', {
      hasText: 'The Enter key should send this second Arfa message.'
    }).waitFor();
    await page.locator('#credit-balance').filter({ hasText: '240' }).waitFor();
    await page.locator('[data-gift="1"]').click();
    await page.locator('.message.gift-message').last().waitFor();
    await page.locator('#credit-balance').filter({ hasText: '140' }).waitFor();
    await page.locator('#credits-button').click();
    await page.locator('#credits-dialog[open]').waitFor();
    assert.equal(await page.locator('.package-button').count(), 5);
    await page.locator('[data-select-package="1"]').click();
    await smokeScreenshot(page, 'customer-credit-checkout.png');
    await page.getByRole('button', { name: 'Add selected credits' }).click();
    await page.locator('#credits-dialog').waitFor({ state: 'hidden' });
    await page.locator('#credit-balance').filter({ hasText: '240' }).waitFor();
    await page.locator('.chat-favorite').click();
    await page.locator('.chat-favorite.active').waitFor();
    await smokeScreenshot(page, 'customer-chat-desktop.png');
    await page.locator('.conversation-item.active .mini-photo').click();
    await page.locator('#view-profile:not(.hidden)').waitFor();
    assert.equal(await page.locator('#view-profile .disclosure').count(), 0);
    await page.getByRole('button', { name: 'Remove favorite' }).waitFor();
    await page.getByRole('button', { name: /Back to messages/ }).click();
    await page.locator('#view-messages:not(.hidden)').waitFor();
    const reopenedConversation = page.waitForResponse((response) => (
      response.url().includes('/api/v1/customer/conversations/') &&
      response.url().endsWith('/messages') &&
      response.status() === 200
    ));
    await page.locator('.conversation-item').first().click();
    await reopenedConversation;
    await page.locator('[data-composer] textarea').fill(
      'I reopened this chat from the Messages list and the Send button works.'
    );
    await page.locator('[data-composer]').getByRole('button', { name: 'Send', exact: true }).click();
    await page.locator('.message.outgoing', {
      hasText: 'I reopened this chat from the Messages list and the Send button works.'
    }).waitFor();
    await page.locator('#credit-balance').filter({ hasText: '235' }).waitFor();
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    await page.locator('#search-input').fill('Grace');
    await page.locator('#discover-filter-form').getByRole('button', { name: 'Search' }).click();
    await page.waitForFunction(() => {
      const cards = [...document.querySelectorAll('#profile-grid .profile-card')];
      return cards.length > 0 && cards.every((card) => card.querySelector('h2')?.textContent.includes('Grace'));
    });
    await page.locator('#discover-filter-form').getByRole('button', { name: 'Clear' }).click();
    await page.waitForFunction(() => document.querySelectorAll('#profile-grid .profile-card').length === 20);
    assert.equal(await page.locator('#profile-grid .profile-card').count(), 20);
    await page.locator('#search-input').fill('Grace');
    await page.locator('#discover-filter-form').getByRole('button', { name: 'Search' }).click();
    await page.waitForFunction(() => {
      const cards = [...document.querySelectorAll('#profile-grid .profile-card')];
      return cards.length > 0 && cards.every((card) => card.querySelector('h2')?.textContent.includes('Grace'));
    });
    const graceCard = page.locator('#profile-grid .profile-card', { hasText: 'Grace' }).first();
    await graceCard.locator('.favorite-button').dispatchEvent('click');
    await page.getByRole('button', { name: 'Favorites', exact: true }).click();
    await page.locator('#favorite-grid .profile-card', { hasText: 'Grace' }).first().waitFor();
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    await page.locator('#search-input').fill('Grace');
    await page.locator('#discover-filter-form').getByRole('button', { name: 'Search' }).click();
    await page.waitForFunction(() => {
      const cards = [...document.querySelectorAll('#profile-grid .profile-card')];
      return cards.length > 0 && cards.every((card) => card.querySelector('h2')?.textContent.includes('Grace'));
    });
    await page.locator('#profile-grid .profile-card', { hasText: 'Grace' }).first().locator('.profile-photo').click();
    await page.locator('#view-profile:not(.hidden)').waitFor();
    await page.getByRole('button', { name: /^Chat with / }).click();
    await page.locator('[data-composer] textarea').fill(
      'Hi Grace, I want to keep chatting with you.'
    );
    await page.locator('[data-composer]').getByRole('button', { name: 'Send', exact: true }).click();
    await page.locator('.message.outgoing', {
      hasText: 'Hi Grace, I want to keep chatting with you.'
    }).waitFor();
    await page.locator('#credit-balance').filter({ hasText: '230' }).waitFor();
    await page.locator('#logout-button').click();
    await page.locator('#auth-view:not(.hidden)').waitFor();
  }
  await context.close();
}

async function newCustomerProfileFlow(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await page.goto(ORIGIN);
  await page.locator('.auth-tab[data-auth-tab="register"]').click();
  const form = page.locator('#register-form');
  await form.locator('[name="displayName"]').fill('Profile Morgan');
  await form.locator('[name="birthDate"]').fill('1990-05-15');
  await form.locator('[name="email"]').fill(`profile-${suffix}@example.test`);
  await form.locator('[name="phone"]').fill('+1-626-555-0199');
  await form.locator('[name="password"]').fill('Password123!');
  await form.locator('[name="sex"]').selectOption('Woman');
  await form.locator('[name="countryCode"]').selectOption('US');
  await form.locator('[name="state"]').fill('CA');
  await form.locator('[name="city"]').fill('Pasadena');
  await form.getByRole('button', { name: 'Create account' }).click();

  await page.locator('#view-me:not(.hidden)').waitFor();
  await page.getByText('Complete your profile', { exact: true }).waitFor();
  assert.equal(await page.locator('#conversation-list .conversation-item').count(), 0);
  assert.match(
    await page.locator('#profile-photo-preview').getAttribute('src'),
    /default-woman\.svg$/
  );
  assert.equal(await page.locator('#app-view.profile-incomplete').count(), 1);
  await page.locator('#view-me [data-open-credits]').click();
  await page.locator('#credits-dialog[open]').waitFor();
  await page.locator('#credits-dialog [data-close-dialog]').click();
  await page.locator('#credits-dialog').waitFor({ state: 'hidden' });

  const profile = page.locator('#profile-edit-form');
  await profile.locator('[name="email"]').fill(`profile-updated-${suffix}@example.test`);
  await profile.locator('[name="phone"]').fill('+1-626-555-0200');
  await profile.locator('[name="lookingFor"]').selectOption('Everyone');
  await profile.locator('[name="maritalStatus"]').selectOption('Single');
  await profile.getByRole('button', { name: 'Complete profile' }).click();
  await page.locator('#app-view:not(.profile-incomplete)').waitFor();
  await page.getByRole('button', { name: 'Save profile' }).waitFor();
  assert.equal(await page.locator('#profile-required:not(.hidden)').count(), 0);
  assert.equal(await page.locator('#conversation-list .conversation-item').count(), 0);

  await page.getByRole('button', { name: 'Discover', exact: true }).first().click();
  await page.locator('#view-discover:not(.hidden)').waitFor();
  const discoverForm = page.locator('#discover-filter-form');
  await discoverForm.locator('[name="countryCode"] option[value="US"]').waitFor({ state: 'attached' });
  await discoverForm.locator('[name="countryCode"]').selectOption('US');
  await discoverForm.locator('[name="state"] option[value="CA"]').waitFor({ state: 'attached' });
  await discoverForm.locator('[name="state"]').selectOption('CA');
  await discoverForm.locator('[name="city"] option[value="San Francisco"]').waitFor({ state: 'attached' });
  await discoverForm.locator('[name="city"] option[value="San Diego"]').waitFor({ state: 'attached' });
  await discoverForm.locator('[name="city"] option[value="Acalanes Ridge"]').waitFor({ state: 'attached' });
  await discoverForm.getByRole('button', { name: 'Search' }).click();
  await page.waitForFunction(() => {
    const cards = [...document.querySelectorAll('#profile-grid .profile-card')];
    return cards.length > 0;
  });
  await discoverForm.locator('[name="city"] option[value="Los Angeles"]').waitFor({ state: 'attached' });
  await discoverForm.locator('[name="city"]').selectOption('Los Angeles');
  await discoverForm.locator('[name="sex"]').selectOption('Woman');
  assert.equal(await discoverForm.locator('[name="status"]').inputValue(), 'active');
  await discoverForm.getByRole('button', { name: 'Search' }).click();
  await page.waitForFunction(() => {
    const cards = [...document.querySelectorAll('#profile-grid .profile-card')];
    return cards.length > 0 && cards.every((card) => (
      card.querySelector('.profile-location')?.textContent.trim() === 'Los Angeles, CA'
    ));
  });
  assert.ok(await page.locator('#profile-grid .profile-card').count() <= 20);
  await page.getByRole('button', { name: 'Me', exact: true }).first().click();
  await page.locator('#view-me:not(.hidden)').waitFor();
  assert.equal(await profile.locator('[name="email"]').inputValue(), `profile-updated-${suffix}@example.test`);
  assert.equal(await profile.locator('[name="phone"]').inputValue(), '+1-626-555-0200');
  assert.equal(await profile.locator('[name="maritalStatus"]').inputValue(), 'Single');
  assert.equal(await profile.locator('[name="preferredAgeMin"]').inputValue(), '');

  await smokeScreenshot(page, 'customer-profile-editor.png');
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileDimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth
  }));
  assert.ok(
    mobileDimensions.width <= mobileDimensions.viewport,
    `profile editor mobile page overflows: ${mobileDimensions.width} > ${mobileDimensions.viewport}`
  );
  await smokeScreenshot(page, 'customer-profile-editor-mobile.png');
  await page.locator('#logout-button').click();
  await page.locator('#auth-view:not(.hidden)').waitFor();
  assert.equal(await page.locator('#login-form:not(.hidden)').count(), 1);
  assert.equal(await profile.locator('[name="email"]').inputValue(), '');
  assert.equal(await profile.locator('[name="phone"]').inputValue(), '');
  assert.equal(await profile.locator('[name="displayName"]').inputValue(), '');
  assert.equal(await profile.locator('[name="maritalStatus"]').inputValue(), '');
  assert.equal(await page.locator('#profile-photo-preview').getAttribute('src'), null);
  await context.close();
}

async function employeeFlow(browser) {
  const customerContext = await browser.newContext();
  const scenarioId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const customerName = 'Recent Casey';
  const incomingText = 'Hello Maya. I just started this conversation and would enjoy hearing from you.';
  const registration = await customerContext.request.post(
    `${ORIGIN}/api/v1/auth/customer/register`,
    {
      data: {
        email: `employee-notification-${scenarioId}@example.test`,
        password: 'Password123!',
        displayName: customerName,
        birthDate: '1990-06-08',
        sex: 'Woman',
        countryCode: 'US',
        state: 'OR',
        city: 'Portland'
      }
    }
  );
  assert.equal(registration.status(), 201);
  const registered = await registration.json();
  const discoveryResponse = await customerContext.request.get(
    `${ORIGIN}/api/v1/customer/discovery/profiles?query=Maya`
  );
  assert.equal(discoveryResponse.status(), 200);
  const discovery = await discoveryResponse.json();
  const seed = discovery.data.items.find((profile) => profile.displayName === 'Maya');
  assert.ok(seed, 'Maya must be an active employee-operated seed');
  const conversationResponse = await customerContext.request.post(
    `${ORIGIN}/api/v1/customer/conversations/with/${seed.customerId}`
  );
  assert.equal(conversationResponse.status(), 200);
  const conversation = await conversationResponse.json();
  const sentResponse = await customerContext.request.post(
    `${ORIGIN}/api/v1/customer/conversations/${conversation.data.conversationId}/messages/text`,
    {
      headers: { 'Idempotency-Key': `employee-notification-${scenarioId}` },
      data: { text: incomingText }
    }
  );
  assert.equal(sentResponse.status(), 201);

  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${ORIGIN}/employee`);
  await page.getByRole('button', { name: 'Sign in to workspace' }).click();
  await page.locator('#employee-workspace').waitFor();
  assert.equal(await page.locator('.work-panel').count(), 4);

  const panelRatios = await page.evaluate(() => {
    const workspace = document.querySelector('#employee-workspace').getBoundingClientRect();
    return ['panel-a', 'panel-b', 'panel-c', 'panel-d'].map((id) => {
      const panel = document.querySelector(`#${id}`).getBoundingClientRect();
      return panel.width / workspace.width;
    });
  });
  const expectedRatios = [0.1, 0.15, 0.6, 0.15];
  panelRatios.forEach((ratio, index) => {
    assert.ok(
      Math.abs(ratio - expectedRatios[index]) < 0.015,
      `employee panel ${index + 1} ratio ${ratio} differs from ${expectedRatios[index]}`
    );
  });

  assert.equal(await page.locator('#panel-a .seed-row').count(), 5);
  assert.ok(await page.locator('#panel-b .customer-row').count() >= 1);
  assert.equal(await page.locator('#panel-c .gift-strip, #panel-c [data-gift]').count(), 0);
  assert.ok(await page.locator('#panel-d .prepared-folder').count() >= 1);

  const mayaRow = page.locator(`#panel-a .seed-row[data-seed-id="${seed.customerId}"]`);
  await mayaRow.locator('.seed-notification-dot').waitFor();
  await mayaRow.click();
  const firstCustomer = page.locator('#panel-b .customer-row').first();
  await firstCustomer.waitFor();
  assert.match(await firstCustomer.innerText(), new RegExp(customerName));
  await firstCustomer.click();
  await page.locator('#main-chat-history').getByText(incomingText, { exact: true }).waitFor();
  const liveIncomingText = 'This is a live customer follow-up while the employee chat is open.';
  const liveSent = await customerContext.request.post(
    `${ORIGIN}/api/v1/customer/conversations/${conversation.data.conversationId}/messages/text`,
    {
      headers: { 'Idempotency-Key': `employee-live-refresh-${scenarioId}` },
      data: { text: liveIncomingText }
    }
  );
  assert.equal(liveSent.status(), 201);
  await page.locator('#main-chat-history').getByText(liveIncomingText, { exact: true }).waitFor({
    timeout: 3000
  });
  const tooLongEmployeeText = Array.from({ length: 61 }, (_, index) => `word${index + 1}`).join(' ');
  await page.locator('#main-composer textarea').fill(tooLongEmployeeText);
  await page.locator('#main-composer textarea').press('Enter');
  await page.getByText(/at most 60 words/i).waitFor();
  await page.locator('#panel-d .prepared-file').first().click();
  const composer = page.locator('#main-composer textarea');
  const insertedText = await composer.inputValue();
  assert.ok(insertedText.length > 20);
  await composer.evaluate((textarea) => textarea.dispatchEvent(new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertLineBreak'
  })));
  await page.getByText('Prepared Text', { exact: false }).last().waitFor();

  const historyResponse = await customerContext.request.get(
    `${ORIGIN}/api/v1/customer/conversations/${conversation.data.conversationId}/messages`
  );
  assert.equal(historyResponse.status(), 200);
  const history = await historyResponse.json();
  const latest = history.data.messages.at(-1);
  assert.equal(latest.senderId, seed.customerId);
  assert.equal(latest.receiverId, registered.data.customerId);
  assert.equal(latest.text, insertedText);
  assert.equal(latest.responseSource, 'PreparedText');

  await smokeScreenshot(page, 'employee-workspace.png');
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.locator('#login-view:not(.hidden)').waitFor();
  await context.close();
  await customerContext.close();
}

async function adminFlow(browser) {
  const publicContext = await browser.newContext();
  const resetResponse = await publicContext.request.post(
    `${ORIGIN}/api/v1/auth/customer/password-reset-requests`,
    {
      data: {
        fullName: 'Alex',
        contact: 'demo@datingeasy.test'
      }
    }
  );
  assert.equal(resetResponse.status(), 202);
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const rejectCustomer = await publicContext.request.post(
    `${ORIGIN}/api/v1/auth/customer/register`,
    {
      data: {
        email: `reject-${suffix}@example.test`,
        password: 'Original123!',
        displayName: 'Reject Browser',
        birthDate: '1987-02-03',
        sex: 'Woman',
        countryCode: 'US',
        state: 'CA',
        city: 'Los Angeles'
      }
    }
  );
  assert.equal(rejectCustomer.status(), 201);
  const rejectReset = await publicContext.request.post(
    `${ORIGIN}/api/v1/auth/customer/password-reset-requests`,
    {
      data: {
        fullName: 'Reject Browser',
        contact: `reject-${suffix}@example.test`
      }
    }
  );
  assert.equal(rejectReset.status(), 202);
  await publicContext.close();

  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${ORIGIN}/admin`);
  await page.getByRole('button', { name: 'Sign in to administration' }).click();
  await page.locator('.metric').first().waitFor();
  assert.equal(await page.locator('.metric').count(), 6);
  await page.getByText('Real customers', { exact: true }).waitFor();
  await page.getByText('Credits consumed today', { exact: true }).waitFor();
  await page.getByText('Revenue today', { exact: true }).waitFor();

  await page.getByRole('button', { name: /Outgoing payments/ }).click();
  await page.getByRole('button', { name: 'Prepare payment' }).click();
  await page.locator('#payment-form [name="payeeName"]').fill('Browser Services LLC');
  await page.locator('#payment-form [name="category"]').selectOption({ label: 'Contractor' });
  await page.locator('#payment-form [name="amount"]').fill('160.75');
  await page.locator('#payment-form [name="description"]').fill('Browser-tested implementation services.');
  await page.locator('#payment-form').getByRole('button', { name: 'Send to CEO' }).click();
  await page.getByText(/payment sent to the CEO approval queue/).waitFor();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await page.locator('#payment-nav-count').click();
  await page.locator('.payment-admin-row', { hasText: 'Browser Services LLC' }).waitFor();

  await page.getByRole('button', { name: /Password resets/ }).click();
  const pendingReset = page.locator('[data-reset-row]', { hasText: 'Alex' });
  await pendingReset.waitFor();
  await pendingReset.getByRole('button', { name: 'Approve' }).click();
  await page.getByText(/One-time temporary password:/).waitFor();
  const rejectableReset = page.locator('[data-reset-row]', { hasText: 'Reject Browser' });
  await rejectableReset.waitFor();
  await rejectableReset.getByRole('button', { name: 'Reject' }).click();
  await page.getByText('Password reset request rejected.', { exact: true }).waitFor();
  await page.getByRole('button', { name: /Auto approval/ }).click();
  await page.getByText(/Password reset auto approval enabled/).waitFor();
  await page.getByRole('button', { name: /Auto approval/ }).click();
  await page.getByText(/Password reset auto approval disabled/).waitFor();

  await page.getByRole('button', { name: 'Employees', exact: true }).click();
  await page.getByRole('button', { name: 'Add employee' }).click();
  await page.locator('#employee-form [name="displayName"]').fill('Browser Operator');
  await page.locator('#employee-form [name="email"]').fill('browser-operator@example.test');
  await page.locator('#employee-form [name="sex"]').selectOption('NotSpecified');
  await page.locator('#employee-form [name="birthDate"]').fill('1991-02-03');
  await page.locator('#employee-form [name="phone"]').fill('+1-213-555-0901');
  await page.locator('#employee-form [name="address"]').fill('500 Browser Staff Lane, Los Angeles, CA');
  await page.locator('#employee-form [name="education"]').fill('Browser operations training');
  await page.locator('#employee-form [name="role"]').selectOption('ChatEmployee');
  await page.locator('#employee-form').getByRole('button', { name: 'Save employee' }).click();
  const employeeRow = page.locator('.admin-table-row', { hasText: 'Browser Operator' });
  await employeeRow.waitFor();
  await employeeRow.getByRole('button', { name: 'Edit' }).click();
  await page.locator('#employee-form [name="displayName"]').fill('Browser Operator Edited');
  await page.locator('#employee-form [name="phone"]').fill('+1-213-555-0902');
  await page.locator('#employee-form [name="education"]').fill('Edited browser operations training');
  await page.locator('#employee-form').getByRole('button', { name: 'Save employee' }).click();
  await page.getByText('Browser Operator Edited', { exact: true }).waitFor();
  await page.getByText('Edited browser operations training').waitFor();

  await page.getByRole('button', { name: 'Robot operations', exact: true }).click();
  await page.locator('#robot-summary .metric').first().waitFor();
  assert.equal(await page.locator('#robot-summary .metric').count(), 4);
  assert.equal(await page.locator('#robot-list .admin-table-row').count(), 412);
  assert.equal(await page.locator('#robot-list .robot-state.online').count(), 2);
  const robotFilter = page.locator('#robot-filter-form');
  await robotFilter.locator('[name="countryCode"]').selectOption('US');
  await robotFilter.locator('[name="state"]').selectOption('CA');
  await robotFilter.locator('[name="city"]').selectOption('Los Angeles');
  await robotFilter.locator('[name="active"]').selectOption('true');
  await robotFilter.getByRole('button', { name: 'Search' }).click();
  await page.getByText('Robot inventory filtered.', { exact: true }).waitFor();
  const filteredRobotCount = await page.locator('#robot-list .admin-table-row').count();
  assert.ok(filteredRobotCount > 0 && filteredRobotCount <= 2);
  assert.equal(
    await page.locator('#robot-list .admin-table-row').evaluateAll((rows) =>
      rows.every((row) => row.innerText.includes('Los Angeles, CA') && row.innerText.includes('Active'))
    ),
    true
  );
  const firstFilteredRobot = page.locator('#robot-list .admin-table-row').first();
  await firstFilteredRobot.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('heading', { name: 'Edit robot customer' }).waitFor();
  await page.locator('#robot-form [name="displayName"]').fill('Browser Edited Robot');
  await page.locator('#robot-form').getByRole('button', { name: 'Save robot profile' }).click();
  await page.getByText('Browser Edited Robot robot profile updated.', { exact: true }).waitFor();
  const editedRobotRow = page.locator('#robot-list .admin-table-row', { hasText: 'Browser Edited Robot' });
  await editedRobotRow.waitFor();
  await robotFilter.locator('[name="active"]').selectOption('false');
  await robotFilter.getByRole('button', { name: 'Search' }).click();
  await page.getByText('Robot inventory filtered.', { exact: true }).waitFor();
  assert.equal(
    await page.locator('#robot-list .admin-table-row').evaluateAll((rows) =>
      rows.length > 0 && rows.every((row) => !row.querySelector('.robot-state.online'))
    ),
    true
  );
  await robotFilter.locator('[name="countryCode"]').selectOption('');
  await robotFilter.locator('[name="active"]').selectOption('');
  await robotFilter.getByRole('button', { name: 'Search' }).click();
  await page.waitForFunction(() => document.querySelectorAll('#robot-list .admin-table-row').length === 412);

  await page.getByRole('button', { name: 'Add robot customer' }).click();
  const robotForm = page.locator('#robot-form');
  await robotForm.locator('[name="creationMode"]').selectOption('FullProfile');
  await page.locator('#robot-full-fields:not(.hidden)').waitFor();
  assert.ok(await page.locator('#robot-full-fields [required]').count() >= 10);
  await smokeScreenshot(page, 'admin-robot-full-profile-dialog.png');
  await robotForm.locator('[name="creationMode"]').selectOption('AutoFill');
  await page.locator('#robot-full-fields').waitFor({ state: 'hidden' });
  await robotForm.locator('[name="displayName"]').fill('Browser Taylor');
  await robotForm.locator('[name="age"]').fill('39');
  await robotForm.locator('[name="sex"]').selectOption('Woman');
  await robotForm.locator('[name="countryCode"]').selectOption('US');
  await robotForm.locator('[name="state"]').selectOption({ label: 'California' });
  await robotForm.locator('[name="city"]').selectOption('Los Angeles');
  assert.equal(await robotForm.locator('[name="state"]').inputValue(), 'CA');
  assert.equal(await robotForm.locator('[name="city"]').inputValue(), 'Los Angeles');
  await smokeScreenshot(page, 'admin-robot-create-dialog.png');
  await robotForm.getByRole('button', { name: 'Create robot draft' }).click();
  await page.getByText(/Browser Taylor created as an inactive auto-filled robot draft/).waitFor();
  const robotDraft = page.locator('#robot-list .admin-table-row', { hasText: 'Browser Taylor' });
  await robotDraft.waitFor();
  await robotDraft.getByText('Inactive draft', { exact: true }).waitFor();
  await robotDraft.getByText(/AdminAssisted · Pending/).waitFor();
  assert.equal(await page.locator('#robot-list .admin-table-row').count(), 413);
  await page.locator('#robot-ai-form [name="mode"]').selectOption('HybridExternalAllowed');
  await page.locator('#robot-ai-form').getByRole('button', { name: 'Save AI policy' }).click();
  await page.getByText('Robot AI policy updated for every robot.', { exact: true }).waitFor();
  assert.ok(await page.locator('#robot-shift-list .robot-shift-row').count() >= 2);
  await page.getByRole('button', { name: 'Regenerate day' }).click();
  await page.getByText(/Robot shifts regenerated/).waitFor();
  await smokeScreenshot(page, 'admin-robot-operations.png');

  await page.getByRole('button', { name: 'Policies', exact: true }).click();
  await page.getByRole('button', { name: 'Add policy' }).click();
  await page.locator('#policy-form [name="policyKey"]').fill('browser_test_policy');
  await page.locator('#policy-form [name="title"]').fill('Browser test policy');
  await page.locator('#policy-form [name="description"]').fill('Browser administration workflow.');
  await page.locator('#policy-form [name="value"]').fill('enabled');
  await page.locator('#policy-form').getByRole('button', { name: 'Add policy' }).click();
  const policyForm = page.locator('[data-policy-form]', { hasText: 'Browser test policy' });
  await policyForm.waitFor();
  await policyForm.locator('[name="value"]').fill('reviewed');
  await policyForm.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Policy updated and versioned.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await page.getByRole('button', { name: 'Policies', exact: true }).click();
  assert.equal(
    await page.locator('[data-policy-form]', { hasText: 'Browser test policy' }).locator('[name="value"]').inputValue(),
    'reviewed'
  );

  await page.getByRole('button', { name: 'System health' }).click();
  await page.getByRole('button', { name: 'Refresh checks' }).click();
  assert.ok(await page.locator('.health-row').count() >= 5);
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await smokeScreenshot(page, 'admin-dashboard.png');
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.locator('#login-view:not(.hidden)').waitFor();
  await context.close();
}

async function ceoFlow(browser) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${ORIGIN}/ceo`);
  await page.getByRole('button', { name: 'Sign in to CEO dashboard' }).click();
  await page.locator('.ceo-panels').waitFor();
  assert.equal(await page.locator('.ceo-panel').count(), 4);
  assert.equal(await page.locator('.finance-period').count(), 3);
  assert.equal(await page.locator('#online-grid article').count(), 4);
  assert.equal(await page.locator('#ceo-health-list article').count(), 5);
  assert.equal(await page.locator('.ceo-approval-row').count(), 3);
  await page.getByText('Browser Services LLC', { exact: true }).waitFor();

  const panelOrder = await page.evaluate(() => (
    ['panel-a', 'panel-b', 'panel-c', 'panel-d'].map((id) => {
      const box = document.querySelector(`#${id}`).getBoundingClientRect();
      return { id, top: box.top, bottom: box.bottom, width: box.width };
    })
  ));
  panelOrder.forEach((panel, index) => {
    assert.ok(panel.width > 1400, `${panel.id} should span the CEO main panel`);
    if (index > 0) {
      assert.ok(panel.top >= panelOrder[index - 1].bottom, `${panel.id} must be below the prior panel`);
    }
  });

  await smokeScreenshot(page, 'ceo-dashboard.png');

  await page.locator('.ceo-approval-row', { hasText: 'Browser Services LLC' }).click();
  await page.locator('#decision-remark').fill('Browser approval test.');
  await page.getByRole('button', { name: 'Approve payment' }).click();
  await page.getByText(/Browser Services LLC payment approved/).waitFor();
  assert.equal(await page.locator('.ceo-approval-row').count(), 2);

  await page.locator('.ceo-approval-row').first().click();
  await page.locator('#decision-remark').fill('Browser denial test.');
  await page.getByRole('button', { name: 'Deny', exact: true }).click();
  await page.getByText(/payment denied/).waitFor();
  assert.equal(await page.locator('.ceo-approval-row').count(), 1);
  await page.getByRole('button', { name: 'Refresh' }).click();
  await page.getByText('Dashboard refreshed.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.locator('#login-view:not(.hidden)').waitFor();
  await context.close();
}

async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  try {
    const health = await fetch(`${ORIGIN}/api/v1/health`).then((response) => response.json());
    assert.equal(health.data.status, 'Healthy');
    await customerFlow(browser, { width: 1440, height: 1000 }, 'desktop');
    await customerFlow(browser, { width: 390, height: 844 }, 'mobile');
    await newCustomerProfileFlow(browser);
    await employeeFlow(browser);
    await adminFlow(browser);
    await ceoFlow(browser);
  } finally {
    await browser.close();
  }
  console.log(`Browser smoke screenshots: ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
