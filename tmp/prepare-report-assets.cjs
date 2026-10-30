const fs = require('node:fs');
const path = require('node:path');
const root = 'server/assets/clinical-audit';
fs.mkdirSync(root, { recursive: true });
fs.copyFileSync('C:/Users/salih/AppData/Local/Temp/codex-clipboard-db579530-31d1-4a59-aa4b-92e6ca357291.jpg', root + '/cmc-logo.jpg');
const fonts = 'C:/Users/salih/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/share/fonts';
for (const font of ['DejaVuSans.ttf', 'DejaVuSans-Bold.ttf']) fs.copyFileSync(path.join(fonts, font), path.join(root, font));
console.log('Report logo and fonts copied.');
