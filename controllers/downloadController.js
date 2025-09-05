// controllers/downloadController.js
const admin = require('firebase-admin');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const path = require('path');

const db = admin.firestore();

exports.downloadBonafide = async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',') : [];
    if (ids.length === 0) {
      return res.status(400).send('No student IDs provided');
    }

    // Fetch student records
    const students = [];
    for (const id of ids) {
      const doc = await db.collection('bonafideForms').doc(id).get();
      if (doc.exists) students.push({ id: doc.id, ...doc.data() });
    }
    if (students.length === 0) {
      return res.status(404).send('No valid student records found');
    }

    // Render HTML for all students
    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
    let allHtml = '';
    for (const s of students) {
      const certHtml = await ejs.renderFile(templatePath, { formData: s });
      allHtml += `<div style="page-break-after: always;">${certHtml}</div>`;
    }

    // Launch Puppeteer (bundled Chromium)
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(allHtml, { waitUntil: 'networkidle0' });

    // Generate PDF
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });

    await browser.close();

    // Send PDF to client
    res.setHeader(
      'Content-Disposition',
      'inline; filename=bonafide-multiple.pdf'
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
  } catch (err) {
    console.error('Error generating multiple PDFs:', err);
    res.status(500).send('Error generating PDFs: ' + err.message);
  }
};
