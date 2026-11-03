const { test } = require('node:test');
const assert = require('node:assert/strict');
const Designation = require('../models/Designation');
const { createDesignation } = require('../controllers/designationController');
test('designation creation accepts omitted grade and description', async t => {
  t.mock.method(Designation, 'findOne', async () => null);
  t.mock.method(Designation, 'create', async data => { const row = new Designation(data); await row.validate(); return row; });
  for (const extra of [{}, {grade:'', description:''}]) {
    let status, body;
    const res = {status(value) { status=value; return this; },json(value) { body=value; return this; }};
    await createDesignation({body:{title:'Test role',code:'TEST',...extra}},res);
    assert.equal(status,201);assert.equal(body.grade,'');assert.equal(body.description,'');
  }
  await assert.rejects(new Designation({}).validate());
});
