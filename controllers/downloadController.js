// controllers/downloadController.js
const admin = require('firebase-admin');
const path = require('path');
const generateBonafidePDF = require('../helper/generateBonafidePDF');

const db = admin.firestore();

exports.downloadBonafide = async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',') : [];
    if (!ids.length) return res.status(400).send('No student IDs provided');

    const students = [];
    for (const id of ids) {
      const doc = await db.collection('bonafideForms').doc(id).get();
      if (doc.exists) students.push({ id: doc.id, ...doc.data() });
    }
    if (!students.length) return res.status(404).send('No valid records found');

    // Generate PDF for each student and combine into one
    let allHtml = '';
    for (const student of students) {
      const templatePath = path.join(
        __dirname,
        '../views/bonafideTemplate.ejs'
      );
      const html = await generateBonafidePDF(student); // returns PDF buffer
      // Instead of merging buffers, we can render all HTML together
      const ejsHtml = await require('ejs').renderFile(templatePath, {
        formData: student,
      });
      allHtml += `<div style="page-break-after: always;">${ejsHtml}</div>`;
    }

    // Launch a single Puppeteer instance for all students
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(allHtml, { waitUntil: 'networkidle0' });

    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });

    await browser.close();

    // Send PDF
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
