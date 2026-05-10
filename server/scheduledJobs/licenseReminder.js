const cron = require('node-cron');
const nodemailer = require('nodemailer');
const FacilityLicense = require('../models/FacilityLicense');
const StaffLicense = require('../models/StaffLicense');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const User = require('../models/users');

// Configure Nodemailer (Use environment variables in production)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'password'
  }
});

const sendLicenseReminders = async () => {
  console.log('Running License Expiry Reminders Job...');
  
  const today = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);

  // Find licenses expiring within 90 days
  const facilityLicenses = await FacilityLicense.find({
    expiryDate: { $lte: ninetyDaysFromNow, $gt: today }
  });

  const staffLicenses = await StaffLicense.find({
    expiryDate: { $lte: ninetyDaysFromNow, $gt: today }
  }).populate('staffId');

  const allLicenses = [
    ...facilityLicenses.map(l => ({ ...l._doc, type: 'Facility' })),
    ...staffLicenses.map(l => ({ ...l._doc, type: 'Staff', holder: l.staffId }))
  ];

  for (const license of allLicenses) {
    // Check if reminder was already sent in last 24h to avoid duplicates
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (license.renewalReminderSentAt && license.renewalReminderSentAt > oneDayAgo) continue;

    const daysRemaining = Math.ceil((new Date(license.expiryDate) - today) / (1000 * 60 * 60 * 24));
    const recipientId = license.type === 'Staff' ? license.holder?._id : null;
    const recipientEmail = license.type === 'Staff' ? license.holder?.email : 'quality@example.com';

    // 1. Create Notification
    await Notification.create({
      type: 'license-expiry',
      message: `${license.type} License ${license.licenseNumber} expires in ${daysRemaining} days.`,
      user: 'System',
      userId: (await User.findOne({ role: 'SuperAdmin' }))?._id || license.createdBy, // System user or Admin
      recipientId: recipientId,
      recipientRole: license.type === 'Facility' ? 'superadmin' : 'user',
      actionLink: '/dashboard/compliance'
    });

    // 2. Send Email
    try {
      await transporter.sendMail({
        from: '"QCare Compliance" <noreply@qcare.com>',
        to: recipientEmail,
        cc: 'quality-manager@example.com',
        subject: `URGENT: ${license.type} License Expiry Warning`,
        text: `Your ${license.type} License (${license.licenseNumber}) is set to expire on ${new Date(license.expiryDate).toLocaleDateString()}. Days remaining: ${daysRemaining}. Please initiate renewal.`
      });
    } catch (err) {
      console.error('Email sending failed:', err.message);
    }

    // 3. Log to AuditLog
    await AuditLog.create({
      action: 'LICENSE_EXPIRY_REMINDER',
      module: 'Compliance',
      details: { licenseNumber: license.licenseNumber, daysRemaining },
      performedBy: (await User.findOne({ role: 'SuperAdmin' }))?._id || license.createdBy
    });

    // 4. Update reminderSentAt
    if (license.type === 'Facility') {
      await FacilityLicense.findByIdAndUpdate(license._id, { renewalReminderSentAt: new Date() });
    } else {
      await StaffLicense.findByIdAndUpdate(license._id, { renewalReminderSentAt: new Date() });
    }
  }
};

// Scheduled for 7:00 AM UAE Time (UTC+4) -> 3:00 AM UTC
cron.schedule('0 3 * * *', sendLicenseReminders);

module.exports = { sendLicenseReminders };
