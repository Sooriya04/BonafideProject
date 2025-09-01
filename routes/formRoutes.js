const express = require('express');
const router = express.Router();

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
}

router.get('/', isAuthenticated, (req, res) => {
  res.render('form', { formData: null });
});

router.post('/', isAuthenticated, (req, res) => {
  req.session.formData = req.body;

  console.log('Form submitted data:', req.body);

  res.redirect('/preview');
});

module.exports = router;
