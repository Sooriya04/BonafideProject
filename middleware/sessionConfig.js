const session = require('express-session');
const { FirestoreStore } = require('@google-cloud/connect-firestore');
const { db } = require('../config/firebase'); // import db from firebase.js

const sessionMiddleware = session({
  store: new FirestoreStore({
    dataset: db, // use the db instance
    kind: 'sessions', // collection name
  }),
  secret: 'supersecretkey', // constant secret
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
  },
});

module.exports = sessionMiddleware;
