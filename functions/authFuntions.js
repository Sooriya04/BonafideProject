const { db } = require('../config/firebase');

async function findUserByEmail(email) {
  const snap = await db
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0];
}

async function findPendingUsersByEmail(email) {
  const snap = await db
    .collection('pendingUsers')
    .where('email', '==', email)
    .get();
  return snap.empty ? [] : snap.docs;
}

async function addPendingUser(name, email, passwordHash, tokenHash, expireAt) {
  return db.collection('pendingUsers').add({
    name,
    email,
    passwordHash,
    tokenHash,
    createdAt: new Date(),
    expireAt,
  });
}

async function addUser(name, email, passwordHash) {
  return db.collection('users').add({
    name,
    email,
    password: passwordHash,
    verified: true,
    createdAt: new Date(),
  });
}

async function deletePendingUser(docRef) {
  return docRef.delete();
}

module.exports = {
  findUserByEmail,
  findPendingUsersByEmail,
  addPendingUser,
  addUser,
  deletePendingUser,
};
