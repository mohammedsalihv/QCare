const { test } = require('node:test');
const assert = require('node:assert/strict');
const ClinicalPrivilege = require('../models/ClinicalPrivilege');
const enrich = require('../utils/privilegeAuditContext');

test('audit context adds only safe application details to matching privilege events', async () => {
  const original = ClinicalPrivilege.find;
  const id = '507f1f77bcf86cd799439011';
  let calls = 0;
  ClinicalPrivilege.find = query => {
    calls++;
    assert.deepEqual(query, { _id: { $in: [id] } });
    return { select(fields) {
      assert.equal(fields, 'staffId specialty applicationType assignedApprover');
      return { populate(fields, selected) {
        assert.equal(fields, 'staffId assignedApprover');
        assert.equal(selected, 'employeeName');
        return { lean: async () => [{ _id: id, staffId: { employeeName: 'Dr Example' }, specialty: 'Dentistry', applicationType: 'renewal', assignedApprover: { employeeName: 'Reviewer' }, reason: 'Not exposed' }] };
      } };
    } };
  };
  try {
    const rows = [{ moduleKey: 'privileges', recordId: id }, { moduleKey: 'privileges', recordId: id }, { moduleKey: 'incidents', recordId: id }, { moduleKey: 'privileges', recordId: 'invalid' }];
    const result = await enrich(rows);
    assert.equal(calls, 1);
    assert.deepEqual(result[0].applicationContext, { clinician: 'Dr Example', specialty: 'Dentistry', requestType: 'renewal', assignedApprover: 'Reviewer' });
    assert.equal(result[2].applicationContext, undefined);
    assert.equal(result[3].applicationContext, undefined);
    assert.equal(rows[0].applicationContext, undefined);
    await enrich([rows[2], rows[3]]);
    assert.equal(calls, 1);
    ClinicalPrivilege.find = () => ({ select: () => ({ populate: () => ({ lean: async () => [] }) }) });
    assert.equal((await enrich([rows[0]]))[0].applicationContext, undefined);
  } finally { ClinicalPrivilege.find = original; }
});
