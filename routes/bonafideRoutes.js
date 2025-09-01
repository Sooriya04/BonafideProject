const express = require('express');
const router = express.Router();
const bonafideController = require('../controllers/bonafideController');
const isAuthenticated = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, bonafideController.getForm);

// Preview route
router.post('/preview', isAuthenticated, bonafideController.postForm);

// Confirm route
router.post('/confirm', isAuthenticated, bonafideController.confirmForm);

module.exports = router;
