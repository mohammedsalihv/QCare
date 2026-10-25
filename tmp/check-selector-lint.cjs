const { ESLint } = require('../client/node_modules/eslint');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
(async () => {
 const root = path.resolve(__dirname, '..');
 const eslint = new ESLint({ cwd: path.join(root, 'client') });
 const names = ['AuditManagement', 'RiskManagement', 'PatientFeedback', 'CapaManagement', 'DepartmentMaster'];
 let added = [];
 for (const name of names) {
  const relative = 'client/src/pages/' + name + '.jsx';
  const oldText = execFileSync('git', ['show', 'HEAD:' + relative], { cwd: root, encoding: 'utf8', windowsHide: true });
  const newText = await fs.readFile(path.join(root, relative), 'utf8');
  const options = { filePath: path.join(root, relative) };
  const oldResult = (await eslint.lintText(oldText, options))[0];
  const newResult = (await eslint.lintText(newText, options))[0];
  // Compare findings rather than source excerpts, whose line numbers change after edits.
  const key = m => m.ruleId === 'react-hooks/exhaustive-deps' ? m.ruleId : m.ruleId + ':' + m.message.split('\n')[0];
  const baseline = oldResult.messages.map(key);
  for (const message of newResult.messages) { const index = baseline.indexOf(key(message)); if (index >= 0) baseline.splice(index, 1); else added.push({ file: name, rule: message.ruleId, message: message.message }); }
 }
 console.log(JSON.stringify({ newLintFindings: added }, null, 2)); if (added.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
