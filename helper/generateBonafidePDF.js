const ejs = require('ejs');
const path = require('path');
const wkhtmltopdf = require('wkhtmltopdf');
const wkhtmltopdfInstaller = require('wkhtmltopdf-installer');

async function generateBonafidePDF(formData) {
  const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
  const html = await ejs.renderFile(templatePath, { formData });

  return new Promise((resolve, reject) => {
    const chunks = [];
    wkhtmltopdf(html, {
      binary: wkhtmltopdfInstaller.path,
      pageSize: 'A4',
      marginTop: '20mm',
      marginBottom: '20mm',
      marginLeft: '20mm',
      marginRight: '20mm',
      printMediaType: true,
    })
      .on('data', (chunk) => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks)))
      .on('error', reject);
  });
}

module.exports = generateBonafidePDF;
