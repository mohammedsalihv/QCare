const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chooseDepartment } = require('../utils/incidentRouting');
const departments = [{ name: 'IT', keywords: ['network outage'] }, { name: 'Facilities', keywords: ['water leak'] }];
test('routing respects the selected department and sends ambiguous content to triage', () => {
  assert.equal(chooseDepartment({ department: 'IT', title: 'Water leak', description: '' }, departments).department.name, 'IT');
  assert.equal(chooseDepartment({ title: 'NETWORK outage!', description: '' }, departments).department.name, 'IT');
  assert.equal(chooseDepartment({ title: 'Water leakage', description: '' }, departments).department, undefined);
  assert.equal(chooseDepartment({ title: 'Water leak', description: 'Network outage' }, departments).department, undefined);
  assert.equal(chooseDepartment({ title: 'Other concern', description: '' }, departments).department, undefined);
});
