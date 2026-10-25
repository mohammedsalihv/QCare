const { chromium } = require('C:/Users/salih/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { spawn } = require('node:child_process');
const path = require('node:path');
(async () => {
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5188', '--strictPort'], { cwd: path.join(__dirname, '../client'), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => { const timer = setTimeout(() => { server.kill(); reject(new Error('Local server did not start')); }, 20000); server.stdout.on('data', chunk => { if (chunk.toString().includes('ready in')) { clearTimeout(timer); resolve(); } }); server.once('error', reject); });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage(); const errors = []; const mutations = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = { indicatorCode: 'QUALITY-001', indicatorName: 'Assessment completion', category: 'patient-safety', owner: 'Nursing department', dataSource: 'Audit register', numeratorDesc: 'Completed assessments', denominatorDesc: 'Eligible records', unit: '%', target: 95, calculationRule: { multiplier: 100, targetDirection: 'higher', warningTolerance: 0 }, improvementActions: [] };
    const records = [
      { ...base, _id: 'report-1', numerator: 90, denominator: 100, calculatedValue: 90, status: 'breached', validationStatus: 'Approved', reportingPeriod: 'Q3', reportingYear: 2026, createdAt: '2026-07-01' },
      { ...base, _id: 'report-2', numerator: 96, denominator: 100, calculatedValue: 96, status: 'on-track', validationStatus: 'Pending Validation', reportingPeriod: 'Q4', reportingYear: 2026, createdAt: '2026-10-01', submittedBy: 'staff-1' },
      { ...base, _id: 'report-3', indicatorCode: 'OPS-001', indicatorName: 'Average processing time', unit: 'minutes', target: 5, numerator: 0, denominator: 0, calculatedValue: null, status: 'not-assessed', validationStatus: 'Draft', reportingPeriod: 'Q4', reportingYear: 2026, createdAt: '2026-10-02', calculationRule: { multiplier: 1, targetDirection: 'lower', warningTolerance: 1 } }
    ];
    await context.route('**/socket.io/**', route => route.abort());
    await context.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname; const method = route.request().method();
      if (method !== 'GET') mutations.push({ path, body: route.request().postDataJSON() });
      if (path === '/api/kpi' && method === 'GET') return route.fulfill({ json: records });
      if (path.endsWith('/validate')) { const body = route.request().postDataJSON(); const item = records.find(row => path.includes(row._id)); item.validationStatus = body.action === 'reject' ? 'Draft' : 'Pending Approval'; item.rejectionReason = body.rejectionReason; return route.fulfill({ json: item }); }
      if (path.endsWith('/approve')) { const item = records.find(row => path.includes(row._id)); item.validationStatus = 'Approved'; return route.fulfill({ json: item }); }
      if (path === '/api/kpi/submit-data') { const body = route.request().postDataJSON(); const item = records.find(row => row.indicatorCode === body.indicatorCode && row.reportingPeriod === body.reportingPeriod); Object.assign(item, body, { validationStatus: 'Pending Validation', calculatedValue: body.numerator / body.denominator, submittedBy: 'staff-1' }); return route.fulfill({ json: item }); }
      if (path.endsWith('/actions')) { const item = records.find(row => path.includes(row._id)); item.improvementActions = [...item.improvementActions, { ...route.request().postDataJSON(), _id: 'action-1' }]; return route.fulfill({ json: item }); }
      if (path === '/api/kpi' && method === 'POST') { const item = { ...route.request().postDataJSON(), _id: 'new-indicator', validationStatus: 'Draft', createdAt: '2026-10-24', improvementActions: [] }; records.push(item); return route.fulfill({ status: 201, json: item }); }
      return route.fulfill({ json: [] });
    });
    await context.addInitScript(() => { if (!localStorage.getItem('userInfo')) localStorage.setItem('userInfo', JSON.stringify({ _id: 'staff-1', employeeName: 'Quality Tester', role: 'QualityManager', token: 'test-only' })); });
    await page.goto('http://127.0.0.1:5188/dashboard/kpi');
    await page.getByRole('heading', { name: 'KPI workspace', exact: true }).waitFor();
    await page.getByLabel('Reporting year').fill('2026');
    // The application uses a custom Select; choose its accessible option.
    const quarter = page.getByRole('combobox', { name: 'Reporting quarter' });
    await quarter.click(); await page.getByRole('option', { name: 'Q4', exact: true }).click();
    await page.getByRole('heading', { name: 'Reporting checklist · Q4 2026' }).waitFor();
    assert.match(await page.locator('.ki-metrics').innerText(), /Missing or returned/);
    await page.getByRole('button', { name: 'Review (1)', exact: true }).click();
    await page.getByRole('button', { name: 'Return for correction', exact: true }).click();
    await page.getByLabel('What needs correcting?').fill('Please confirm the eligible total.');
    await page.getByRole('button', { name: 'Send feedback', exact: true }).click();
    await page.getByText('No reports match this view for the selected quarter.').waitFor();
    assert.equal(records[1].validationStatus, 'Draft');
    await page.getByRole('button', { name: 'Enter data', exact: true }).click();
    await page.locator('.qi-indicator-list button').filter({ hasText: 'Average processing time' }).click();
    await page.getByLabel('Numerator', { exact: false }).fill('12');
    await page.getByLabel('Denominator', { exact: false }).fill('3');
    assert.match(await page.locator('.qi-calculation').innerText(), /4.00 minutes/);
    await page.getByRole('button', { name: 'Resubmit for validation', exact: false }).click();
    await page.getByText('OPS-001 submitted for Q4 2026.', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Review (1)', exact: true }).click();
    await page.getByRole('button', { name: 'Validate data', exact: true }).click();
    await page.getByRole('button', { name: 'Approve report', exact: true }).click();
    await page.getByText('No reports match this view for the selected quarter.').waitFor();
    assert.equal(records[2].validationStatus, 'Approved');
    await page.getByRole('button', { name: 'Improvement actions', exact: true }).click();
    await page.getByRole('button', { name: 'Add action', exact: true }).click();
    await page.getByLabel('Indicator and reporting period').selectOption('report-3');
    await page.getByLabel('Action to take').fill('Review processing delays');
    await page.getByLabel('Responsible owner', { exact: true }).fill('Operations lead');
    await page.getByLabel('Due date', { exact: true }).fill('2026-11-01');
    await page.getByRole('button', { name: 'Save action', exact: true }).click();
    await page.getByText('Review processing delays', { exact: true }).waitFor();
    assert.equal(records[2].improvementActions.length, 1);
    await page.getByRole('button', { name: 'Add indicator', exact: true }).click();
    await page.getByLabel('Indicator name', { exact: false }).fill('Test completion measure');
    await page.getByLabel('Unique code', { exact: false }).fill('TEST-100');
    await page.getByLabel('Responsible owner / department', { exact: false }).fill('Quality team');
    await page.getByLabel('Data source', { exact: false }).fill('Audit register');
    await page.getByLabel('Purpose', { exact: false }).fill('Improve completion');
    await page.getByLabel('Numerator: what to count', { exact: false }).fill('Completed records');
    await page.getByLabel('Denominator: eligible total', { exact: false }).fill('Eligible records');
    await page.getByLabel('Agreed target', { exact: false }).fill('95');
    await page.getByRole('button', { name: 'Save indicator', exact: true }).click();
    await page.getByText('Indicator saved. You can now enter results for this quarter.', { exact: true }).waitFor();
    assert.equal(records.at(-1).calculationRule.warningTolerance, 0);
    await page.getByRole('button', { name: 'Reports & history', exact: true }).click();
    await page.locator('.ki-report').filter({ hasText: 'Assessment completion' }).locator('summary').click();
    assert.match(await page.locator('.ki-report').filter({ hasText: 'Assessment completion' }).locator('.ki-table-scroll').innerText(), /Q3 2026/);
    await page.getByRole('button', { name: 'Overview', exact: true }).click();
    await fs.mkdir('output/kpi-verification', { recursive: true });
    await page.screenshot({ path: 'output/kpi-verification/overview-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Mobile page must not overflow horizontally');
    await page.screenshot({ path: 'output/kpi-verification/overview-mobile.png', fullPage: true });
    await page.evaluate(() => localStorage.setItem('userInfo', JSON.stringify({ _id: 'staff-1', employeeName: 'Department Tester', role: 'Staff', token: 'test-only' })));
    await page.reload(); await page.getByRole('heading', { name: 'KPI workspace', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Add indicator', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: /^Review / }).count(), 0);
    await page.getByRole('button', { name: 'Improvement actions', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Add action', exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: overview, review return, manual calculation, validation/approval, action creation, guided setup, history, mobile layout and staff permissions. API responses were isolated test fixtures.');
  } finally { await browser.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
