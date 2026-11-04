const { test } = require('node:test');
const assert = require('node:assert/strict');
const Incident = require('../models/Incident');
const { guide, presentation } = require('../utils/incidentReportPresentation');
test('every stored incident status has a meaning and next action', () => {
  for (const status of Incident.schema.path('status').enumValues) {
    assert.ok(guide[status]?.meaning);
    assert.ok(guide[status]?.next);
  }
  assert.match(guide.Resolved.label, /review required/);
});
test('deadlines exclude completed actions and inactive investigations', () => {
  const row = { status: 'Action in progress', investigationDue: '2025-01-01', actions: [
    { dueDate: '2025-01-01', completedAt: '2025-01-01' },
    { dueDate: '2026-11-08' }, { dueDate: '2026-11-02' }
  ] };
  const result = presentation(row, new Date('2026-11-04'));
  assert.equal(result.completed, 1);
  assert.equal(result.overdue, 1);
  assert.equal(result.nextDue.date.toISOString(), '2026-11-02T00:00:00.000Z');
  for (const status of ['Closed', 'Rejected', 'Duplicate']) {
    assert.equal(presentation({ ...row, status }).nextDue, undefined);
    assert.equal(presentation({ ...row, status }).overdue, 0);
  }
  assert.equal(presentation({ ...row, status: 'Reopened' }, new Date('2026-11-04')).nextDue.kind, 'Investigation');
});
