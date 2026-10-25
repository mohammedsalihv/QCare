const fs = require('node:fs');
const cp = require('node:child_process');
const path = require('node:path');
const mode = process.argv[2] || 'prepare';
const root = path.resolve(__dirname, '..');
let source;
if (mode === 'prepare') {
  const payload = JSON.parse(fs.readFileSync(path.join(__dirname, 'dashboard-release-payload.json'), 'utf8'));
  source = 'const payload = ' + JSON.stringify(payload) + ';\n' + fs.readFileSync(path.join(__dirname, 'prepare-dashboard-live.cjs'), 'utf8');
} else {
  const release = JSON.parse(fs.readFileSync(path.join(__dirname, 'dashboard-live-release.json'), 'utf8'));
  source = 'const release = ' + JSON.stringify(release) + ';\n' + fs.readFileSync(path.join(__dirname, 'apply-dashboard-live.cjs'), 'utf8');
}
const output = cp.execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', '192.168.1.160', 'node', '-'], { input: source, encoding: 'utf8', windowsHide: true, maxBuffer: 3000000, timeout: 120000 });
console.log(output);
const prepared = output.split('\n').find(line => line.startsWith('DASHBOARD_PREPARED '));
if (prepared) fs.writeFileSync(path.join(__dirname, 'dashboard-live-release.json'), prepared.slice('DASHBOARD_PREPARED '.length));
