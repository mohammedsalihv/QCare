const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { metadata, moduleFor, allowed, modules } = require('../utils/requestAudit');
test('only an explicitly trusted proxy with a single valid client IP can supply the address', () => {
  const { clientAddress } = require('../utils/clientAddress');
  const previous = process.env.QCARE_AUDIT_TRUSTED_PROXIES;
  try {
    process.env.QCARE_AUDIT_TRUSTED_PROXIES = '127.0.0.1,::1';
    const request = (peer, forwarded) => ({ socket: { remoteAddress: peer }, headers: { 'x-forwarded-for': forwarded } });
    assert.deepEqual(clientAddress(request('::ffff:127.0.0.1', '172.16.50.59')), { ipAddress: '172.16.50.59', peerIpAddress: '127.0.0.1', ipSource: 'trusted-proxy' });
    assert.equal(clientAddress(request('192.168.1.220', '172.16.50.59')).ipAddress, '192.168.1.220');
    for (const header of ['bad', '172.16.50.59, 192.168.1.220', ['172.16.50.59'], '']) assert.equal(clientAddress(request('127.0.0.1', header)).ipSource, 'connection');
    assert.equal(clientAddress(request('::1', '2001:db8::2')).ipAddress, '2001:db8::2');
    delete process.env.QCARE_AUDIT_TRUSTED_PROXIES;
    assert.equal(clientAddress(request('127.0.0.1', '172.16.50.59')).ipSource, 'connection');
  } finally { if (previous === undefined) delete process.env.QCARE_AUDIT_TRUSTED_PROXIES; else process.env.QCARE_AUDIT_TRUSTED_PROXIES = previous; }
});

test('audit identity uses server connection and parses browser hints without trusting forwarded headers', () => {
  const value = metadata({ socket: { remoteAddress: '192.0.2.1' }, headers: { 'x-forwarded-for': '203.0.113.5', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36 Edg/130.0\nINJECT' } });
  assert.equal(value.ipAddress, '192.0.2.1'); assert.equal(value.browser, 'Edge'); assert.equal(value.operatingSystem, 'Windows'); assert(!value.userAgent.includes('\n'));
  assert.match(value.requestId, /^[a-f\d-]{36}$/); assert.equal(value.ipSource, 'connection');
});
test('every mounted business API has module coverage and longest prefix wins', () => {
  const source = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
  const paths = [...source.matchAll(/app\.use\(["'](\/api\/[^"']+)["']/g)].map(match => match[1]);
  for (const route of paths.filter(p => p !== '/api/audit-events')) assert(moduleFor(route), route);
  assert.equal(moduleFor('/api/qms/capa/123').key, 'capa'); assert.equal(moduleFor('/api/fms/assets/123').key, 'equipment'); assert.equal(moduleFor('/api/cp/privileges/123/approve').key, 'privileges');
  assert.equal(moduleFor('/api/incidents-extra'), undefined);
  assert(allowed({ role: 'QualityManager' }, modules.find(m => m.key === 'incidents')));
  assert(!allowed({ role: 'QualityManager' }, modules.find(m => m.key === 'users')));
  assert(!allowed({ role: 'user' }, modules[0]));
});
test('an audit write failure blocks the operation before a business change can occur', async () => {
  const AuditLog = require('../models/AuditLog'), middleware = require('../middleware/moduleAudit');
  const create = AuditLog.create;
  let called = false, code, body;
  AuditLog.create = async () => { throw Error('Database unavailable'); };
  try {
    await middleware({ originalUrl: '/api/users/123', method: 'DELETE', headers: {}, socket: { remoteAddress: '127.0.0.1' } }, { status(value) { code = value; return this; }, json(value) { body = value; } }, () => { called = true; });
    assert.equal(code, 503); assert.equal(called, false); assert.match(body.message, /Audit service/);
  } finally { AuditLog.create = create; }
});
