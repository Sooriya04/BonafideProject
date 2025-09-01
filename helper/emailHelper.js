const transporter = require('./transporter');
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function sendVerificationEmail(email, token) {
  const verifyUrl = `${APP_URL}/auth/verify?email=${encodeURIComponent(
    email
  )}&token=${encodeURIComponent(token)}`;

  return transporter.sendMail({
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: 'Verify your email - Student Portal',
    html: `
      <p>Hi,</p>
      <p>Click below to verify your email and complete signup:</p>
      <p><a href="${verifyUrl}">Verify my email</a></p>
      <p>This link expires in 6 hours.</p>
    `,
  });
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${APP_URL}/auth/reset-password?email=${encodeURIComponent(
    email
  )}&token=${encodeURIComponent(token)}`;

  return transporter.sendMail({
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: 'Reset your password - Student Portal',
    html: `
      <div style="background-color:#fffdf5; font-family: 'Arial', cursive; padding:20px; display:flex; justify-content:center; align-items:center; min-height:100vh;">
        <div style="background:white; border-radius:20px; max-width:420px; width:100%; padding:2.5rem 2rem; text-align:center; box-shadow:0 8px 24px rgba(0,0,0,0.15);">
          <h2 style="color:#800000; font-size:1.8rem; font-weight:bold; margin-bottom:0.5rem;">🔒 Reset Your Password</h2>
          <p style="color:#a05252; font-size:1rem; margin-bottom:1.2rem;">
            You requested a password reset. Click the button below to set a new password.
          </p>
          <a href="${resetUrl}" target="_blank" style="display:inline-block; background-color:#800000; color:white; text-decoration:none; border-radius:20px; padding:10px 20px; font-size:1.1rem; margin-top:10px; width:100%; box-sizing:border-box;">Reset My Password</a>
          <p style="color:#a05252; font-size:0.9rem; margin-top:15px;">
            This link expires in <strong>1 hour</strong>. If you didn’t request this, you can ignore this email.
          </p>
        </div>
      </div>

    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
