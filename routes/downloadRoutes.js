const express = require('express');
const router = express.Router();
const dCtrl = require('../controllers/downloadController');

router.get('/print/multiple', dCtrl.printMultipleBonafide);

module.exports = router;
