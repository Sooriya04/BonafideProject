const {
  hashPassword,
  comparePassword,
  generateTokenAndHash,
  compareToken,
} = require('../utils/tokenUtils');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../helper/emailHelper');
const {
  findUserByEmail,
  findPendingUsersByEmail,
  addPendingUser,
  addUser,
  deletePendingUser,
} = require('../functions/authFuntions');
const { getAuth } = require('firebase-admin/auth');
const { db } = require('../config/firebase');

// =====================
// Render Pages
// =====================
const showSignup = (req, res) => {
  res.render('signup', { error: null, message: null });
};

const showLogin = (req, res) => {
  res.render('login', { error: null, message: null });
};

// =====================
// Signup
// =====================
const signup = async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.render('signup', {
      error: 'Input Error',
      message: 'Please fill all the fields.',
    });
  }

  if (!email.endsWith('@student.tce.edu')) {
    return res.render('signup', {
      error: 'Email Error',
      message: 'Email must end with @student.tce.edu',
    });
  }

  try {
    // Already registered?
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.render('signup', {
        error: 'Email Error',
        message: 'This email is already registered.',
      });
    }

    // Clean old pending requests
    const oldPending = await findPendingUsersByEmail(email);
    if (oldPending.length > 0) {
      const batch = db.batch();
      oldPending.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // Create new pending signup
    const passwordHash = await hashPassword(password);
    const { token, tokenHash } = await generateTokenAndHash();
    const expireAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6h validity

    await addPendingUser(name, email, passwordHash, tokenHash, expireAt);
    await sendVerificationEmail(email, token);

    return res.render('verifyNotice', { email, error: null, message: null });
  } catch (err) {
    console.error('Signup error:', err);
    return res.render('signup', {
      error: 'Signup Error',
      message: 'Signup failed. Please try again later.',
    });
  }
};

// =====================
// Verify Email
// =====================
const verify = async (req, res) => {
  const { email, token } = req.query || {};

  if (!email || !token) {
    return res.render('verificationfailed', { message: 'Missing parameters.' });
  }

  try {
    const pendingUsers = await findPendingUsersByEmail(email);
    if (pendingUsers.length === 0) {
      return res.render('verificationfailed', {
        message: 'Invalid or already used verification link.',
      });
    }

    // Get latest pending signup
    const latestDoc = pendingUsers.reduce((latest, doc) => {
      const createdAt = doc.data().createdAt.toDate().getTime();
      return createdAt > (latest?.data()?.createdAt?.toDate()?.getTime() || 0)
        ? doc
        : latest;
    }, null);

    const data = latestDoc.data();

    // Expired?
    if (new Date() > data.expireAt.toDate()) {
      await deletePendingUser(latestDoc.ref);
      return res.render('verificationfailed', {
        message: 'Verification link expired. Please sign up again.',
      });
    }

    // Token check
    const tokenMatches = await compareToken(token, data.tokenHash);
    if (!tokenMatches) {
      return res.render('verificationfailed', {
        message: 'Invalid verification token.',
      });
    }

    // Move to permanent users
    await addUser(data.name, email, data.passwordHash);
    await deletePendingUser(latestDoc.ref);

    return res.render('verifySuccess', {
      message: 'Email verified successfully! You can now log in.',
    });
  } catch (err) {
    console.error('Verification error:', err);
    return res.render('verificationfailed', {
      message: 'Verification failed. Please try again.',
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.render('login', {
      error: 'All fields are required',
      message: null,
    });
  }

  try {
    const userDoc = await findUserByEmail(email);

    if (!userDoc) {
      const pending = await findPendingUsersByEmail(email);
      if (pending.length > 0) {
        return res.render('verifyNotice', {
          email,
          error: null,
          message: null,
        });
      }
      return res.render('login', {
        error: 'User not found',
        message: null,
      });
    }

    const user = userDoc.data();

    // Password check
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.render('login', {
        error: 'Incorrect password',
        message: null,
      });
    }

    // Session setup
    req.session.user = { email: user.email, name: user.name };
    req.session.message = `Welcome ${user.name || user.email}`;

    return res.redirect('/bonafide');
  } catch (err) {
    console.error('Login error:', err);
    return res.render('login', {
      error: 'Login failed',
      message: null,
    });
  }
};

// =====================
// Google Login
// =====================
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.json({ success: false, message: 'No ID token provided' });
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    const email = decodedToken.email;
    const name = decodedToken.name || email.split('@')[0];

    if (!email.endsWith('@student.tce.edu')) {
      return res.json({
        success: false,
        message: 'Email must end with @student.tce.edu',
      });
    }

    let userDoc = await findUserByEmail(email);
    if (!userDoc) {
      await addUser(name, email, null);
    }

    req.session.user = { email, name };
    req.session.message = `Welcome ${name}`;

    return res.json({ success: true });
  } catch (err) {
    console.error('Google login error:', err);
    return res.json({ success: false, message: 'Google login failed' });
  }
};
const forgotPassword = async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.render('forgot-password', {
      error: 'Email required',
      message: null,
    });
  }

  try {
    const userDoc = await findUserByEmail(email);
    if (!userDoc) {
      return res.render('forgot-password', {
        error: 'User not found',
        message: null,
      });
    }

    const { token, tokenHash } = await generateTokenAndHash();
    const expireAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userDoc.ref.update({
      resetTokenHash: tokenHash,
      resetTokenExpiry: expireAt,
    });

    await sendPasswordResetEmail(email, token);
    return res.render('message', {
      message: 'Password reset link sent to your email.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.render('forgot-password', {
      error: 'Something went wrong',
      message: null,
    });
  }
};

// =====================
// Show Reset Form
// =====================
const showResetForm = async (req, res) => {
  const { email, token } = req.query || {};
  if (!email || !token) {
    return res.render('message', { message: 'Invalid reset link' });
  }

  try {
    const userDoc = await findUserByEmail(email);
    if (!userDoc) {
      return res.render('message', { message: 'Invalid reset link' });
    }
    const data = userDoc.data();

    if (!data.resetTokenHash || !data.resetTokenExpiry) {
      return res.render('message', { message: 'No reset request found' });
    }

    if (new Date() > data.resetTokenExpiry.toDate()) {
      return res.render('message', { message: 'Reset link expired' });
    }

    const valid = await compareToken(token, data.resetTokenHash);
    if (!valid) {
      return res.render('message', { message: 'Invalid reset token' });
    }

    return res.render('reset-password', { email, token, error: null });
  } catch (err) {
    console.error('Show reset form error:', err);
    return res.render('message', { message: 'Something went wrong' });
  }
};

// =====================
// Handle Reset Password
// =====================
const resetPassword = async (req, res) => {
  const { email, token, password } = req.body || {};
  if (!email || !token || !password) {
    return res.render('message', { message: 'Missing data' });
  }

  try {
    const userDoc = await findUserByEmail(email);
    if (!userDoc) {
      return res.render('message', { message: 'Invalid reset attempt' });
    }
    const data = userDoc.data();

    if (!data.resetTokenHash || !data.resetTokenExpiry) {
      return res.render('message', { message: 'No reset request found' });
    }

    if (new Date() > data.resetTokenExpiry.toDate()) {
      return res.render('message', { message: 'Reset link expired' });
    }

    const valid = await compareToken(token, data.resetTokenHash);
    if (!valid) {
      return res.render('message', { message: 'Invalid reset token' });
    }

    const passwordHash = await hashPassword(password);
    await userDoc.ref.update({
      password: passwordHash,
      resetTokenHash: null,
      resetTokenExpiry: null,
    });

    return res.render('message', {
      message: 'Password reset successful. You can now login.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.render('message', { message: 'Something went wrong' });
  }
};

module.exports = {
  showSignup,
  signup,
  verify,
  showLogin,
  login,
  googleLogin,
  forgotPassword,
  showResetForm,
  resetPassword,
};
