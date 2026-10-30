const fs = require('node:fs');
const update = (p, fn) => fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8')));
const added = ['server/utils/clinicalAuditReport.js', 'server/assets/clinical-audit/cmc-logo.jpg', 'server/assets/clinical-audit/DejaVuSans.ttf', 'server/assets/clinical-audit/DejaVuSans-Bold.ttf', 'server/assets/clinical-audit/FONT-LICENSE.txt'];
const suffix = added.map(p => ', ' + JSON.stringify(p)).join('');
update('tmp/audit-live-release.cjs', s => s.replace("'server/utils/clinicalAuditSchedule.js'];", "'server/utils/clinicalAuditSchedule.js'" + suffix + '];').replace("files.map(f => [f, fs.readFileSync(f, 'utf8')])", "files.map(f => [f, fs.readFileSync(f).toString('base64')])"));
update('tmp/prepare-audit-live.cjs', s => s.replace("'utils', 'tests'", "'utils', 'tests', 'assets', 'assets/clinical-audit'").replace('fs.writeFileSync(target, contents);', "fs.writeFileSync(target, Object.hasOwn(payload.files, relative) ? Buffer.from(contents, 'base64') : contents);"));
update('tmp/apply-audit-live.cjs', s => s.replace("'server/utils/clinicalAuditSchedule.js']);", "'server/utils/clinicalAuditSchedule.js'" + suffix + ']);').replace("  cp.execFileSync(process.execPath, ['--check', path.join(stage, relative)]", "  if (relative.endsWith('.js')) cp.execFileSync(process.execPath, ['--check', path.join(stage, relative)]").replace("=== '4'", "=== '5'").replace("workflow: '4'", "workflow: '5'"));
console.log('Release manifest includes report code, logo, fonts, and license.');
