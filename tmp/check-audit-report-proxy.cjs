const assert = require('node:assert/strict');
(async () => {
  for (const [route, method] of [['/dashboard', 'GET'], ['/000000000000000000000000/report/pdf', 'GET'], ['/000000000000000000000000/schedule-approval', 'PUT'], ['/000000000000000000000000', 'PUT'], ['/000000000000000000000000', 'DELETE']]) {
    const response = await fetch('http://localhost:5173/api/audit' + route, { method, signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 401); assert.equal(response.headers.get('x-qcare-audit-workflow'), '10');
    console.log(method + ' ' + route + ': authenticated endpoint available through portal proxy; workflow 10');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
