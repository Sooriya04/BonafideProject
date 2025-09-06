const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const pdf = require('html-pdf');

async function generateBonafidePDF(formData) {
  try {
    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at: ${templatePath}`);
    }

    // Set default values for required fields
    const dataWithDefaults = {
      documentNumber: '2025',
      academicYear: '2025-2026',
      ...formData,
    };

    // Render the EJS template into HTML
    const html = await ejs.renderFile(templatePath, {
      formData: dataWithDefaults,
    });

    // PDF options for better formatting
    const pdfOptions = {
      format: 'A4',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    };

    // Generate PDF with options
    return new Promise((resolve, reject) => {
      pdf.create(html, pdfOptions).toBuffer((err, buffer) => {
        if (err) return reject(err);
        resolve(buffer);
      });
    });
  } catch (error) {
    console.error('Error generating Bonafide PDF:', error);
    throw error;
  }
}

module.exports = generateBonafidePDF;
