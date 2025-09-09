const ejs = require('ejs');
const path = require('path');
const htmlPdf = require('html-pdf-node');
const wkhtmltopdfInstaller = require('wkhtmltopdf-installer');

async function generateBonafidePDF(formData) {
  try {
    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');

    // Render EJS template to HTML string
    const html = await ejs.renderFile(templatePath, { formData });

    // Make sure HTML is not empty
    if (!html || html.trim().length === 0) {
      throw new Error('Generated HTML is empty');
    }

    const file = { content: html };
    const options = {
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
      printBackground: true,
      executablePath: wkhtmltopdfInstaller.path, // ensures wkhtmltopdf binary
    };

    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    return pdfBuffer;
  } catch (err) {
    console.error('PDF generation error in generateBonafidePDF:', err);
    throw err;
  }
}

module.exports = generateBonafidePDF;
