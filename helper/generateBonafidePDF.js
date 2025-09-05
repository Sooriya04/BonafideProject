// helper/generateBonafidePDF.js
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const path = require('path');

async function generateBonafidePDF(formData) {
  // Render HTML from EJS template
  const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
  const html = await ejs.renderFile(templatePath, { formData });

  // Launch Puppeteer using system Chrome
  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
  });

  await browser.close();
  return buffer;
}

module.exports = generateBonafidePDF;
