// config.js
module.exports = {
  accessToken: process.env.access_token,
  refreshToken: process.env.refresh_token,
  scope: process.env.scope,
  tokenType: process.env.token_type || 'Bearer',
  expiryDate: process.env.expiry_date,
};
