const bcrypt = require('bcrypt');
const { v4: uuid } = require('uuid');

exports.sendVerificationMail = async (user, res, showPage = true) => {
  const unqiueString = uuid() + user._id;
  const verifications = new UserVer();
};
