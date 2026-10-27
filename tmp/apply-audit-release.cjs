const fs = require('node:fs');
const cp = require('node:child_process');
const release = JSON.parse(fs.readFileSync('tmp/audit-live-release.json', 'utf8'));
const output = cp.execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', '192.168.1.160', 'node -'], { input: `const release = ${JSON.stringify(release)};\n` + fs.readFileSync('tmp/apply-audit-live.cjs', 'utf8'), encoding: 'utf8', windowsHide: true, timeout: 180000, maxBuffer: 2000000 });
process.stdout.write(output);
fs.writeFileSync('tmp/audit-live-deployed.json', output);
