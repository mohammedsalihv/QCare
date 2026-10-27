const { execFileSync } = require('node:child_process');
const command = "cd /home/salih/QCare && pwd && sed -n '1,100p' server/routes/clinicalAuditRoutes.js && sed -n '1,75p' server/controllers/clinicalAuditController.js && sed -n '1,65p' server/models/ClinicalAudit.js && node --version && pm2 ls";
process.stdout.write(execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', '192.168.1.160', command], { encoding: 'utf8', windowsHide: true, timeout: 30000 }));
