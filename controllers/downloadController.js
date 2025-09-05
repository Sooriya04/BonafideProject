const admin = require('firebase-admin');
const generateBonafidePDF = require('../helper/generateBonafidePDF');
const { PDFDocument } = require('pdf-lib');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (firebaseError) {
    console.error('Firebase initialization error:', firebaseError);
  }
}

const db = admin.firestore();

exports.downloadBonafide = async (req, res) => {
  console.log('Download bonafide request received');

  try {
    const ids = req.query.ids ? req.query.ids.split(',') : [];

    if (!ids.length) {
      console.log('No IDs provided in request');
      return res.status(400).json({
        success: false,
        error: 'No student IDs provided',
      });
    }

    console.log('Processing IDs:', ids);

    // Fetch student records from Firestore
    const students = [];

    for (const id of ids) {
      try {
        console.log('Fetching document for ID:', id);
        const doc = await db.collection('bonafideForms').doc(id).get();

        if (doc.exists) {
          console.log('Document found for ID:', id);
          students.push({ id: doc.id, ...doc.data() });
        } else {
          console.log('Document not found for ID:', id);
        }
      } catch (error) {
        console.error(`Error fetching document ${id}:`, error.message);
      }
    }

    if (!students.length) {
      console.log('No valid student records found');
      return res.status(404).json({
        success: false,
        error: 'No valid student records found',
      });
    }

    console.log(`Found ${students.length} valid student records`);

    // Generate PDFs one by one with detailed logging
    const pdfBuffers = [];

    for (const student of students) {
      try {
        console.log(
          `Generating PDF for student: ${student.id || student.name}`
        );
        const buffer = await generateBonafidePDF(student);
        pdfBuffers.push(buffer);
        console.log(
          `PDF generated successfully for student: ${
            student.id || student.name
          }`
        );
      } catch (err) {
        console.error(
          `Error generating PDF for student ${student.id || student.name}:`,
          err.message
        );
        console.error('Full error:', err);
      }
    }

    if (!pdfBuffers.length) {
      console.log('All PDF generation attempts failed');
      return res.status(500).json({
        success: false,
        error: 'Failed to generate any PDFs. Check server logs for details.',
      });
    }

    console.log(`Successfully generated ${pdfBuffers.length} PDFs`);

    // Merge PDFs
    try {
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
          console.error('Error merging PDF:', err.message);
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
    } catch (mergeError) {
      console.error('Error merging PDFs:', mergeError.message);
      return res.status(500).json({
        success: false,
        error: 'Error merging PDFs',
      });
    }
  } catch (err) {
    console.error('Unexpected error in downloadBonafide:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Check server logs for details',
    });
  }
};
