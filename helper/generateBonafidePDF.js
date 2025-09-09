const ejs = require('ejs');
const path = require('path');
const pdf = require('html-pdf');

async function generateBonafidePDF(formData) {
  try {
    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
    const html = await ejs.renderFile(templatePath, { formData });

    return new Promise((resolve, reject) => {
      pdf
        .create(html, {
          format: 'A4',
          border: {
            top: '20mm',
            bottom: '20mm',
            left: '20mm',
            right: '20mm',
          },
          type: 'pdf',
        })
        .toBuffer((err, buffer) => {
          if (err) return reject(err);
          resolve(buffer);
        });
    });
  } catch (err) {
    console.error('PDF generation error in generateBonafidePDF:', err);
    throw err;
  }
}

module.exports = generateBonafidePDF;
