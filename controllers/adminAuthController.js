const { db } = require('../config/firebase');
const {
  hashPassword,
  generateTokenAndHash,
  compareToken,
  comparePassword,
} = require('../utils/tokenUtils');
const { sendPasswordResetEmail } = require('../helper/emailHelper');

// =====================
// Admin Login
// =====================
const adminLoginPage = (req, res) => {
  res.render('adminLogin', { error: null, message: null });
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.render('adminLogin', {
      error: 'All fields are required',
      message: null,
    });
  }

  try {
    const snapshot = await db
      .collection('admins')
      .where('email', '==', email)
      .get();
    if (snapshot.empty) {
      return res.render('adminLogin', {
        error: 'Admin not found',
        message: null,
      });
    }

    const adminDoc = snapshot.docs[0];
    const admin = adminDoc.data();

    const valid = await comparePassword(password, admin.password);
    if (!valid) {
      return res.render('adminLogin', {
        error: 'Incorrect password',
        message: null,
      });
    }

    req.session.user = { email: admin.email, role: 'admin' };
    req.session.message = `Welcome Admin ${admin.name || admin.email}`;
    return res.redirect('/admin');
  } catch (err) {
    console.error('Admin login error:', err);
    return res.render('adminLogin', { error: 'Login failed', message: null });
  }
};

const adminLogout = (req, res) => {
  req.session.destroy(() => res.redirect('/auth/admin-login'));
};

// =====================
// Admin Forgot Password
// =====================
const showAdminForgotPassword = (req, res) => {
  res.render('admin-forgot-password', { error: null, message: null });
};

const adminForgotPassword = async (req, res) => {
  const { email } = req.body || {};
  if (!email)
    return res.render('admin-forgot-password', {
      error: 'Email required',
      message: null,
    });

  try {
    const snapshot = await db
      .collection('admins')
      .where('email', '==', email)
      .get();
    if (snapshot.empty)
      return res.render('admin-forgot-password', {
        error: 'Admin not found',
        message: null,
      });

    const adminDoc = snapshot.docs[0];
    const { token, tokenHash } = await generateTokenAndHash();
    const expireAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await adminDoc.ref.update({
      resetTokenHash: tokenHash,
      resetTokenExpiry: expireAt,
    });
    await sendPasswordResetEmail(email, token);

    return res.render('message', {
      message: 'Password reset link sent to your email.',
    });
  } catch (err) {
    console.error('Admin forgot password error:', err);
    return res.render('admin-forgot-password', {
      error: 'Something went wrong',
      message: null,
    });
  }
};

// =====================
// Show Reset Password Form
// =====================
const showAdminResetForm = async (req, res) => {
  const { email, token } = req.query || {};
  if (!email || !token)
    return res.render('message', { message: 'Invalid reset link' });

  try {
    const snapshot = await db
      .collection('admins')
      .where('email', '==', email)
      .get();
    if (snapshot.empty)
      return res.render('message', { message: 'Invalid reset link' });

    const admin = snapshot.docs[0].data();

    if (!admin.resetTokenHash || !admin.resetTokenExpiry)
      return res.render('message', { message: 'No reset request found' });
    if (new Date() > admin.resetTokenExpiry.toDate())
      return res.render('message', { message: 'Reset link expired' });

    const valid = await compareToken(token, admin.resetTokenHash);
    if (!valid)
      return res.render('message', { message: 'Invalid reset token' });

    return res.render('admin-reset-password', { email, token, error: null });
  } catch (err) {
    console.error('Show admin reset form error:', err);
    return res.render('message', { message: 'Something went wrong' });
  }
};

// =====================
// Handle Reset Password
// =====================
const adminResetPassword = async (req, res) => {
  const { email, token, password } = req.body || {};
  if (!email || !token || !password)
    return res.render('message', { message: 'Missing data' });

  try {
    const snapshot = await db
      .collection('admins')
      .where('email', '==', email)
      .get();
    if (snapshot.empty)
      return res.render('message', { message: 'Invalid reset attempt' });

    const adminDoc = snapshot.docs[0];
    const admin = adminDoc.data();

    if (!admin.resetTokenHash || !admin.resetTokenExpiry)
      return res.render('message', { message: 'No reset request found' });
    if (new Date() > admin.resetTokenExpiry.toDate())
      return res.render('message', { message: 'Reset link expired' });

    const valid = await compareToken(token, admin.resetTokenHash);
    if (!valid)
      return res.render('message', { message: 'Invalid reset token' });

    const passwordHash = await hashPassword(password);
    await adminDoc.ref.update({
      password: passwordHash,
      resetTokenHash: null,
      resetTokenExpiry: null,
    });

    return res.render('message', {
      message: 'Password reset successful. You can now login.',
    });
  } catch (err) {
    console.error('Admin reset password error:', err);
    return res.render('message', { message: 'Something went wrong' });
  }
};

module.exports = {
  adminLoginPage,
  adminLogin,
  adminLogout,
  showAdminForgotPassword,
  adminForgotPassword,
  showAdminResetForm,
  adminResetPassword,
};
