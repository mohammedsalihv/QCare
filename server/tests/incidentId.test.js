const { test } = require('node:test');
const assert = require('node:assert/strict');
const { newIncidentId, createWithIncidentId } = require('../utils/incidentId');
test('short codes exclude ambiguous characters and retry database collisions', async () => {
  for (let i = 0; i < 100; i++) assert.match(newIncidentId(), /^INC-[2-9A-HJ-NP-Z]{8}$/);
  let calls = 0;
  const row = await createWithIncidentId({ create: async data => {
    if (++calls === 1) throw Object.assign(new Error('collision'), { code: 11000, keyPattern: { incidentId: 1 } });
    return data;
  } }, { title: 'Example' });
  assert.equal(calls, 2); assert.equal(row.title, 'Example');
  const other = Object.assign(new Error('Other unique constraint'), { code: 11000, keyPattern: { other: 1 } });
  await assert.rejects(createWithIncidentId({ create: async () => { throw other; } }, {}), error => error === other);
  calls = 0;
  await assert.rejects(createWithIncidentId({ create: async () => { calls++; throw Object.assign(new Error('collision'), { code: 11000, keyPattern: { incidentId: 1 } }); } }, {}));
  assert.equal(calls, 5);
});
