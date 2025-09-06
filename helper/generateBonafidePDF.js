const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');

async function generateBonafidePDF(formData) {
  const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
  const html = await ejs.renderFile(templatePath, { formData });

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
}

module.exports = generateBonafidePDF;
