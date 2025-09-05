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

    const html = await ejs.renderFile(templatePath, { formData });
    console.log('EJS template rendered successfully');

    // Create PDF from HTML
    const pdfOptions = {
      format: 'A4',
      orientation: 'portrait',
      border: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      quality: '100',
      timeout: 60000,
      // Additional options for better rendering
      phantomPath: require('phantomjs-prebuilt').path, // For Render compatibility
      childProcessOptions: {
        env: {
          ...process.env,
          OPENSSL_CONF: '/dev/null', // Fix for some SSL issues
        },
      },
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
