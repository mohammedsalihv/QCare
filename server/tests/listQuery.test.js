const { test } = require('node:test');
const assert = require('node:assert/strict');
const { listQuery } = require('../utils/listQuery');
const config = { sorts: { name: 'nameKey' } };
test('list query rejects objects, oversized requests and unapproved sort fields', () => {
  for (const query of [{ search: { $ne: '' } }, { search: ['x'] }, { search: 'x'.repeat(101) }, { page: '-1' }, { page: '1.5' }, { limit: '101' }, { sortBy: '__proto__' }, { direction: 'wrong' }, { status: { $ne: '' } }]) {
    assert.throws(() => listQuery(query, config), { status: 400 });
  }
});
test('search is literal and sorting has a stable tie breaker', () => {
  const result = listQuery({ search: '.*[test]', page: '2', limit: '25', direction: 'desc' }, config);
  assert(result.regex.test('literal .*[test] value')); assert(!result.regex.test('test'));
  assert.deepEqual(result.sort, { nameKey: -1, _id: 1 });
  assert.equal(result.page, 2); assert.equal(result.limit, 25);
});
