const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');

router.get('/signup', ctrl.showSignup);
router.post('/signup', ctrl.signup);

router.get('/login', ctrl.showLogin);
router.post('/login', ctrl.login);

router.get('/verify', ctrl.verify);

router.post('/google-login', ctrl.googleLogin);

router.get('/forgot-password', (req, res) =>
  res.render('password', { error: null, message: null })
);
router.post('/forgot-password', ctrl.forgotPassword);

router.get('/reset-password', ctrl.showResetForm);
router.post('/reset-password', ctrl.resetPassword);
module.exports = router;
