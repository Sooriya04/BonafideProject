const ejs = require('ejs');
const path = require('path');
const htmlPdf = require('html-pdf-node');

async function generateBonafidePDF(formData) {
  const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
  const html = await ejs.renderFile(templatePath, { formData });

  const file = { content: html };
  const options = {
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    printBackground: true,
  };

  const pdfBuffer = await htmlPdf.generatePdf(file, options);
  return pdfBuffer;
}

module.exports = generateBonafidePDF;
