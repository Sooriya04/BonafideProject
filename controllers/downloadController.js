const ejs = require('ejs');
const path = require('path');
const wkhtmltopdf = require('wkhtmltopdf');
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

    let allHtml = '';
    for (const s of students) {
      const certHtml = await ejs.renderFile(templatePath, { formData: s });
      allHtml += `<div style="page-break-after: always;">${certHtml}</div>`;
    }

    // Generate PDF buffer
    const pdfBuffer = await new Promise((resolve, reject) => {
      wkhtmltopdf(
        allHtml,
        {
          output: '-', // stream to buffer
          pageSize: 'A4',
          marginTop: '20mm',
          marginBottom: '20mm',
          marginLeft: '20mm',
          marginRight: '20mm',
          executablePath: wkhtmltopdfInstaller.path,
        },
        (err, stream) => {
          if (err) return reject(err);
          const chunks = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
        }
      );
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=bonafide.pdf');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send('Error generating PDF: ' + err.message);
  }
};
