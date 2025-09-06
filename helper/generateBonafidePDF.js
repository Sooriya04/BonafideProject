const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

async function generateBonafidePDF(formData) {
  try {
    console.log('Generating Bonafide PDF for:', formData.name || formData.id);

    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at: ${templatePath}`);
    }

    // Normalize fields
    const dataWithDefaults = {
      date: new Date().toISOString().split('T')[0],
      title: formData.title,
      name: formData.name,
      rollno: formData.rollno,
      relation: formData.relation,
      parentName: formData.parentName,
      year: formData.year,
      course: formData.course,
      branch: formData.branch,
      certificateFor: formData.certificateFor,
      scholarshipType: formData.scholarshipType || '',
    };

    const html = await ejs.renderFile(templatePath, {
      formData: dataWithDefaults,
    });

    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Load HTML into the page
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error('Error in generateBonafidePDF:', error.message);
    throw error;
  }
}

module.exports = generateBonafidePDF;
