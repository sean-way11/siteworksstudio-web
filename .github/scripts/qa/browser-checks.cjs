'use strict';

// Portable between local Playwright and Cloudflare Browser Run /script.
// https://playwright.dev/docs/api/class-browsercontext#browser-context-route
// https://developers.cloudflare.com/browser-run/script/#runner-arguments
async function checkSite({ page, baseUrl, paths }) {
  const checks = [];
  const errors = [];
  const submissions = [];
  const blockedWrites = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const record = async (name, fn) => {
    try { await fn(); checks.push({ name, passed: true }); }
    catch (e) { checks.push({ name, passed: false, error: e.message }); }
  };
  const origin = new URL(baseUrl).origin;
  const osUrl = 'https://os.siteworksstudio.ru/';
  const redirects = new Set(['admin.html', 'admin/index.html']);
  let checkingRedirect = false;
  let allowMockLead = false;
  page.setDefaultTimeout(6000);
  page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', e => errors.push(e.message));
  // Block every write before it reaches the network. Even a broken test cannot
  // create a real order or send a Telegram message. Test only synthetic data.
  await page.context().route('**/*', async route => {
    const request = route.request();
    // Verify legacy redirects without depending on the OS login application.
    if (checkingRedirect && request.isNavigationRequest() && request.url() === osUrl) {
      return route.fulfill({ status: 200, contentType: 'text/html',
        body: '<!doctype html><title>OS redirect target</title><main>OS redirect target</main>' });
    }
    if (['GET', 'HEAD'].includes(request.method())) return route.continue();
    const url = new URL(request.url());
    if (allowMockLead && url.origin === 'https://aysvovhvsttfjfhigbjt.supabase.co' &&
        url.pathname === '/functions/v1/sws-public-site-lead' && request.method() === 'POST') {
      submissions.push(request.postDataJSON());
      return route.fulfill({ status: submissions.length === 1 ? 503 : 200,
        contentType: 'application/json', body: JSON.stringify({ ok: submissions.length !== 1 }),
        headers: { 'access-control-allow-origin': origin } });
    }
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: {
      'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type' } });
    blockedWrites.push({ method: request.method(), host: url.hostname, path: url.pathname });
    return route.abort('blockedbyclient');
  });
  const visit = async path => {
    const response = await page.goto(new URL(path, baseUrl).href, { waitUntil: 'load' });
    assert(response && response.status() === 200, `${path}: expected HTTP 200`);
    assert(new URL(page.url()).origin === origin, `${path}: unexpected redirect`);
  };
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of paths) await record(`${width}px ${path}`, async () => {
      if (redirects.has(path)) {
        checkingRedirect = true;
        try {
          await page.goto(new URL(path, baseUrl).href, { waitUntil: 'domcontentloaded' });
          await page.waitForURL(osUrl, { waitUntil: 'domcontentloaded' });
          assert(await page.title() === 'OS redirect target', 'Legacy admin link did not reach the OS');
        } finally { checkingRedirect = false; }
        return;
      }
      await visit(path);
      assert((await page.title()).trim(), 'Missing title');
      assert(await page.locator('main').count() > 0, 'Missing main content');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(overflow <= 1, `Horizontal overflow: ${overflow}px`);
      const broken = await page.locator('img').evaluateAll(imgs => imgs.filter(i =>
        i.getClientRects().length > 0 && i.loading !== 'lazy' && i.complete && i.naturalWidth === 0).length);
      assert(broken === 0, `${broken} broken eager images`);
    });
  }
  for (const width of [390, 1179, 1180]) await record(`menu ${width}px`, async () => {
    await page.setViewportSize({ width, height: 900 });
    await visit('index.html');
    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#site-nav');
    if (width >= 1180) {
      assert(!await toggle.isVisible(), 'Mobile toggle visible on desktop');
      assert(await nav.isVisible(), 'Desktop navigation hidden');
      return;
    }
    assert(!await nav.isVisible(), 'Closed menu is visible');
    await toggle.focus();
    await page.keyboard.press('Enter');
    assert(await toggle.getAttribute('aria-expanded') === 'true', 'Menu did not open with keyboard');
    assert(await nav.isVisible(), 'Open menu is hidden');
    await page.keyboard.press('Escape');
    assert(await toggle.getAttribute('aria-expanded') === 'false', 'Escape did not close menu');
    assert(!await nav.isVisible(), 'Closed links remain visible');
    assert(await toggle.evaluate(el => el === document.activeElement), 'Escape lost keyboard focus');
  });
  await record('reduced motion', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 900 });
    await visit('index.html');
    await page.locator('.nav-toggle').click();
    const moving = await page.locator('#site-nav').evaluate(el => el.getAnimations().filter(a =>
      a.playState === 'running' && a.effect.getComputedTiming().duration > 1).length);
    assert(moving === 0, 'Menu animates despite reduced motion');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });
  await record('portfolio image viewer', async () => {
    await visit('digital-portfolio/index.html');
    await page.locator('.work img').first().click();
    await page.locator('#lightbox.open').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const img = document.querySelector('#lightbox img');
      return img.complete && img.naturalWidth > 0;
    });
    await page.keyboard.press('Escape');
    assert(!await page.locator('#lightbox').isVisible(), 'Image viewer did not close');
  });
  await record('form validation, mocked failure/retry, edited brief', async () => {
    await visit('order.html');
    const form = page.locator('#brief-form');
    await form.locator('button[type=submit]').click();
    assert(await page.locator('#brief-error').isVisible(), 'Empty form has no validation message');
    assert(submissions.length === 0, 'Empty form submitted');
    await page.locator('#f-name').fill('QA synthetic test');
    await page.locator('#f-service').selectOption('landing');
    await page.locator('#f-business').fill('Synthetic browser check; no real customer');
    await page.locator('#f-goal').selectOption({ index: 1 });
    await page.locator('#f-contact').fill('qa@example.invalid');
    await form.locator('button[type=submit]').click();
    assert(await page.locator('#brief-result').isVisible(), 'No preview for valid form');
    assert(!await page.locator('#brief-save-draft').isChecked(), 'Draft storage enabled by default');
    allowMockLead = true;
    await page.locator('#brief-submit').click();
    await page.waitForFunction(() => document.querySelector('#brief-submit').textContent.includes('Повторить'));
    await page.locator('#brief-submit').click();
    await page.waitForFunction(() => document.querySelector('#brief-status').textContent.includes('Заявка отправлена'));
    assert(submissions.length === 2, 'Expected exactly two intercepted attempts');
    assert(submissions[0]._request_id === submissions[1]._request_id, 'Retry changed request ID');
    assert(submissions[1].website === '', 'Honeypot was not included or was populated');
    await page.locator('#f-business').fill('A different synthetic project');
    await form.locator('button[type=submit]').click();
    await page.locator('#brief-submit').click();
    await page.waitForFunction(() => document.querySelector('#brief-status').textContent.includes('Заявка отправлена'));
    assert(submissions.length === 3, 'Edited brief not intercepted');
    assert(submissions[2]._request_id !== submissions[1]._request_id, 'Edited brief reused request ID');
    allowMockLead = false;
  });
  await record('runtime and outbound write guard', async () => {
    assert(errors.length === 0, `JavaScript errors: ${errors.join('; ')}`);
    assert(blockedWrites.length === 0, `Unexpected write requests: ${JSON.stringify(blockedWrites)}`);
  });
  return { passed: checks.every(c => c.passed), checks, interceptedLeadAttempts: submissions.length,
    realLeadRequests: 0, blockedWrites, runtimeErrors: errors };
}
module.exports = { checkSite };

