require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const { google } = require('googleapis');
const fs = require('fs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const sessionMiddleware = require('./middleware/sessionConfig');
app.use(sessionMiddleware);

const reportRoutes = require('./routes/report.Route');
app.use('/', reportRoutes);

const { scheduleMonthlyReportJob } = require('./jobs/monthlyReportJob');
scheduleMonthlyReportJob();

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const bonafideRoutes = require('./routes/bonafideRoutes');
app.use('/bonafide', bonafideRoutes);

const download = require('./routes/downloadRoutes');
app.use(download);

const adminRoutes = require('./routes/adminRoutes');
app.use('/', adminRoutes);

const oauth2Route = require('./routes/oauth2Routes');
app.use('/', oauth2Route);

const adminRouter = require('./routes/adminSettings');
app.use('/admin', adminRouter);

app.get('/', (req, res) => {
  if (req.session?.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin');
    return res.redirect('/bonafide');
  }
  return res.redirect('/auth/login');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});
app.use((req, res, next) => {
  res.status(404).render('error');
});

app.use((err, req, res, next) => {
  console.error(`ERROR : ${err.stack}`);
  res.status(500).send('something is broken');
});

module.exports = app;
