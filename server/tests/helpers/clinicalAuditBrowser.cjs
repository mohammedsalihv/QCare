// UI smoke test with an in-memory API fixture; no clinical database is modified.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { spawn } = require('node:child_process');
const { chromium } = require(process.env.QCARE_TEST_PLAYWRIGHT || 'C:/Users/salih/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../../..');
const staff = { _id: '507f1f77bcf86cd799439011', employeeName: 'Clinic Auditor', role: 'SuperAdmin', department: 'Clinic', token: 'fixture-token' };
const reviewer = { ...staff, _id: '507f1f77bcf86cd799439012', employeeName: 'Independent Reviewer' };
const location = { _id: '507f1f77bcf86cd799439013', name: 'Main clinic', code: 'MC', isActive: true };
const departments = [{ _id: '507f1f77bcf86cd799439014', name: 'Nursing', code: 'NUR', isActive: true }, { _id: '507f1f77bcf86cd799439015', name: 'Quality', code: 'QUA', isActive: true }];
let failAuditEdit = false, serverRole = 'SuperAdmin';
let templates = [], audits = [], actionSequence = 0, failTemplateDelete = false, failAuditDelete = false;
const copy = value => JSON.parse(JSON.stringify(value));

(async () => {
  const reportFixture = await require('../../utils/clinicalAuditReport')({ _id: 'browser-fixture', auditTitle: 'Browser report verification', status: 'scheduled', scheduledDate: '2026-10-28T05:00:00Z' });
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
    const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error('Browser error:', error.message); });
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
      if (p === '/api/audit/permissions') return send({ role: serverRole, canManage: ['Quality', 'SuperAdmin'].includes(serverRole) });
      if (p === '/api/audit/templates') {
        if (req.method() === 'POST') { const template = { ...body(), _id: 'template-1', __v: 0, isActive: true }; templates.push(template); return send(template); }
        return send(templates.filter(t => t.isActive));
      }
      if (p.startsWith('/api/audit/templates/')) {
        const template = templates.find(t => t._id === p.split('/').at(-1));
        if (req.method() === 'PUT') { Object.assign(template, body(), { __v: template.__v + 1 }); return send(template); }
        if (req.method() === 'DELETE') {
          if (failTemplateDelete) return route.fulfill({ status: 503, json: { message: 'Test template service temporarily unavailable' } });
          template.isActive = false; return send({ message: 'Template deleted', templateId: template._id });
        }
      }
      if (p === '/api/audit/dashboard') {
        const completed = audits.filter(a => a.status === 'completed' && a.overallScore != null);
        return send({ counts: [], overdue: [], pillarStats: completed.length ? [{ _id: 'clinical-audit', avgScore: completed.reduce((total, a) => total + a.overallScore, 0) / completed.length }] : [] });
      }
      if (p === '/api/audit') {
        if (req.method() === 'POST') {
          const data = body(), template = templates.find(t => t._id === data.templateId);
          const audit = { ...data, location, concernedDepartments: departments.filter(d => data.concernedDepartments.includes(d._id)), concernedPersons: [staff, reviewer].filter(p => data.concernedPersons.includes(p._id)), department: departments.filter(d => data.concernedDepartments.includes(d._id)).map(d => d.name).join(', '), scheduledDate: data.sessions[0].startAt, _id: `audit-${audits.length + 1}`, templateId: template, criteriaSnapshot: template.criteria, standard: template.standard, governancePillar: template.governancePillar, status: serverRole === 'QualityManager' ? 'scheduled' : 'pending-approval', findings: [], improvementActions: [], history: [], coverage: 0, overallScore: null };
          audits.push(audit); return send(audit);
        }
        return send(audits);
      }
      if (p.endsWith('/report/pdf')) return route.fulfill({ contentType: 'application/pdf', headers: { 'Content-Disposition': 'attachment; filename="CMC_Clinical_Audit_Browser_Report_Test_Clinic_2026-10-28.pdf"' }, body: reportFixture });
      if (req.method() === 'DELETE' && /^\/api\/audit\/[^/]+$/.test(p)) {
        if (failAuditDelete) return route.fulfill({ status: 409, json: { message: 'This audit changed. Refresh the list.' } });
        audits = audits.filter(a => a._id !== p.split('/').at(-1)); return send({ message: 'Audit deleted' });
      }
      const audit = audits.find(a => a._id === p.split('/')[3]) || audits[0];
      if (req.method() === 'PUT' && /^\/api\/audit\/[^/]+$/.test(p)) {
        if (failAuditEdit) return route.fulfill({ status: 409, json: { message: 'Schedule changed elsewhere. Reopen it.' } });
        const data = body();
        assert.equal(data.expectedVersion, audit.__v || 0);
        Object.assign(audit, data, { status: serverRole === 'QualityManager' ? 'scheduled' : 'pending-approval', __v: (audit.__v || 0) + 1, location, templateId: templates.find(t => t._id === data.templateId), concernedDepartments: departments.filter(d => data.concernedDepartments.includes(d._id)), concernedPersons: [staff, reviewer].filter(p => data.concernedPersons.includes(p._id)), scheduledDate: data.sessions[0].startAt, scheduledUntil: data.sessions.at(-1).endAt });
        return send(audit);
      }
      if (p.endsWith('/schedule-approval')) { assert.equal(body().expectedVersion, audit.__v || 0); audit.status = body().decision === 'reject' ? 'schedule-rejected' : 'scheduled'; if (body().decision === 'reject') audit.scheduleRejectionReason = body().comment; audit.__v = (audit.__v || 0) + 1; return send(audit); }
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
    await context.addInitScript(user => { if (!localStorage.getItem('userInfo')) localStorage.setItem('userInfo', JSON.stringify(user)); }, { ...staff, role: 'Staff' });
    await page.goto('http://127.0.0.1:5197/dashboard/audit');
    await page.getByRole('heading', { name: 'Clinical audit', exact: true }).waitFor({ timeout: 60000 });
    await page.getByRole('button', { name: 'Templates', exact: true }).click();
    await page.getByRole('button', { name: 'New template', exact: true }).click();
    await page.getByLabel('Template name', { exact: true }).fill('Clinic safety checklist');
    await page.getByRole('combobox', { name: 'Standard', exact: true }).click();
    for (const name of ['ADHICS', 'Jawda', 'ADMCC']) await page.getByRole('option', { name, exact: true }).waitFor();
    await page.getByRole('option', { name: 'ADHICS', exact: true }).click();
    await page.getByLabel('Criterion 1', { exact: true }).fill('Consent is documented');
    await page.getByLabel('Weight', { exact: true }).fill('3');
    await page.getByRole('button', { name: 'Add criterion', exact: true }).click();
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
    await page.getByRole('button', { name: 'Submit for approval', exact: true }).click();
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
    await page.getByRole('button', { name: 'Submit for approval', exact: true }).click();
    await page.getByText('Time windows cannot overlap on the same date.', { exact: true }).waitFor();
    await page.getByLabel('2026-10-26 start 2', { exact: true }).fill('15:00');
    await page.getByLabel('2026-10-26 end 2', { exact: true }).fill('16:00');
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/planning-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'Mobile schedule must not overflow');
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/schedule-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1365, height: 950 });
    await page.getByRole('button', { name: 'Submit for approval', exact: true }).click();
    await page.getByRole('button', { name: 'Review schedule', exact: true }).waitFor();
    assert.equal(audits[0].status, 'pending-approval');
    await page.getByRole('button', { name: 'Overview', exact: true }).click();
    assert.equal(await page.getByRole('heading', { name: 'All caught up', exact: true }).count(), 0, 'Pending approval needs attention');
    assert.equal(await page.locator('.ca-attention-list button').count(), 1);
    audits[0].status = 'schedule-rejected'; await page.reload();
    assert.equal(await page.locator('.ca-upcoming-list button').count(), 0, 'Rejected schedules are not upcoming');
    await page.locator('.ca-attention-list button').waitFor();
    audits[0].status = 'pending-approval'; await page.reload();
    await page.getByRole('button', { name: 'Audits', exact: true }).click();

    await page.getByRole('button', { name: 'Calendar', exact: true }).click();
    assert.equal(await page.locator('.ca-calendar-day.has-visits').count(), 0, 'Pending visits stay off calendar');
    await page.getByRole('button', { name: 'Audits', exact: true }).click();
    await page.getByRole('button', { name: 'Review schedule', exact: true }).click();
    await page.getByRole('dialog', { name: 'Review audit schedule' }).waitFor();
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/schedule-approval-desktop.png'), fullPage: true });
    await page.getByRole('button', {name:'Reject schedule',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'A rejection reason is required.'}).waitFor();
    await page.getByRole('button', { name: 'Approve schedule', exact: true }).click();
    await page.getByRole('button', { name: 'View audits on 2026-10-26', exact: true }).click();
    assert.equal(await page.locator('.ca-calendar-day.has-visits').count(), 2);
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
    await page.getByRole('button', { name: 'Submit for approval', exact: true }).click();
    await page.getByRole('heading', { name: 'Auditor not yet known', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Review schedule', exact: true }).click();
    await page.getByRole('button', { name: 'Approve schedule', exact: true }).click();
    await page.getByRole('dialog', { name: 'Review audit schedule' }).waitFor({ state: 'hidden' });
    await page.getByRole('heading', { name: 'Auditor not yet known', exact: true }).waitFor();
    assert.equal(audits[1].auditorName, ''); assert.equal(audits[1].auditor, undefined);
    assert.equal(audits[1].concernedDepartments.length, 0); assert.equal(audits[1].concernedPersons.length, 0);
    const originalCriterion = audits[0].criteriaSnapshot[0].text;
    await page.setViewportSize({ width: 1365, height: 950 });
    await page.getByRole('button', { name: 'Templates', exact: true }).click();
    await page.getByRole('button', { name: 'Edit template Clinic safety checklist', exact: true }).click();
    assert.equal(await page.getByLabel('Template name', { exact: true }).inputValue(), 'Clinic safety checklist');
    await page.getByLabel('Template name', { exact: true }).fill('Updated clinic checklist');
    await page.getByLabel('Criterion 1', { exact: true }).fill('Revised criterion for future audits');
    await choose('Standard', 'Jawda');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await page.getByRole('heading', { name: 'Updated clinic checklist', exact: true }).waitFor();
    assert.equal(audits[0].criteriaSnapshot[0].text, originalCriterion);
    await page.reload();
    await page.getByRole('button', { name: 'Templates', exact: true }).click();
    await page.getByRole('heading', { name: 'Updated clinic checklist', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Edit template Updated clinic checklist', exact: true }).click();
    await page.getByLabel('Template name', { exact: true }).fill('Discard these edits');
    await page.getByRole('button', { name: 'Cancel editing', exact: true }).click();
    assert.equal(templates[0].templateName, 'Updated clinic checklist');
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/templates-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'Mobile template library must not overflow');
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/templates-mobile.png'), fullPage: true });
    await page.getByRole('button', { name: 'Delete template Updated clinic checklist', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('heading', { name: 'Updated clinic checklist', exact: true }).waitFor();
    failTemplateDelete = true;
    await page.getByRole('button', { name: 'Delete template Updated clinic checklist', exact: true }).click();
    await page.getByRole('button', { name: 'Delete template', exact: true }).click();
    await page.getByText('Test template service temporarily unavailable', { exact: true }).waitFor();
    assert.equal(templates[0].isActive, true);
    failTemplateDelete = false;
    await page.getByRole('button', { name: 'Delete template Updated clinic checklist', exact: true }).click();
    await page.getByRole('button', { name: 'Delete template', exact: true }).click();
    await page.getByText('No active audit templates.', { exact: true }).waitFor();
    await page.reload(); await page.getByRole('button', { name: 'Templates', exact: true }).click();
    await page.getByText('No active audit templates.', { exact: true }).waitFor();
    assert.equal(audits.length, 2); assert.equal(audits[0].criteriaSnapshot[0].text, originalCriterion);
    await page.getByRole('button', { name: 'Audits', exact: true }).click();
    const completedRow = page.locator('.ca-audit-table tbody tr').filter({ hasText: 'October clinic safety' });
    assert.equal(await completedRow.locator('.ca-concerned-people li').count(), 2);
    assert.equal(await completedRow.getByRole('button', { name: /^Delete audit/ }).count(), 1);
    const pdfEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF for October clinic safety', exact: true }).click();
    const download = await pdfEvent;
    assert.equal(download.suggestedFilename(), 'CMC_Clinical_Audit_Browser_Report_Test_Clinic_2026-10-28.pdf');
    const downloaded = await fs.readFile(await download.path()); assert.equal(downloaded.subarray(0, 5).toString(), '%PDF-');
    assert.equal(await completedRow.getByRole('button', { name: /^Edit scheduled audit/ }).count(), 0);
    const editButton = page.getByRole('button', { name: 'Edit scheduled audit Auditor not yet known', exact: true });
    await editButton.click();
    await page.getByRole('heading', { name: 'Edit scheduled audit', exact: true }).waitFor();
    assert.equal(await page.getByLabel('Audit title', { exact: true }).inputValue(), 'Auditor not yet known');
    assert.equal(await page.getByLabel('2026-10-26 start 1', { exact: true }).inputValue(), '09:00');
    await page.getByLabel('Audit title', { exact: true }).fill('Discard schedule change');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(audits[1].auditTitle, 'Auditor not yet known');
    await editButton.click();
    await page.getByLabel('Auditor name (optional)', { exact: true }).fill('External schedule reviewer');
    await page.getByLabel('2026-10-26 start 1', { exact: true }).fill('13:00');
    await page.getByLabel('2026-10-26 end 1', { exact: true }).fill('14:30');
    await page.getByRole('button', { name: 'Select audit date 2026-10-27', exact: true }).click();
    await page.getByLabel('2026-10-27 start 1', { exact: true }).fill('15:00');
    await page.getByLabel('2026-10-27 end 1', { exact: true }).fill('16:00');
    failAuditEdit = true;
    await page.getByRole('button', { name: 'Submit changes for approval', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Schedule changed elsewhere' }).waitFor();
    assert.equal(audits[1].sessions.length, 1);
    failAuditEdit = false;
    await page.getByRole('button', { name: 'Submit changes for approval', exact: true }).click();
    await page.getByText('Audit submitted for QM approval', { exact: true }).waitFor();
    assert.equal(audits[1].sessions.length, 2); assert.equal(audits[1].status, 'pending-approval');
    assert.equal(audits[1].sessions[0].startAt, '2026-10-26T13:00:00+04:00');
    await page.reload(); await page.getByRole('button', { name: 'Audits', exact: true }).click();
    await editButton.click();
    assert.equal(await page.getByLabel('2026-10-27 start 1', { exact: true }).inputValue(), '15:00');
    assert.equal(await page.getByLabel('Auditor name (optional)', { exact: true }).inputValue(), 'External schedule reviewer');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    const deleteButton = page.getByRole('button', { name: 'Delete audit Auditor not yet known', exact: true });
    await deleteButton.click(); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(audits.length, 2);
    failAuditDelete = true; await deleteButton.click(); await page.getByRole('button', { name: 'Delete audit', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'This audit changed.' }).waitFor(); assert.equal(audits.length, 2);
    failAuditDelete = false;
    serverRole = 'Staff';
    await page.evaluate(() => { const user = JSON.parse(localStorage.getItem('userInfo')); user.role = 'Staff'; localStorage.setItem('userInfo', JSON.stringify(user)); });
    await page.reload(); await page.getByRole('button', { name: 'Audits', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: /^Delete audit/ }).count(), 0);
    assert.equal(await page.getByRole('button', { name: /^Edit scheduled audit/ }).count(), 0);
    serverRole = 'SuperAdmin';
    await page.evaluate(() => { const user = JSON.parse(localStorage.getItem('userInfo')); user.role = 'SuperAdmin'; localStorage.setItem('userInfo', JSON.stringify(user)); });
    await page.reload(); await page.getByRole('button', { name: 'Audits', exact: true }).click();
    await deleteButton.click(); await page.getByRole('button', { name: 'Delete audit', exact: true }).click();
    await page.getByText('Audit deleted', { exact: true }).waitFor(); assert.equal(audits.length, 1);
    await page.reload(); await page.getByRole('button', { name: 'Audits', exact: true }).click();
    assert.equal(await page.locator('.ca-audit-table tbody tr').count(), 1);
    // Rich, entirely synthetic fixtures for visual QA of every redesigned screen.
    const exampleCriteria = [
      { criterionId: 'C1', text: 'Review documentation against the approved clinic checklist.', weight: 1 },
      { criterionId: 'C2', text: 'Verify supporting evidence and staff awareness.', weight: 1 },
      { criterionId: 'C3', text: 'Confirm identified improvements have an assigned owner.', weight: 1 }
    ];
    templates = [
      ['Jawda clinical quality', 'Jawda', 'clinical-audit'], ['ADHICS information security', 'ADHICS', 'information-management'],
      ['ADMCC readiness checklist', 'ADMCC', 'clinical-risk'], ['Clinic safety essentials', 'internal', 'clinical-risk']
    ].map(([templateName, standard, governancePillar], index) => ({ _id: `visual-template-${index}`, templateName, standard, governancePillar, criteria: copy(exampleCriteria), isActive: true, __v: 0 }));
    const fixtureDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const baseTime = new Date(`${fixtureDate}T09:00:00+04:00`).getTime(), day = 86400000;
    audits = [
      ['Clinical documentation review', 'scheduled', 3, 0, null], ['Information security readiness', 'in-progress', 1, 67, 82],
      ['Medication safety assessment', 'pending-review', -1, 100, 91], ['Patient experience audit', 'completed', -3, 100, 94],
      ['Infection prevention follow-up', 'scheduled', -5, 25, 60]
    ].map(([auditTitle, status, offset, coverage, score], index) => {
      const start = new Date(baseTime + day * offset).toISOString(), end = new Date(baseTime + day * offset + 3600000).toISOString();
      return { _id: `visual-audit-${index}`, auditTitle, status, scheduledDate: start, scheduledUntil: end, sessions: [{ startAt: start, endAt: end }], location, concernedDepartments: departments, concernedPersons: [staff, reviewer], department: 'Nursing, Quality', auditorName: 'External quality reviewer', templateId: templates[index % templates.length], standard: templates[index % templates.length].standard, governancePillar: 'clinical-audit', criteriaSnapshot: copy(exampleCriteria), findings: [], history: [], coverage, overallScore: score, improvementActions: [] };
    });
    audits[0].improvementActions = [
      { _id: 'visual-action-1', actionText: 'Update the clinical documentation checklist', owner: staff, dueDate: new Date(baseTime + 3 * day).toISOString(), status: 'open', priority: 'high' },
      { _id: 'visual-action-2', actionText: 'Complete staff evidence review', owner: reviewer, dueDate: new Date(baseTime + 4 * day).toISOString(), status: 'in-progress', priority: 'medium' },
      { _id: 'visual-action-3', actionText: 'Review medication storage records', owner: staff, dueDate: new Date(baseTime + day).toISOString(), status: 'pending-verification', priority: 'high', completionEvidence: 'Review records attached.' },
      { _id: 'visual-action-4', actionText: 'Verify updated patient feedback process', owner: staff, dueDate: new Date(baseTime - day).toISOString(), status: 'completed', priority: 'low', verifiedAt: new Date(baseTime).toISOString() }
    ];
    const capture = async name => {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: path.join(root, `output/clinical-audit-verification/redesign-${name}.png`), fullPage: true });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${name}: page must not overflow horizontally`);
    };
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.reload();
    await page.getByRole('heading', { name: 'Upcoming & ongoing audits', exact: true }).waitFor();
    assert(await page.getByRole('heading', { name: 'Clinical audit', exact: true }).evaluate(element => Number(getComputedStyle(element).fontWeight) >= 700));
    await capture('overview-desktop');
    await page.getByRole('button', { name: 'Audits', exact: true }).click();
    assert.equal(await page.locator('.ca-audit-table tbody tr').count(), 5);
    assert.equal(await page.getByRole('button', { name: /^Delete audit / }).count(), 5, 'Managers see deletion for every status, including started audits with findings/actions');
    const colours = await page.locator('.ca-audit-table .ca-status').evaluateAll(elements => elements.map(element => ({ status: element.dataset.status, colour: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor })));
    assert.equal(new Set(colours.map(c => c.background)).size, 5, 'Each audit status must have a distinct colour');
    await capture('register-desktop');
    await choose('Filter audit status', 'Completed');
    assert.equal(await page.locator('.ca-audit-table tbody tr').count(), 1);
    await choose('Filter audit status', 'All statuses');
    await page.getByRole('textbox', { name: 'Search audits', exact: true }).fill('security');
    assert.equal(await page.locator('.ca-audit-table tbody tr').count(), 1);
    await page.getByRole('button', { name: 'Clear audit search', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 }); await capture('register-mobile');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Templates', exact: true }).click();
    await capture('library-desktop');
    await page.getByRole('button', { name: 'Edit template Jawda clinical quality', exact: true }).click();
    await page.getByRole('heading', { name: 'Edit audit template', exact: true }).waitFor();
    await capture('editor-desktop'); await page.setViewportSize({ width: 390, height: 844 }); await capture('editor-mobile');
    await page.getByRole('button', { name: 'Cancel editing', exact: true }).click();
    await capture('library-mobile');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Calendar', exact: true }).click(); await capture('calendar-desktop');
    await page.setViewportSize({ width: 390, height: 844 }); await capture('calendar-mobile');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Findings & actions', exact: true }).click(); await capture('actions-desktop');
    await page.setViewportSize({ width: 390, height: 844 }); await capture('actions-mobile');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: '+ Schedule new audit', exact: true }).click();
    await page.getByLabel('Audit title', { exact: true }).fill('Clinical documentation quality review');
    await choose('Checklist template', 'Jawda clinical quality · Jawda'); await choose('Location', 'Main clinic · MC');
    const currentDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    await page.getByRole('button', { name: `Select audit date ${currentDate}`, exact: true }).click();
    await page.evaluate(() => { document.querySelector('.audit-planning-body').scrollTop = 0; });
    await capture('planner-desktop'); await page.setViewportSize({ width: 390, height: 844 }); await capture('planner-mobile');
    await page.getByRole('button', { name: 'Close scheduling', exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Audits', exact: true }).click();
    await page.getByRole('button', { name: 'Delete audit Information security readiness', exact: true }).click();
    await page.getByRole('button', { name: 'Delete audit', exact: true }).click();
    await page.getByText('Audit deleted', { exact: true }).waitFor();
    assert.equal(audits.some(a => a.auditTitle === 'Information security readiness'), false);
    await page.reload(); await page.getByRole('button', { name: 'Audits', exact: true }).click();
    assert.equal(await page.locator('.ca-audit-table tbody tr').count(), 4);
    serverRole = 'QualityManager';
    await page.reload(); await page.getByRole('button', { name: '+ Schedule new audit', exact: true }).click();
    await page.getByText('Choose the location, people and dates. Your schedule will publish immediately as Quality Manager.', { exact: true }).waitFor();
    await page.getByLabel('Audit title', { exact: true }).fill('Direct manager publication');
    await choose('Checklist template', 'Jawda clinical quality · Jawda'); await choose('Location', 'Main clinic · MC');
    await page.getByRole('button', { name: 'Select audit date ' + fixtureDate, exact: true }).click();
    await page.getByRole('button', { name: 'Schedule audit', exact: true }).click();
    await page.getByText('Audit scheduled and published to the calendar', { exact: true }).waitFor();
    assert.equal(audits.at(-1).status, 'scheduled'); await page.locator('.ca-calendar-readable').waitFor();
    serverRole = 'QualityOfficer'; await page.reload();
    await page.getByRole('button', { name: '+ Schedule new audit', exact: true }).click();
    await page.getByRole('button', { name: 'Submit for approval', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Close scheduling', exact: true }).click();
    await page.getByRole('button', { name: 'Audits', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: /^Delete audit / }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('Browser smoke passed: template edit/save/reload, cancel editing, delete confirmation/cancel, failed deletion retention, successful deletion/reload, preserved audit checklists, audit planner, evidence, approval, actions, and mobile layouts. API responses used in-memory fixtures.');
  } finally { if (browser) await browser.close(); vite.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
