// UI smoke test with an in-memory API fixture; no clinical database is modified.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { spawn } = require('node:child_process');
const { chromium } = require(process.env.QCARE_TEST_PLAYWRIGHT || 'C:/Users/salih/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../../..');
const staff = { _id: '507f1f77bcf86cd799439011', employeeName: 'Clinic Auditor', role: 'QualityManager', department: 'Clinic', token: 'fixture-token' };
const reviewer = { ...staff, _id: '507f1f77bcf86cd799439012', employeeName: 'Independent Reviewer' };
const location = { _id: '507f1f77bcf86cd799439013', name: 'Main clinic', code: 'MC', isActive: true };
const departments = [{ _id: '507f1f77bcf86cd799439014', name: 'Nursing', code: 'NUR', isActive: true }, { _id: '507f1f77bcf86cd799439015', name: 'Quality', code: 'QUA', isActive: true }];
let templates = [], audits = [], actionSequence = 0;
const copy = value => JSON.parse(JSON.stringify(value));

(async () => {
  const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5197', '--strictPort'], { cwd: path.join(root, 'client'), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Vite did not start')), 20000);
      vite.stdout.on('data', data => { if (data.toString().includes('ready in')) { clearTimeout(timer); resolve(); } });
      vite.once('error', error => { clearTimeout(timer); reject(error); });
      vite.once('exit', code => { clearTimeout(timer); reject(new Error('Vite exited: ' + code)); });
    });
    browser = await chromium.launch({ headless: true, executablePath: process.env.QCARE_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    const context = await browser.newContext({ viewport: { width: 1365, height: 950 } });
    const page = await context.newPage();
    const choose = async (name, label) => {
      await page.getByRole('combobox', { name, exact: true }).click();
      await page.getByRole('option', { name: label, exact: true }).click();
    };
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await context.route('**/socket.io/**', route => route.abort());
    await context.route('**/api/**', async route => {
      const req = route.request(), url = new URL(req.url()), p = url.pathname;
      const send = json => route.fulfill({ json: copy(json) });
      const body = () => req.postDataJSON();
      if (p === '/api/users/directory') return send([staff, reviewer]);
      if (p === '/api/locations') return send([location]);
      if (p === '/api/departments') return send(departments);
      if (!p.startsWith('/api/audit')) return send([]);
      assert.equal(req.headers().authorization, 'Bearer fixture-token');
      if (p === '/api/audit/templates') {
        if (req.method() === 'POST') { const template = { ...body(), _id: 'template-1' }; templates.push(template); return send(template); }
        return send(templates);
      }
      if (p === '/api/audit/dashboard') return send({ counts: [], overdue: [], pillarStats: [] });
      if (p === '/api/audit') {
        if (req.method() === 'POST') {
          const data = body(), template = templates.find(t => t._id === data.templateId);
          const audit = { ...data, location, concernedDepartments: departments.filter(d => data.concernedDepartments.includes(d._id)), concernedPersons: [staff, reviewer].filter(p => data.concernedPersons.includes(p._id)), department: departments.filter(d => data.concernedDepartments.includes(d._id)).map(d => d.name).join(', '), scheduledDate: data.sessions[0].startAt, _id: `audit-${audits.length + 1}`, templateId: template, criteriaSnapshot: template.criteria, standard: template.standard, governancePillar: template.governancePillar, status: 'scheduled', findings: [], improvementActions: [], history: [], coverage: 0, overallScore: null };
          audits.push(audit); return send(audit);
        }
        return send(audits);
      }
      const audit = audits[0];
      if (p.endsWith('/start')) { audit.status = 'in-progress'; return send(audit); }
      if (p.endsWith('/findings')) { audit.findings = body().findings; return send(audit); }
      if (p.includes('/evidence/')) {
        const id = '11111111-1111-1111-1111-111111111111.png';
        const f = audit.findings.find(f => f.criterionId === 'C1'); f.attachments.push(id); return send({ id });
      }
      if (p.endsWith('/complete')) { audit.status = 'pending-review'; audit.submittedBy = staff._id; audit.coverage = 100; audit.overallScore = 100; return send(audit); }
      if (p.endsWith('/review')) { audit.status = body().decision === 'approve' ? 'completed' : 'in-progress'; return send(audit); }
      if (p.endsWith('/actions')) {
        audit.improvementActions.push({ ...body(), _id: `action-${++actionSequence}`, owner: staff, status: 'open' }); return send(audit);
      }
      if (p.includes('/actions/')) {
        const action = audit.improvementActions[0]; Object.assign(action, body());
        if (action.status === 'completed') action.verifiedAt = new Date().toISOString(); return send(audit);
      }
      return send(audit);
    });
    await context.addInitScript(user => { if (!localStorage.getItem('userInfo')) localStorage.setItem('userInfo', JSON.stringify(user)); }, staff);
    await page.goto('http://127.0.0.1:5197/dashboard/audit');
    await page.getByRole('heading', { name: 'Clinic audit workspace', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Templates', exact: true }).click();
    await page.getByLabel('Template name', { exact: true }).fill('Clinic safety checklist');
    await page.getByRole('combobox', { name: 'Standard', exact: true }).click();
    for (const name of ['ADHICS', 'Jawda', 'ADMCC']) await page.getByRole('option', { name, exact: true }).waitFor();
    await page.getByRole('option', { name: 'ADHICS', exact: true }).click();
    await page.getByLabel('Criterion 1', { exact: true }).fill('Consent is documented');
    await page.getByLabel('Weight', { exact: true }).fill('3');
    await page.getByRole('button', { name: '+ Add criterion', exact: true }).click();
    await page.getByLabel('Criterion 2', { exact: true }).fill('Procedure safety review');
    await page.getByRole('button', { name: 'Save template', exact: true }).click();
    await page.getByRole('heading', { name: 'Clinic safety checklist', exact: true }).waitFor();
    await page.getByRole('button', { name: '+ Schedule new audit', exact: true }).click();
    await page.getByLabel('Audit title', { exact: true }).fill('October clinic safety');
    await page.getByRole('combobox', { name: 'Checklist template', exact: true }).click();
    await page.getByRole('option', { name: 'Clinic safety checklist · ADHICS', exact: true }).waitFor();
    await fs.mkdir(path.join(root, 'output/clinical-audit-verification'), { recursive: true });
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/custom-dropdown.png'), fullPage: true });
    await page.getByRole('option', { name: 'Clinic safety checklist · ADHICS', exact: true }).click();
    const dialog = page.getByRole('dialog');
    assert.equal(await dialog.evaluate(el => getComputedStyle(el).resize), 'both');
    const originalWidth = (await dialog.boundingBox()).width;
    await page.getByRole('button', { name: 'Expand audit form', exact: true }).click();
    assert((await dialog.boundingBox()).width > originalWidth);
    await page.getByRole('button', { name: 'Restore form size', exact: true }).click();
    assert.equal(await page.getByRole('combobox', { name: 'Location', exact: true }).getAttribute('aria-required'), 'true');
    await page.getByRole('button', { name: 'Schedule audit', exact: true }).click();
    await page.getByText('Please choose an option.', { exact: true }).waitFor();
    await choose('Location', 'Main clinic · MC');
    await page.getByRole('combobox', { name: 'Concerned departments', exact: true }).click();
    await page.getByRole('option', { name: 'Nursing', exact: true }).click();
    await page.getByRole('option', { name: 'Quality', exact: true }).click();
    await page.getByRole('combobox', { name: 'Concerned departments', exact: true }).click();
    await page.getByRole('combobox', { name: 'Concerned persons', exact: true }).click();
    await page.getByRole('option', { name: staff.employeeName, exact: true }).click();
    await page.getByRole('option', { name: reviewer.employeeName, exact: true }).click();
    await page.getByRole('combobox', { name: 'Concerned persons', exact: true }).click();
    assert.equal(await page.getByRole('combobox', { name: 'Auditor', exact: true }).count(), 0);
    assert.equal(await page.getByLabel('Auditor name (optional)', { exact: true }).getAttribute('required'), null);
    await page.getByLabel('Auditor name (optional)', { exact: true }).fill('Dr External Reviewer');
    await page.getByRole('button', { name: 'Date range', exact: true }).click();
    await page.getByRole('button', { name: 'Select audit date 2026-10-26', exact: true }).click();
    await page.getByRole('button', { name: 'Select audit date 2026-10-27', exact: true }).click();
    await page.getByRole('button', { name: 'Customize by date', exact: true }).click();
    await page.getByLabel('2026-10-27 start 1', { exact: true }).fill('13:00');
    await page.getByLabel('2026-10-27 end 1', { exact: true }).fill('14:00');
    await page.getByRole('button', { name: '+ Another time window', exact: true }).first().click();
    await page.getByLabel('2026-10-26 start 2', { exact: true }).fill('09:30');
    await page.getByLabel('2026-10-26 end 2', { exact: true }).fill('10:30');
    await page.getByRole('button', { name: 'Schedule audit', exact: true }).click();
    await page.getByText('Time windows cannot overlap on the same date.', { exact: true }).waitFor();
    await page.getByLabel('2026-10-26 start 2', { exact: true }).fill('15:00');
    await page.getByLabel('2026-10-26 end 2', { exact: true }).fill('16:00');
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/planning-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'Mobile schedule must not overflow');
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/schedule-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1365, height: 950 });
    await page.getByRole('button', { name: 'Schedule audit', exact: true }).click();
    await page.getByRole('button', { name: 'View audits on 2026-10-26', exact: true }).click();
    assert.equal(await page.getByRole('heading', { name: 'October clinic safety', exact: true }).count(), 2);
    assert.equal(audits[0].sessions.length, 3); assert.equal(audits[0].auditor, undefined); assert.equal(audits[0].auditorName, 'Dr External Reviewer');
    assert.equal(audits[0].location._id, location._id); assert.equal(audits[0].concernedDepartments.length, 2); assert.equal(audits[0].concernedPersons.length, 2);
    await page.getByText('09:00–10:00', { exact: true }).waitFor();
    await page.getByText('15:00–16:00', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/calendar-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'View audits on 2026-10-27', exact: true }).click();
    await page.getByText('13:00–14:00', { exact: true }).waitFor();
    await page.reload();
    await page.getByRole('button', { name: 'Audits', exact: true }).click();
    await page.getByText('Auditor: Dr External Reviewer', { exact: true }).waitFor();
    await page.getByText('Departments: Nursing, Quality', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Start / continue', exact: true }).click();
    await choose('Compliance status', 'compliant');
    await page.getByLabel('Evidence and findings', { exact: true }).fill('Reviewed consent forms.');
    await page.getByLabel(/Attach evidence/).setInputFiles({ name: 'evidence.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71,13,10,26,10]) });
    await page.getByRole('button', { name: 'Download evidence 1', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await choose('Compliance status', 'not applicable');
    await page.getByLabel('Reason for exclusion', { exact: true }).fill('Procedures are not provided in this clinic.');
    await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
    await page.getByRole('heading', { name: 'Independent review', exact: true }).waitFor();
    assert(await page.getByRole('button', { name: 'Approve audit', exact: true }).isDisabled());
    await page.getByLabel('Action required', { exact: true }).fill('Refresh consent training');
    await choose('Owner', staff.employeeName);
    await page.getByLabel('Due date', { exact: true }).fill('2026-11-15');
    await page.getByRole('button', { name: 'Assign action', exact: true }).click();
    await page.getByText('Corrective action assigned', { exact: true }).waitFor();
    await page.evaluate(user => localStorage.setItem('userInfo', JSON.stringify(user)), reviewer);
    await page.reload();
    await page.getByRole('button', { name: 'Audits', exact: true }).click();
    await page.getByRole('button', { name: 'Review audit', exact: true }).click();
    await page.getByRole('button', { name: 'Approve audit', exact: true }).click();
    await page.getByText('Audit approved', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Findings & actions', exact: true }).click();
    await page.getByRole('button', { name: 'Start action', exact: true }).click();
    await page.getByLabel('Completion evidence', { exact: true }).fill('Attendance and updated consent procedure recorded.');
    await page.getByRole('button', { name: 'Request verification', exact: true }).click();
    await page.getByRole('button', { name: 'Verify closure', exact: true }).click();
    await page.getByText(/^Verified \d/).waitFor();
    assert.equal(audits[0].status, 'completed'); assert.equal(audits[0].improvementActions[0].status, 'completed');
    await fs.mkdir(path.join(root, 'output/clinical-audit-verification'), { recursive: true });
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/actions-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/actions-mobile.png'), fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'Mobile page must not overflow');
    await page.getByRole('button', { name: 'Calendar', exact: true }).click();
    await page.getByRole('button', { name: 'View audits on 2026-10-26', exact: true }).click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'Mobile calendar must not overflow');
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/calendar-mobile.png'), fullPage: true });
    await page.getByRole('button', { name: '+ Schedule on this date', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Select audit date 2026-10-26', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByLabel('Audit title', { exact: true }).fill('Auditor not yet known');
    await choose('Checklist template', 'Clinic safety checklist · ADHICS');
    await choose('Location', 'Main clinic · MC');
    await page.getByRole('button', { name: 'Schedule audit', exact: true }).click();
    await page.getByRole('heading', { name: 'Auditor not yet known', exact: true }).waitFor();
    assert.equal(audits[1].auditorName, ''); assert.equal(audits[1].auditor, undefined);
    assert.equal(audits[1].concernedDepartments.length, 0); assert.equal(audits[1].concernedPersons.length, 0);
    assert.deepEqual(errors, []);
    console.log('Browser smoke passed: resizable planning form, required collection-backed location, optional multiple departments/persons, ADHICS/Jawda/ADMCC standards, date ranges and custom time windows, overlap rejection, calendar, persistence after reload, evidence, approval, actions, and mobile layouts. API responses used in-memory fixtures.');
  } finally { if (browser) await browser.close(); vite.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
