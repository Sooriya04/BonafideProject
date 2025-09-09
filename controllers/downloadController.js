const admin = require('firebase-admin');
const ejs = require('ejs');
const path = require('path');
const wkhtmltopdf = require('wkhtmltopdf');
const wkhtmltopdfInstaller = require('wkhtmltopdf-installer');

const db = admin.firestore();

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

    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
    let allHtml = '';
    for (const s of students) {
      const certHtml = await ejs.renderFile(templatePath, { formData: s });
      allHtml += `<div style="page-break-after: always;">${certHtml}</div>`;
    }

    const pdfBuffer = await new Promise((resolve, reject) => {
      wkhtmltopdf(allHtml, {
        binary: wkhtmltopdfInstaller.path,
        pageSize: 'A4',
        marginTop: '20mm',
        marginBottom: '20mm',
        marginLeft: '20mm',
        marginRight: '20mm',
        printMediaType: true,
      })
        .on('data', (chunk) => chunks.push(chunk))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', reject);

      const chunks = [];
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename=bonafide-multiple.pdf'
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    if (!res.headersSent) res.status(500).send('Error generating PDF');
    else res.end();
  }
};
