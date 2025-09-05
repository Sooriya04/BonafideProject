const admin = require('firebase-admin');
const generateBonafidePDF = require('../helper/generateBonafidePDF');
const { PDFDocument } = require('pdf-lib');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

exports.downloadBonafide = async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',') : [];

    if (!ids.length) {
      return res.status(400).json({
        success: false,
        error: 'No student IDs provided',
      });
    }

    console.log('Processing IDs:', ids);

    // Fetch student records from Firestore
    const students = [];
    const batchSize = 5; // Process in batches to avoid memory issues

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const promises = batch.map(async (id) => {
        try {
          const doc = await db.collection('bonafideForms').doc(id).get();
          if (doc.exists) {
            return { id: doc.id, ...doc.data() };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching document ${id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      students.push(...results.filter((student) => student !== null));
    }

    if (!students.length) {
      return res.status(404).json({
        success: false,
        error: 'No valid student records found',
      });
    }

    console.log(`Found ${students.length} valid student records`);

    // Generate PDFs in batches
    const pdfBuffers = [];

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const batchPromises = batch.map(async (student) => {
        try {
          console.log(`Generating PDF for student: ${student.id}`);
          const buffer = await generateBonafidePDF(student);
          return buffer;
        } catch (err) {
          console.error(`Error generating PDF for student ${student.id}:`, err);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      pdfBuffers.push(...batchResults.filter((buffer) => buffer !== null));
    }

    if (!pdfBuffers.length) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate any PDFs',
      });
    }

    console.log(`Successfully generated ${pdfBuffers.length} PDFs`);

    // Merge PDFs
    const mergedPdf = await PDFDocument.create();

    for (const [index, buf] of pdfBuffers.entries()) {
      try {
        const pdf = await PDFDocument.load(buf);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        console.log(`Merged PDF ${index + 1}/${pdfBuffers.length}`);
      } catch (err) {
        console.error('Error merging PDF:', err);
      }
    }

    const finalBuffer = await mergedPdf.save();

    // Send response
    res.setHeader(
      'Content-Disposition',
      'inline; filename="bonafide-certificates.pdf"'
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', finalBuffer.length);

    res.send(Buffer.from(finalBuffer));

    console.log('PDF generation completed successfully');
  } catch (err) {
    console.error('Error in downloadBonafide:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Something went wrong',
    });
  }
};
