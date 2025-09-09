const ejs = require('ejs');
const path = require('path');
const pdf = require('html-pdf');
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

    // Generate PDF
    pdf
      .create(allHtml, {
        format: 'A4',
        border: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      })
      .toBuffer((err, buffer) => {
        if (err) {
          console.error('PDF generation error:', err);
          return res.status(500).send('Error generating PDF');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=bonafide.pdf');
        res.send(buffer);
      });
  } catch (err) {
    console.error('Error generating PDFs:', err);
    res.status(500).send('Error generating PDFs: ' + err.message);
  }
};
