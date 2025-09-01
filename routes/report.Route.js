const express = require('express');
const { generateMonthlyReport } = require('../controllers/reportController');

const router = express.Router();

router.get('/report/:monthYear', generateMonthlyReport);

module.exports = router;
