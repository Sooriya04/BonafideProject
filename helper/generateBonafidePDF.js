const ejs = require('ejs');
const pdf = require('html-pdf');
const path = require('path');
const fs = require('fs');

async function generateBonafidePDF(formData) {
  try {
    console.log(
      'Starting PDF generation for student:',
      formData.id || formData.name
    );

    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
    console.log('Template path:', templatePath);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at: ${templatePath}`);
    }

    // Ensure formData has all required properties with defaults
    const dataWithDefaults = {
      date: new Date().toISOString().split('T')[0],
      ...formData,
    };

    const html = await ejs.renderFile(templatePath, {
      formData: dataWithDefaults,
    });
    console.log('EJS template rendered successfully');

    const pdfOptions = {
      format: 'A4',
      border: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
      phantomPath: require('phantomjs-prebuilt').path,
    };

    return new Promise((resolve, reject) => {
      pdf.create(html, pdfOptions).toBuffer((err, buffer) => {
        if (err) {
          console.error('Error creating PDF:', err);
          reject(err);
        } else {
          console.log(
            'PDF generated successfully, size:',
            buffer.length,
            'bytes'
          );
          resolve(buffer);
        }
      });
    });
  } catch (error) {
    console.error('Error in generateBonafidePDF:', error.message);
    throw error;
  }
}

module.exports = generateBonafidePDF;
