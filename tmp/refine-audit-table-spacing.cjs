const fs = require('node:fs');
let report = fs.readFileSync('server/utils/clinicalAuditReport.js', 'utf8');
report = report.replaceAll('* 13 + 16', '* 13 + 12').replaceAll('< 16 + captionHeight', '< 12 + captionHeight').replaceAll('- y - 16 - captionHeight', '- y - 12 - captionHeight').replace('finish(); y += 16;', 'finish(); y += 14;');
fs.writeFileSync('server/utils/clinicalAuditReport.js', report);
