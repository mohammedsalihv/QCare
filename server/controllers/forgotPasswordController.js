const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false, // TLS (STARTTLS) on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
  },
});

const sendForgotPasswordEmail = async (req, res) => {
  const { username } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ message: 'Username is required.' });
  }

  const mailOptions = {
    from: `"QCare Portal" <${process.env.SMTP_FROM}>`,
    to: 'support@canadiancmc.com',
    subject: 'Password Reset Request – QCare Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #7a5c1e 0%, #C9A84C 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔒 Password Reset Request</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">QCare Health & Medical Quality Portal</p>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <p style="color: #475569; font-size: 15px; margin-top: 0;">Hello Support Team,</p>
          <p style="color: #475569; font-size: 15px;">A user has requested a password reset for their QCare Portal account. Please find the details below:</p>
          <div style="background: #f8fafc; border-left: 4px solid #C9A84C; border-radius: 4px; padding: 16px 20px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Username</p>
            <p style="margin: 6px 0 0; font-size: 20px; font-weight: bold; color: #1e293b;">${username.trim()}</p>
          </div>
          <p style="color: #475569; font-size: 15px;">Please reset their password and notify them at your earliest convenience.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This request was submitted automatically from the QCare Portal login page.</p>
        </div>
        <div style="background: #f1f5f9; padding: 16px; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} CMC Holding. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Password reset request sent successfully.' });
  } catch (err) {
    console.error('Forgot password email error:', err);
    return res.status(500).json({ message: 'Failed to send email. Please try again later.' });
  }
};

module.exports = { sendForgotPasswordEmail };
