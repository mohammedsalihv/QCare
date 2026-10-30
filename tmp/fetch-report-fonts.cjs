const fs = require('node:fs');
const cp = require('node:child_process');
const script = `const fs = require('fs'); const dir = '/usr/share/fonts/truetype/dejavu/'; const result = {}; for (const name of ['DejaVuSans.ttf', 'DejaVuSans-Bold.ttf']) result[name] = fs.readFileSync(dir + name).toString('base64'); result['FONT-LICENSE.txt'] = fs.readFileSync('/usr/share/doc/fonts-dejavu-core/copyright').toString('base64'); console.log(JSON.stringify(result));`;
const output = cp.execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', '192.168.1.160', 'node -'], { input: script, encoding: 'utf8', windowsHide: true, maxBuffer: 5000000, timeout: 20000 });
for (const [name, data] of Object.entries(JSON.parse(output))) fs.writeFileSync('server/assets/clinical-audit/' + name, Buffer.from(data, 'base64'));
console.log('Bundled DejaVu regular/bold fonts with their redistribution license.');
