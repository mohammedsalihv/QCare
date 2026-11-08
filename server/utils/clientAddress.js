const { isIP } = require('node:net');
const normalize = value => {
  if (typeof value !== 'string') return '';
  const address = value.trim().replace(/^::ffff:/i, '');
  return isIP(address) ? address : '';
};
function clientAddress(req) {
  const peerIpAddress = normalize(req.socket?.remoteAddress);
  // Only explicitly configured proxy hosts may supply a client address. Do not trust a NAT gateway.
  const trusted = (process.env.QCARE_AUDIT_TRUSTED_PROXIES || '').split(',').map(normalize).filter(Boolean);
  const forwarded = req.headers['x-forwarded-for'];
  const client = typeof forwarded === 'string' && !forwarded.includes(',') ? normalize(forwarded) : '';
  return trusted.includes(peerIpAddress) && client
    ? { ipAddress: client, peerIpAddress, ipSource: 'trusted-proxy' }
    : { ipAddress: peerIpAddress, peerIpAddress, ipSource: 'connection' };
}
module.exports = { clientAddress, normalize };
