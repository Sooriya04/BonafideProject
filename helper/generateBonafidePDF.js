// helper/generateBonafidePDF.js
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const pdf = require('html-pdf');

async function generateBonafidePDF(formData) {
  const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found at: ${templatePath}`);
  }

  const html = await ejs.renderFile(templatePath, { formData });

  const pdfOptions = {
    format: 'A4',
    border: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
  };

  return new Promise((resolve, reject) => {
    pdf.create(html, pdfOptions).toBuffer((err, buffer) => {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
}

module.exports = generateBonafidePDF;
