const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// Render admin settings page
router.get('/settings', async (req, res) => {
  try {
    const doc = await db.collection('settings').doc('printerConfig').get();
    const printerName = doc.exists ? doc.data().printerName : '';
    res.render('admin-settings', { printerName });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading settings');
  }
});

// Update printer name
router.post('/settings', async (req, res) => {
  try {
    const { printerName } = req.body;
    await db
      .collection('settings')
      .doc('printerConfig')
      .set({ printerName }, { merge: true });
    res.redirect('/admin/settings');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving settings');
  }
});

module.exports = router;
