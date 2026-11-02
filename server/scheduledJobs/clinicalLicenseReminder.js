const cron = require('node-cron');
const License = require('../models/ClinicalStaffLicense');
const Notification = require('../models/Notification');
const { DAY, startOfDay } = require('../utils/clinicalLicenseStatus');

// In-app reminders only. A missed run catches up at the current urgency level.
async function sendClinicalLicenseReminders(now = new Date()) {
  const today = startOfDay(now);
  const cursor = License.find({ expiryDate: { $lte: new Date(+today + 90 * DAY) } })
    .select('staff authority licenseNumber expiryDate createdBy').populate('staff', 'employeeName').cursor();
  let created = 0;
  for await (const row of cursor) {
    if (!row.staff) continue;
    const days = Math.round((row.expiryDate - today) / DAY);
    const threshold = days < 0 ? 'expired' : days === 0 ? 'today' : days <= 7 ? '7' : days <= 30 ? '30' : '90';
    const sourceKey = `clinical-licence:${row._id}:${row.expiryDate.toISOString().slice(0, 10)}:${threshold}`;
    try {
      const result = await Notification.updateOne({ sourceKey }, { $setOnInsert: {
        sourceKey, type: 'license-expiry', user: 'QCare', userId: row.createdBy,
        message: `${row.staff.employeeName}: ${row.authority} licence ${row.licenseNumber} ${days < 0 ? 'expired' : days === 0 ? 'expires today' : `expires in ${days} days`} (${row.expiryDate.toISOString().slice(0, 10)}).`,
        actionLink: '/dashboard/physician-demography', recipientRole: 'user',
        recipientIds: [row.staff._id], recipientRoles: ['admin', 'superadmin', 'qualitymanager'],
      } }, { upsert: true });
      created += result.upsertedCount;
    } catch (error) {
      // A second server process may have created the same reminder concurrently.
      if (error.code !== 11000) throw error;
    }
  }
  return created;
}
function scheduleClinicalLicenseReminders() {
  return cron.schedule('0 7 * * *', () => sendClinicalLicenseReminders().catch(() => {
    console.error('Clinical licence reminders failed; retry on the next scheduled run.');
  }), { timezone: 'Asia/Dubai', noOverlap: true });
}
module.exports = { sendClinicalLicenseReminders, scheduleClinicalLicenseReminders };
