const admin = require('firebase-admin');
const ejs = require('ejs');
const path = require('path');
const wkhtmltopdf = require('wkhtmltopdf');
const { Readable } = require('stream');

const db = admin.firestore();

exports.downloadBonafide = async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',') : [];
    if (ids.length === 0) {
      return res.status(400).send('No student IDs provided');
    }

    const students = [];
    for (const id of ids) {
      const doc = await db.collection('bonafideForms').doc(id).get();
      if (doc.exists) students.push({ id: doc.id, ...doc.data() });
    }
    if (students.length === 0) {
      return res.status(404).send('No valid student records found');
    }

    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
    let allHtml = `
      <html>
        <head>
          <style>
            @page { size: A4; margin: 20mm; }
            .page { page-break-after: always; }
            .page:last-child { page-break-after: auto; }
          </style>
        </head>
        <body>
    `;

    for (const s of students) {
      const certHtml = await ejs.renderFile(templatePath, { formData: s });
      allHtml += `<div class="page">${certHtml}</div>`;
    }

    allHtml += `</body></html>`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename=bonafide-multiple.pdf'
    );

    wkhtmltopdf(allHtml, {
      pageSize: 'A4',
      marginTop: '20mm',
      marginRight: '20mm',
      marginBottom: '20mm',
      marginLeft: '20mm',
      printMediaType: true,
    }).pipe(res);
  } catch (err) {
    console.error('Error generating multiple PDFs:', err);
    res.status(500).send('Error generating PDFs: ' + err.message);
  }
};
