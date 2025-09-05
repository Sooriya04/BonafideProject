// controllers/downloadController.js
const admin = require('firebase-admin');
const generateBonafidePDF = require('../helper/generateBonafidePDF');
const { PDFDocument } = require('pdf-lib');

const db = admin.firestore();

exports.downloadBonafide = async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',') : [];
    if (!ids.length) return res.status(400).send('No student IDs provided');

    // Fetch student records from Firestore
    const students = [];
    for (const id of ids) {
      const doc = await db.collection('bonafideForms').doc(id).get();
      if (doc.exists) students.push({ id: doc.id, ...doc.data() });
    }

    if (!students.length)
      return res.status(404).send('No valid student records found');

    // Generate PDFs for each student
    const pdfBuffers = [];
    for (const student of students) {
      const buffer = await generateBonafidePDF(student);
      pdfBuffers.push(buffer);
    }

    // Merge PDFs using pdf-lib
    const mergedPdf = await PDFDocument.create();
    for (const buf of pdfBuffers) {
      const pdf = await PDFDocument.load(buf);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const finalBuffer = await mergedPdf.save();

    // Send merged PDF to client
    res.setHeader(
      'Content-Disposition',
      'inline; filename=bonafide-multiple.pdf'
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.send(finalBuffer);
  } catch (err) {
    console.error('Error generating multiple PDFs:', err);
    res.status(500).send('Error generating PDFs: ' + err.message);
  }
};
