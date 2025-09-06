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

    // Render the EJS template into HTML
    const html = await ejs.renderFile(templatePath, { formData });

    // Generate PDF without custom options
    return new Promise((resolve, reject) => {
      pdf.create(html).toBuffer((err, buffer) => {
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
