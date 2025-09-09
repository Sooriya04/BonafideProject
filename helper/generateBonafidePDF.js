const ejs = require('ejs');
const path = require('path');
const wkhtmltopdf = require('wkhtmltopdf');
const { PassThrough } = require('stream');

async function generateBonafidePDF(formData) {
  try {
    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
    const html = await ejs.renderFile(templatePath, { formData });

    // Generate PDF buffer using wkhtmltopdf
    return new Promise((resolve, reject) => {
      const chunks = [];
      const stream = wkhtmltopdf(html, {
        pageSize: 'A4',
        marginTop: '20mm',
        marginBottom: '20mm',
        marginLeft: '20mm',
        marginRight: '20mm',
        printMediaType: true,
      });

      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));
    });
  } catch (err) {
    console.error('PDF generation error in generateBonafidePDF:', err);
    throw err;
  }
}

module.exports = generateBonafidePDF;
