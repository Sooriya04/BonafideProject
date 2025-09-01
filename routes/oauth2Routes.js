const express = require('express');
const router = express.Router();
const { oauthCallback } = require('../controllers/oauth2Controller');

router.get('/oauth2callback', oauthCallback);

module.exports = router;
