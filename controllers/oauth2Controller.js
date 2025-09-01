const { google } = require('googleapis');
const path = require('path');

// Import credentials and token
const credentials = require('../config/oauth2-credentials');
const token = require('../config/oauth2-token');

// Extract client details
const { clientId, clientSecret, redirectUris } = credentials;

// Create OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUris[0] // must match redirect URI in Google Console
);

function mapTokenKeys(token) {
  if (!token) return null;
  return {
    access_token: token.access_token || token.accessToken,
    refresh_token: token.refresh_token || token.refreshToken,
    scope: token.scope,
    token_type: token.token_type || token.tokenType,
    expiry_date: token.expiry_date || token.expiryDate,
  };
}

// Load saved token if exists
const mappedToken = mapTokenKeys(token);

if (mappedToken && mappedToken.access_token && mappedToken.refresh_token) {
  oAuth2Client.setCredentials(mappedToken);
  console.log('✅ OAuth2 credentials set successfully!');
} else {
  console.log(
    '⚠️ No valid OAuth2 tokens found. Run getAccessToken() to generate them.'
  );
}

/**
 * Generate an auth URL (run this once if no token.js exists)
 */
async function getAccessToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
  });
  console.log('👉 Authorize this app by visiting:', authUrl);
}

/**
 * Handle Google OAuth2 callback and save token
 */
async function oauthCallback(req, res) {
  const code = req.query.code;
  if (!code) return res.send('❌ No code provided');

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Save tokens to your oauth2-token.js if needed
    // For security, better to store in DB or env var in production
    console.log('✅ OAuth token received:', tokens);

    res.send('🎉 Token stored successfully! You can close this tab.');
  } catch (err) {
    console.error('❌ Error retrieving access token:', err);
    res.status(500).send('Error retrieving access token: ' + err.message);
  }
}

module.exports = { oAuth2Client, getAccessToken, oauthCallback };
