const DAY = 86400000;
const startOfDay = (now = new Date()) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
function licenseStatus(expiry, now = new Date()) {
  const days = Math.round((new Date(expiry) - startOfDay(now)) / DAY);
  return days < 0 ? 'Expired' : days <= 90 ? 'Expiring soon' : 'Active';
}
module.exports = { DAY, startOfDay, licenseStatus };
