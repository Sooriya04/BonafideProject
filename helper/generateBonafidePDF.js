const ejs = require('ejs');
const puppeteer = require('puppeteer');
const path = require('path');

async function generateBonafidePDF(formData) {
  let browser = null;

  try {
    console.log(
      'Starting PDF generation for student:',
      formData.id || formData.name
    );

    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
    console.log('Template path:', templatePath);

    // Check if template exists
    const fs = require('fs');
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at: ${templatePath}`);
    }

    const html = await ejs.renderFile(templatePath, { formData });
    console.log('EJS template rendered successfully');

    // Puppeteer launch options for Render
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
      ],
    };

    // Use system Chrome on Render, fallback to bundled Chromium locally
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      console.log(
        'Using system Chrome at:',
        process.env.PUPPETEER_EXECUTABLE_PATH
      );
    } else {
      console.log('Using bundled Chromium');
    }

    browser = await puppeteer.launch(launchOptions);
    console.log('Browser launched successfully');

    const page = await browser.newPage();

    // Set longer timeouts for Render
    await page.setDefaultNavigationTimeout(60000);
    await page.setDefaultTimeout(30000);

    console.log('Setting page content...');
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    // Wait a bit more for stability
    await page.waitForTimeout(2000);

    console.log('Generating PDF...');
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      timeout: 60000,
    });

    console.log('PDF generated successfully, size:', buffer.length, 'bytes');
    return buffer;
  } catch (error) {
    console.error('Error in generateBonafidePDF:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed successfully');
      } catch (closeError) {
        console.error('Error closing browser:', closeError.message);
      }
    }
  }
}

module.exports = generateBonafidePDF;
