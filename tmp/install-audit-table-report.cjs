const fs = require('node:fs');
fs.copyFileSync('tmp/clinicalAuditReport-layout.cjs', 'server/utils/clinicalAuditReport.js');
let controller = fs.readFileSync('server/controllers/clinicalAuditController.js', 'utf8');
controller = controller.replace("    const title = (audit.auditTitle || 'Clinical-Audit').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80);", '    const filename = clinicalAuditReport.filename(audit);');
controller = controller.replace("'attachment; filename=\"CMC-Audit-' + title + '-' + String(audit._id).slice(-6) + '.pdf\"'", "'attachment; filename=\"' + filename + '\"'");
fs.writeFileSync('server/controllers/clinicalAuditController.js', controller);
let page = fs.readFileSync('client/src/pages/ClinicalAuditWorkspace.jsx', 'utf8');
page = page.replace("    a.href = url; a.download = `CMC-Audit-${title}-${String(audit._id).slice(-6)}.pdf`;", `    const serverFilename = /filename="([^"]+)"/i.exec(response.headers['content-disposition'] || '')?.[1];
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    a.href = url; a.download = serverFilename?.replace(/[\\\\/]/g, '_') || \`CMC_Clinical_Audit_\${title}_\${day}.pdf\`;`);
fs.writeFileSync('client/src/pages/ClinicalAuditWorkspace.jsx', page);
for (const file of ['server/routes/clinicalAuditRoutes.js', 'server/tests/clinicalAuditPersistence.test.js', 'tmp/apply-audit-live.cjs', 'tmp/check-audit-report-proxy.cjs']) {
  let value = fs.readFileSync(file, 'utf8').replaceAll("Workflow', '5'", "Workflow', '6'").replaceAll(".workflow, '5'", ".workflow, '6'").replaceAll("=== '5'", "=== '6'").replaceAll("workflow: '5'", "workflow: '6'").replaceAll("workflow'), '5'", "workflow'), '6'").replaceAll('workflow 5', 'workflow 6');
  value = value.replace('filename="CMC-Audit-.*', 'filename="CMC_Clinical_Audit_.*');
  fs.writeFileSync(file, value);
}
console.log('Installed bordered table report and readable filename handling.');
