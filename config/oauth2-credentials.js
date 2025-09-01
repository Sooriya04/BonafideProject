module.exports = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  projectId: process.env.PROJECT_ID,
  authUri: 'https://accounts.google.com/o/oauth2/auth',
  tokenUri: 'https://oauth2.googleapis.com/token',
  authProviderCertUrl: 'https://www.googleapis.com/oauth2/v1/certs',
  redirectUris: process.env.REDIRECT_URIS
    ? process.env.REDIRECT_URIS.split(',')
    : ['http://localhost:3000/oauth2callback'],
  javascriptOrigins: process.env.JS_ORIGINS
    ? process.env.JS_ORIGINS.split(',')
    : ['http://localhost:3000'],
};
