const fs = require('node:fs');
const change = (file, fn) => fs.writeFileSync(file, fn(fs.readFileSync(file, 'utf8')));
change('server/controllers/clinicalAuditController.js', s => s.replace("const PDFDocument = require('pdfkit');", "const clinicalAuditReport = require('../utils/clinicalAuditReport');").split('exports.generatePDFReport =')[0] + `exports.generatePDFReport = async (req, res) => {
  try {
    const audit = await ClinicalAudit.findById(req.params.id)
      .populate('auditor', 'employeeName').populate('templateId')
      .populate('location', 'name code').populate('concernedDepartments', 'name')
      .populate('concernedPersons', 'employeeName').populate('improvementActions.owner', 'employeeName')
      .populate('improvementActions.verifiedBy', 'employeeName').populate('submittedBy', 'employeeName')
      .populate('reviewedBy', 'employeeName').populate('history.actor', 'employeeName');
    if (!audit) return res.status(404).json({ message: 'Audit not found' });
    const pdf = await clinicalAuditReport(audit);
    const title = (audit.auditTitle || 'Clinical-Audit').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="CMC-Audit-' + title + '-' + String(audit._id).slice(-6) + '.pdf"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(pdf);
  } catch (error) {
    res.status(error.name === 'CastError' ? 400 : 500).json({ message: error.name === 'CastError' ? 'Invalid audit ID.' : 'Unable to generate the audit report. Please try again.' });
  }
};
`);
change('client/src/components/audit/AuditCalendarView.jsx', s => s.replace("import React,", "import AuditConcernedPeople from './AuditConcernedPeople';\nimport React,").replace('<button className="ca-button ca-secondary ca-compact" disabled={busy}', '<AuditConcernedPeople audit={event.audit} /><button className="ca-button ca-secondary ca-compact" disabled={busy}'));
fs.appendFileSync('client/src/components/audit/clinicalAudit.css', `
/* Concerned staff remain visible on desktop rows and mobile/agenda cards. */
.ca-workspace .ca-concerned-people { margin-top: 9px; min-width: 0; }
.ca-workspace .ca-concerned-people > span:first-child { display: flex; align-items: center; gap: 5px; margin-bottom: 5px; }
.ca-workspace .ca-concerned-people ul { display: flex; flex-wrap: wrap; gap: 5px; list-style: none; margin: 0; padding: 0; }
.ca-workspace .ca-concerned-people li { border: 1px solid #d5e4ed; border-radius: 6px; background: #f0f6fa; color: #254b63; font-size: 11px; font-weight: 600; line-height: 1.5; padding: 3px 7px; overflow-wrap: anywhere; }
.ca-workspace .ca-icon-button.ca-delete-audit { color: #bb253a; border-color: #f0cdd2; background: #fff6f7; }
.ca-workspace .ca-icon-button.ca-delete-audit:hover { background: #ffe5e9; border-color: #d78a97; }
`);
change('server/tests/clinicalAuditPersistence.test.js', s => s.replaceAll(".workflow, '4'", ".workflow, '5'"));
console.log('Report endpoint and audit presentation updated.');
