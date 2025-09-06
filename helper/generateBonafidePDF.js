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
    border: {
      top: '15mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm',
    },
    footer: {
      height: '10mm',
    },
    header: {
      height: '10mm',
    },
  };

  return new Promise((resolve, reject) => {
    pdf.create(html, pdfOptions).toBuffer((err, buffer) => {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
}

module.exports = generateBonafidePDF;
