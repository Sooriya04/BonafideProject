const ejs = require('ejs');
const path = require('path');
const htmlPdf = require('html-pdf-node');
const wkhtmltopdfInstaller = require('wkhtmltopdf-installer');

const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');

exports.downloadBonafide = async (req, res) => {
  try {
    const studentId = req.query.id;
    if (!studentId) return res.status(400).send('No ID provided');

    // Example: fetch student from DB
    const student = await db.collection('bonafideForms').doc(studentId).get();
    if (!student.exists) return res.status(404).send('Student not found');

    const html = await ejs.renderFile(templatePath, {
      formData: student.data(),
    });

    const file = { content: html };
    const options = {
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
      printBackground: true,
      executablePath: wkhtmltopdfInstaller.path,
    };

    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename=bonafide-${studentId}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send('Error generating PDF');
  }
};
