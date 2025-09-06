const admin = require('firebase-admin');
const generateBonafidePDF = require('../helper/generateBonafidePDF');
const { PDFDocument } = require('pdf-lib');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  console.log('Firebase Admin initialized');
}

const db = admin.firestore();

exports.downloadBonafide = async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',') : [];
    if (!ids.length) {
      return res
        .status(400)
        .json({ success: false, error: 'No student IDs provided' });
    }

    const students = [];
    for (const id of ids) {
      const doc = await db.collection('bonafideForms').doc(id).get();
      if (doc.exists) {
        students.push({ id: doc.id, ...doc.data() });
      }
    }

    if (!students.length) {
      return res
        .status(404)
        .json({ success: false, error: 'No valid student records found' });
    }

    // Generate PDFs
    const pdfBuffers = [];
    for (const student of students) {
      try {
        const buffer = await generateBonafidePDF(student);
        pdfBuffers.push(buffer);
      } catch (err) {
        console.error(`PDF generation failed for ${student.id}:`, err.message);
      }
    }

    if (!pdfBuffers.length) {
      return res
        .status(500)
        .json({ success: false, error: 'Failed to generate any PDFs' });
    }

    // Merge PDFs
    const mergedPdf = await PDFDocument.create();
    for (const buf of pdfBuffers) {
      try {
        const pdf = await PDFDocument.load(buf);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((p) => mergedPdf.addPage(p));
      } catch (err) {
        console.error('Error merging PDF:', err.message);
      }
    }
    const finalBuffer = await mergedPdf.save();

    // Send as response
    res.setHeader(
      'Content-Disposition',
      'inline; filename="bonafide-certificates.pdf"'
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(finalBuffer));
  } catch (err) {
    console.error('Error in downloadBonafide:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
