const ejs = require('ejs');
const path = require('path');
const htmlPdf = require('html-pdf-node');
const wkhtmltopdfInstaller = require('wkhtmltopdf-installer');
const admin = require('firebase-admin');

const db = admin.firestore();
const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');

exports.downloadBonafide = async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',') : [];
    if (ids.length === 0)
      return res.status(400).send('No student IDs provided');

    const students = [];
    for (const id of ids) {
      const doc = await db.collection('bonafideForms').doc(id).get();
      if (doc.exists) students.push({ id: doc.id, ...doc.data() });
    }

    if (students.length === 0)
      return res.status(404).send('No valid student records found');

    // Render HTML for all students
    let allHtml = '';
    for (const s of students) {
      const certHtml = await ejs.renderFile(templatePath, { formData: s });
      allHtml += `<div style="page-break-after: always;">${certHtml}</div>`;
    }

    // Generate PDF using wkhtmltopdf installer
    const file = { content: allHtml };
    const options = {
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
      printBackground: true,
      executablePath: wkhtmltopdfInstaller.path, // THIS ensures Render works
    };

    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename=bonafide-multiple.pdf'
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send('Error generating PDF: ' + err.message);
  }
};
