const fs=require('fs');
const p='server/tests/helpers/clinicalAuditBrowser.cjs';let s=fs.readFileSync(p,'utf8');
s=s.replaceAll("name: 'Schedule audit'","name: 'Submit for approval'").replaceAll("name: 'Save schedule changes'","name: 'Submit changes for approval'").replaceAll("'Audit schedule updated'","'Schedule changes submitted for QM approval'");
s=s.replace("status: 'scheduled', findings: []","status: 'pending-approval', findings: []").replace("{ __v: (audit.__v || 0) + 1, location","{ status: 'pending-approval', __v: (audit.__v || 0) + 1, location");
s=s.replace("if (p.endsWith('/start'))", "if (p.endsWith('/schedule-approval')) { assert.equal(body().expectedVersion, audit.__v || 0); audit.status = 'scheduled'; audit.__v = (audit.__v || 0) + 1; return send(audit); }\n      if (p.endsWith('/start'))");
const marker="    await page.getByRole('button', { name: 'View audits on 2026-10-26', exact: true }).click();\n    assert.equal(await page.getByRole('heading', { name: 'October clinic safety'";
s=s.replace(marker,`    await page.getByRole('button', { name: 'Review schedule', exact: true }).waitFor();
    assert.equal(audits[0].status, 'pending-approval');
    await page.getByRole('button', { name: 'Calendar', exact: true }).click();
    assert.equal(await page.locator('.ca-calendar-day.has-visits').count(), 0, 'Pending visits stay off calendar');
    await page.getByRole('button', { name: 'Audits', exact: true }).click();
    await page.getByRole('button', { name: 'Review schedule', exact: true }).click();
    await page.getByRole('dialog', { name: 'Review audit schedule' }).waitFor();
    await page.screenshot({ path: path.join(root, 'output/clinical-audit-verification/schedule-approval-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'Approve schedule', exact: true }).click();
    await page.getByRole('button', { name: 'View audits on 2026-10-26', exact: true }).click();
    assert.equal(await page.locator('.ca-calendar-day.has-visits').count(), 2);
    assert.equal(await page.getByRole('heading', { name: 'October clinic safety'`);
s=s.replace("    assert.equal(audits[1].auditorName, '');", "    await page.getByRole('button', { name: 'Review schedule', exact: true }).click();\n    await page.getByRole('button', { name: 'Approve schedule', exact: true }).click();\n    await page.getByRole('heading', { name: 'Auditor not yet known', exact: true }).waitFor();\n    assert.equal(audits[1].auditorName, '');");
s=s.replace("assert.equal(audits[1].status, 'scheduled')","assert.equal(audits[1].status, 'pending-approval')");
fs.writeFileSync(p,s);
fs.appendFileSync('client/src/components/audit/clinicalAudit.css', `
.qc-main .ca-workspace .ca-calendar-day { min-height:116px; justify-content:flex-start; gap:6px; }
.qc-main .ca-workspace .ca-calendar-day strong { font-size:18px; font-weight:750; }
.qc-main .ca-workspace .ca-calendar-day.has-visits { background:#e0f5ef; border:2px solid #55afa0; color:#075e54; box-shadow:inset 0 4px 0 #0e8878; }
.qc-main .ca-workspace .ca-calendar-day .ca-visit-count { background:#087f70; color:#fff; border-radius:6px; padding:3px 6px; font-size:10px; font-weight:700; }
.qc-main .ca-workspace .ca-calendar-day[aria-pressed="true"] { background:#143a59; border-color:#143a59; color:#fff; }
.qc-main .ca-workspace .ca-calendar-day[aria-pressed="true"] strong { color:#fff; }
.qc-main .ca-workspace .ca-calendar-day.is-today strong { background:#d2eee9; color:#075e54; }
.ca-day-previews { display:grid; width:100%; text-align:left; gap:4px; }
.ca-day-previews > span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:10px; }
.ca-day-previews b { font-weight:750; }
.qc-main .ca-workspace .ca-calendar-day .ca-calendar-dots { display:none; }
@media(max-width:760px) {
 .qc-main .ca-workspace .ca-calendar-day { min-height:80px; padding:8px 3px; gap:8px; }
 .qc-main .ca-workspace .ca-calendar-day strong { font-size:16px; }
 .qc-main .ca-workspace .ca-calendar-day .ca-visit-count { font-size:9px; padding:3px; }
 .ca-day-previews { display:none; }
 .qc-main .ca-workspace .ca-approval-banner { flex-wrap:wrap; padding:16px; gap:12px; }
 .ca-approval-title { align-items:flex-start; flex-direction:column; }
 .ca-approval-body { padding:16px; }
 .ca-schedule-approval .ca-form-footer { flex-wrap:wrap; }
}
`);
