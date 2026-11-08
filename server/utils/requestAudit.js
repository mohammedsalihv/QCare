const { AsyncLocalStorage } = require('node:async_hooks');
const { randomUUID } = require('node:crypto');
const modules = require('./auditModules.json');
const context = new AsyncLocalStorage();
const clean = (value, max = 300) => typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, '').slice(0, max) : '';
function metadata(req) {
  const agent = clean(req.headers['user-agent'], 500);
  const browser = /Edg\//.test(agent) ? 'Edge' : /OPR\//.test(agent) ? 'Opera' : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : 'Unknown';
  const operatingSystem = /Android/.test(agent) ? 'Android' : /iPhone|iPad/.test(agent) ? 'iOS' : /Windows/.test(agent) ? 'Windows' : /Macintosh/.test(agent) ? 'macOS' : /Linux/.test(agent) ? 'Linux' : 'Unknown';
  // Socket address is server-observed. Never trust a caller-supplied forwarded IP.
  return { requestId: randomUUID(), ipAddress: clean(req.socket?.remoteAddress, 80), ipSource: 'connection', userAgent: agent, browser, operatingSystem, deviceType: /iPad|Tablet/.test(agent) ? 'Tablet' : /Mobile|iPhone|Android/.test(agent) ? 'Mobile' : 'Desktop / unknown' };
}
const moduleFor = path => modules.flatMap(module => module.api.map(prefix => ({ module, prefix: '/api/' + prefix }))).sort((a, b) => b.prefix.length - a.prefix.length).find(item => path === item.prefix || path.startsWith(item.prefix + '/'))?.module;
const allowed = (user, module) => ['admin', 'superadmin'].includes(user?.role?.toLowerCase()) || (!module.adminOnly && user?.role?.toLowerCase() === 'qualitymanager');
const currentMetadata = () => context.getStore()?.metadata || {};
module.exports = { modules, context, metadata, moduleFor, allowed, currentMetadata, clean };
