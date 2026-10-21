// One-time, syntax-aware migration of legacy presentation classes.
// Only className strings are changed; application data and behavior are untouched.
const fs = require('node:fs');
const path = require('node:path');
const espree = require('espree');
const root = path.resolve(__dirname, '../src');
const mappings = {
  'font-black': 'font-semibold', 'font-extrabold': 'font-semibold', 'font-bold': 'font-semibold',
  'text-black': 'text-slate-800', 'text-[#040404]': 'text-slate-800',
  'text-slate-400': 'text-slate-500', 'text-slate-650': 'text-slate-600',
  'border-slate-150': 'border-slate-200',
  'uppercase': 'normal-case', 'tracking-widest': 'tracking-normal',
  'tracking-wider': 'tracking-normal',
  'rounded-[2rem]': 'rounded-2xl', 'rounded-[2.5rem]': 'rounded-2xl',
  'rounded-[3rem]': 'rounded-2xl', 'rounded-[4rem]': 'rounded-2xl',
  'rounded-3xl': 'rounded-2xl', 'rounded-[24px]': 'rounded-2xl',
  'rounded-[32px]': 'rounded-2xl', 'rounded-[40px]': 'rounded-2xl',
  'rounded-[1.5rem]': 'rounded-2xl',
  'bg-[#040404]': 'bg-primary', 'bg-slate-900': 'bg-primary',
  'bg-slate-800': 'bg-primary', 'text-xs': 'text-[13px]',
  'bg-black': 'bg-primary', 'border-black': 'border-slate-200',
  'border-black/20': 'border-slate-200', 'border-black/40': 'border-slate-300',
};
function normalize(value) {
  // Retain whitespace around template interpolation boundaries.
  const normalized = value.replace(/\S+/g, token => {
    if (token.startsWith('dark:')) return '';
    const split = token.lastIndexOf(':');
    const prefix = split < 0 ? '' : token.slice(0, split + 1);
    const base = split < 0 ? token : token.slice(split + 1);
    if (/^text-\[(?:8|9|10|11)px\]$/.test(base)) return prefix + 'text-[12px]';
    if (/^tracking-\[0\.(?:1|15|2|25|3)em\]$/.test(base)) return prefix + 'tracking-normal';
    if (/^shadow-gold/.test(base) || /^shadow-slate-900\//.test(base)) return prefix + 'shadow-none';
    return prefix + (mappings[base] || base);
  });
  const tokens = [...new Set(normalized.trim().split(/\s+/).filter(Boolean))];
  return (value.match(/^\s+/)?.[0] || '') + tokens.join(' ') + (value.match(/\s+$/)?.[0] || '');
}
function walk(node, callback) {
  if (!node || typeof node !== 'object') return;
  callback(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') continue;
    if (Array.isArray(value)) value.forEach(item => walk(item, callback));
    else if (value && typeof value === 'object') walk(value, callback);
  }
}
const files = [];
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (entry.name.endsWith('.jsx')) files.push(file);
  }
}
collect(path.join(root, 'pages'));
collect(path.join(root, 'components'));
let changed = 0;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true }, range: true });
  const edits = new Map();
  walk(ast, node => {
    const isAttribute = node.type === 'JSXAttribute' && node.name?.name === 'className';
    const isClassConstant = node.type === 'VariableDeclarator' && /^(btnPrimary|btnSecondary|btnIcon|btnIconDanger|permOff|permOn)$/.test(node.id?.name || '');
    if (!isAttribute && !isClassConstant) return;
    walk(isAttribute ? node.value : node.init, value => {
      let start, end;
      if (value.type === 'Literal' && typeof value.value === 'string') {
        [start, end] = [value.range[0] + 1, value.range[1] - 1];
      } else if (value.type === 'TemplateElement') {
        [start, end] = [value.range[0] + 1, value.range[1] - (value.tail ? 1 : 2)];
      } else return;
      const original = source.slice(start, end);
      const replacement = normalize(original);
      if (replacement !== original) edits.set(start, { start, end, replacement });
    });
  });
  let result = source;
  for (const edit of [...edits.values()].sort((a, b) => b.start - a.start)) {
    result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
  }
  if (result !== source) {
    // Parse before writing to catch any template-boundary mistakes.
    espree.parse(result, { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } });
    fs.writeFileSync(file, result);
    changed++;
  }
}
console.log(`Normalized presentation classes in ${changed} of ${files.length} page/component files.`);
