const ejs = require('ejs');
const path = require('path');
const wkhtmltopdf = require('wkhtmltopdf');
const { promisify } = require('util');

const wkhtmltopdfAsync = promisify(wkhtmltopdf);

async function generateBonafidePDF(formData) {
  const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
  const html = await ejs.renderFile(templatePath, { formData });

  const buffer = await wkhtmltopdfAsync(html, {
    pageSize: 'A4',
    marginTop: '20mm',
    marginRight: '20mm',
    marginBottom: '20mm',
    marginLeft: '20mm',
    printMediaType: true,
  });

  return buffer;
}

module.exports = generateBonafidePDF;
