const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminAuthController');

// Admin Login
router.get('/admin-login', adminController.adminLoginPage);
router.post('/admin-login', adminController.adminLogin);
router.get('/admin-logout', adminController.adminLogout);

// Admin Forgot Password
router.get('/admin-forgot-password', adminController.showAdminForgotPassword);
router.post('/admin-forgot-password', adminController.adminForgotPassword);

// Admin Reset Password
router.get('/admin-reset-password', adminController.showAdminResetForm);
router.post('/admin-reset-password', adminController.adminResetPassword);

module.exports = router;
