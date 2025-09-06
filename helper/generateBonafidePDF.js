const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const pdf = require('html-pdf-node');

async function generateBonafidePDF(formData) {
  try {
    console.log('Generating Bonafide PDF for:', formData.name || formData.id);

    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at: ${templatePath}`);
    }

    // Render the HTML with only the provided formData (no defaults)
    const html = await ejs.renderFile(templatePath, { formData });

    const file = { content: html };
    const options = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    };

    const pdfBuffer = await pdf.generatePdf(file, options);
    return pdfBuffer;
  } catch (error) {
    console.error('Error in generateBonafidePDF:', error.message);
    throw error;
  }
}

module.exports = generateBonafidePDF;
