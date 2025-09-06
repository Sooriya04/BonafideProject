const ejs = require('ejs');
const pdf = require('html-pdf');
const path = require('path');
const fs = require('fs');
const phantomPath = require('phantomjs-prebuilt').path;

async function generateBonafidePDF(formData) {
  try {
    console.log('Generating Bonafide PDF for:', formData.name || formData.id);

    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at: ${templatePath}`);
    }

    // Normalize fields with sensible defaults
    const dataWithDefaults = {
      certificateNo: formData.certificateNo || 'No.D/2025',
      date: formData.date || new Date().toISOString().split('T')[0],
      name: formData.name || '---',
      rollNo: formData.rollNo || '---',
      fatherName: formData.fatherName || '---',
      course: formData.course || '---',
      year: formData.year || '---',
      academicYear: formData.academicYear || '2025-2026',
      purpose: formData.purpose || 'Scholarship',
    };

    const html = await ejs.renderFile(templatePath, {
      formData: dataWithDefaults,
    });

    const pdfOptions = {
      format: 'A4',
      border: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
      phantomPath,
    };

    return new Promise((resolve, reject) => {
      pdf.create(html, pdfOptions).toBuffer((err, buffer) => {
        if (err) {
          console.error('Error creating PDF:', err);
          return reject(err);
        }
        resolve(buffer);
      });
    });
  } catch (error) {
    console.error('Error in generateBonafidePDF:', error.message);
    throw error;
  }
}

module.exports = generateBonafidePDF;
