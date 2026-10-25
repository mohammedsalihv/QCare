const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { spawn } = require('node:child_process');

module.exports = async function checkSpecialtyBrowser({ base, admin, staff, token, Specialty }) {
  const { chromium } = require(process.env.QCARE_TEST_PLAYWRIGHT || 'C:/Users/salih/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const root = path.resolve(__dirname, '../../..');
  const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5194', '--strictPort'], { cwd: path.join(root, 'client'), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Local Vite server did not start')), 20000);
      vite.stdout.on('data', chunk => { if (chunk.toString().includes('ready in')) { clearTimeout(timer); resolve(); } });
      vite.once('error', error => { clearTimeout(timer); reject(error); });
      vite.once('exit', code => { clearTimeout(timer); reject(new Error('Vite exited: ' + code)); });
    });
    browser = await chromium.launch({ headless: true, executablePath: process.env.QCARE_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    const context = await browser.newContext({ viewport: { width: 1365, height: 950 } });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    let directoryFailure = true; let deleteFailure = false; let legacyDirectory = false;
    await context.route('**/socket.io/**', route => route.abort());
    await context.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/notifications') return route.fulfill({ json: [] });
      if (url.pathname === '/api/users/directory' && legacyDirectory) return route.fulfill({ status: 404, body: 'Cannot GET /api/users/directory' });
      if (url.pathname === '/api/users/directory' && directoryFailure) return route.fulfill({ status: 503, json: { message: 'Test directory temporarily unavailable' } });
      if (url.pathname.startsWith('/api/specialties/') && route.request().method() === 'DELETE' && deleteFailure) return route.fulfill({ status: 503, json: { message: 'Test deletion temporarily unavailable' } });
      // All specialty, department and user requests run against the real isolated database API.
      const response = await route.fetch({ url: base + url.pathname + url.search });
      await route.fulfill({ response });
    });
    await context.addInitScript(user => { if (!localStorage.getItem('userInfo')) localStorage.setItem('userInfo', JSON.stringify(user)); }, { _id: String(admin._id), employeeName: admin.employeeName, role: admin.role, token: token(admin) });
    await page.goto('http://127.0.0.1:5194/dashboard/speciality-master');
    await page.getByRole('heading', { name: 'Specialty Master', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Add specialty', exact: true }).click();
    await page.getByText('Test directory temporarily unavailable', { exact: false }).waitFor();
    directoryFailure = false;
    await page.getByRole('button', { name: 'Retry staff list', exact: true }).click();
    await page.getByLabel('Specialty name', { exact: true }).fill('Browser Cardiology');
    await page.getByRole('combobox', { name: 'Department', exact: true }).click();
    await page.getByRole('option', { name: 'Medicine', exact: true }).click();
    await page.getByRole('combobox', { name: 'Specialty lead', exact: true }).click();
    await page.getByRole('option', { name: /Test Doctor/ }).click();
    assert.equal(await page.getByLabel('Specialty Code', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Save specialty', exact: true }).click();
    await page.getByRole('cell', { name: 'Browser Cardiology', exact: true }).waitFor();
    let saved = await Specialty.findOne({ name: 'Browser Cardiology' });
    assert(saved); assert.equal(String(saved.head), String(staff._id));
    await page.reload();
    await page.getByRole('cell', { name: 'Browser Cardiology', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Change status for Browser Cardiology', exact: true }).click();
    await page.getByRole('button', { name: 'Change status for Browser Cardiology', exact: true }).filter({ hasText: 'Inactive' }).waitFor();
    await page.reload();
    await page.getByRole('button', { name: 'Change status for Browser Cardiology', exact: true }).filter({ hasText: 'Inactive' }).waitFor();
    deleteFailure = true;
    await page.getByRole('button', { name: 'Delete Browser Cardiology', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await page.getByText('Test deletion temporarily unavailable', { exact: true }).waitFor();
    assert.equal(await page.getByRole('cell', { name: 'Browser Cardiology', exact: true }).count(), 1);
    assert(await Specialty.findOne({ name: 'Browser Cardiology' }));
    deleteFailure = false;
    await page.getByRole('button', { name: 'Delete Browser Cardiology', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await page.getByText('No specialties saved yet.', { exact: true }).waitFor();
    await page.reload(); await page.getByText('No specialties saved yet.', { exact: true }).waitFor();
    assert.equal(await Specialty.findOne({ name: 'Browser Cardiology' }), null);
    legacyDirectory = true;
    await page.getByRole('button', { name: 'Add specialty', exact: true }).click();
    await page.getByRole('combobox', { name: 'Specialty lead', exact: true }).click();
    await page.getByRole('option', { name: /Test Doctor/ }).waitFor();
    await fs.mkdir(path.join(root, 'output/specialty-verification'), { recursive: true });
    await page.screenshot({ path: path.join(root, 'output/specialty-verification/staff-directory.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(root, 'output/specialty-verification/specialty-mobile.png'), fullPage: true });
    legacyDirectory = false;
    // A normal staff account can load the directory even if unrelated risk data fails.
    await page.evaluate(user => localStorage.setItem('userInfo', JSON.stringify(user)), { _id: String(staff._id), employeeName: staff.employeeName, role: staff.role, token: token(staff) });
    await page.goto('http://127.0.0.1:5194/dashboard/risks');
    await page.getByRole('button', { name: 'Identify New Risk', exact: true }).click();
    await page.getByRole('combobox', { name: 'Risk owner', exact: true }).click();
    await page.getByRole('option', { name: /Test Doctor/ }).waitFor();
    assert.deepEqual(errors, []);
    console.log('Browser verified: directory retry and legacy administrator fallback, real MongoDB create and reload, persistent status, failed deletion retention, successful deletion and reload, no code field, and staff directory access independent of other page requests.');
  } finally { if (browser) await browser.close(); vite.kill(); }
};
