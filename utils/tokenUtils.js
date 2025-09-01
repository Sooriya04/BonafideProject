const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
async function generateTokenAndHash() {
  const token = uuidv4();
  const tokenHash = await bcrypt.hash(token, 10);
  return { token, tokenHash };
}
async function compareToken(rawToken, hashedToken) {
  return bcrypt.compare(rawToken, hashedToken);
}
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  generateTokenAndHash,
  compareToken,
  hashPassword,
  comparePassword,
};
