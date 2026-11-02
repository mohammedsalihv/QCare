import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Linter } from 'eslint';
import jsxBindings from '../eslint-rules/jsxBindings.js';

const lint = code => new Linter().verify(code, [{
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
  plugins: { local: { rules: { 'jsx-bindings': jsxBindings } } },
  rules: { 'local/jsx-bindings': 'error' },
}]);

test('detects missing component imports that would crash a page', () => {
  assert.equal(lint('export default function Page() { return <ListToolbar />; }')[0].ruleId, 'local/jsx-bindings');
  assert.equal(lint('export default function Page() { return <UI.Toolbar />; }')[0].ruleId, 'local/jsx-bindings');
});
test('accepts imports, local components, component props and native elements', () => {
  for (const code of [
    "import ListToolbar from './ListToolbar'; export default function Page() { return <ListToolbar />; }",
    'const Toolbar = () => <div />; export default function Page() { return <Toolbar />; }',
    'export default function Page({ Toolbar }) { return <Toolbar />; }',
    "import * as UI from './ui'; export default function Page() { return <UI.Toolbar />; }",
  ]) assert.deepEqual(lint(code), []);
});
