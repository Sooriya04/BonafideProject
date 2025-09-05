const ejs = require('ejs');
const puppeteer = require('puppeteer');
const path = require('path');

async function generateBonafidePDF(formData) {
  let browser = null;

  try {
    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
    const html = await ejs.renderFile(templatePath, { formData });

    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });

    return buffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close().catch((error) => {
        console.error('Error closing browser:', error);
      });
    }
  }
}

module.exports = generateBonafidePDF;
