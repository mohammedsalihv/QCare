import { test } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { loadUserDirectory, directoryErrorMessage } from '../src/utils/userDirectory.js';
const missing = { response: { status: 404 } };
const rows = [
  { _id: '2', employeeName: 'Zara Doctor', employeeId: 'EMP-2', designation: 'Physician', department: 'Medicine', status: 'active', password: 'must-not-retain', email: 'private@example.invalid' },
  { _id: '1', employeeName: 'Amal Nurse', employeeId: 'EMP-1', designation: 'Nurse', department: 'Medicine', isActive: true },
  { _id: '3', employeeName: 'Inactive Staff', status: 'inactive' },
  { _id: '4', employeeName: 'Blocked Staff', status: 'blocked' },
  { _id: '5', employeeName: 'Disabled Staff', isActive: false },
];
test('updated server uses the directory and returns active display fields only', async t => {
  const get = t.mock.method(axios, 'get', async () => ({ data: rows }));
  const result = await loadUserDirectory({}, 'Staff');
  assert.equal(get.mock.calls.length, 1); assert.equal(get.mock.calls[0].arguments[0], '/api/users/directory');
  assert.deepEqual(result.map(user => user.employeeName), ['Amal Nurse', 'Zara Doctor']);
  assert(!('password' in result[1])); assert(!('email' in result[1]));
});
test('administrator can use existing users endpoint when the live directory route is absent', async t => {
  const config = { headers: { Authorization: 'Bearer test-only' } };
  const paths = [];
  t.mock.method(axios, 'get', async (url, options) => { paths.push(url); assert.equal(options, config); if (url === '/api/users/directory') throw missing; return { data: rows }; });
  const result = await loadUserDirectory(config, 'SuperAdmin');
  assert.deepEqual(paths, ['/api/users/directory', '/api/users']); assert.equal(result.length, 2);
});
test('staff are told a server update is required without calling administrator APIs', async t => {
  const get = t.mock.method(axios, 'get', async () => { throw missing; });
  await assert.rejects(loadUserDirectory({}, 'Staff'), /staff-directory update/);
  assert.equal(get.mock.calls.length, 1);
});
test('authentication, permission and server errors never trigger legacy fallback', async t => {
  for (const status of [401, 403, 500]) {
    const error = { response: { status } }; const get = t.mock.method(axios, 'get', async () => { throw error; });
    await assert.rejects(loadUserDirectory({}, 'admin'), value => value === error);
    assert.equal(get.mock.calls.length, 1); get.mock.restore();
  }
});
test('cancelled requests never trigger another API call', async t => {
  const signal = AbortSignal.abort(); const get = t.mock.method(axios, 'get', async () => { throw missing; });
  await assert.rejects(loadUserDirectory({ signal }, 'admin')); assert.equal(get.mock.calls.length, 1);
});
test('an unexpected webpage response is not mistaken for an empty users collection', async t => {
  t.mock.method(axios, 'get', async () => ({ data: '<html>Not an API response</html>' }));
  await assert.rejects(loadUserDirectory({}, 'admin'), /did not return a staff list/);
});
test('messages distinguish expired sessions from missing backend routes', () => {
  assert.match(directoryErrorMessage({ response: { status: 401 } }), /Sign in again/);
  assert.match(directoryErrorMessage(missing), /staff-directory update/);
});
