// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { getAdminPage } = require('../controllers/adminController');
const {
  ensureLoggedIn,
  ensureAdmin,
} = require('../middleware/adminMiddleware');

// Admin page that lists all bonafideForms
router.get('/admin', ensureLoggedIn, ensureAdmin, getAdminPage);

module.exports = router;
