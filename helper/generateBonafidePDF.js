const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const pdf = require('html-pdf-node'); // use html-pdf-node

async function generateBonafidePDF(formData) {
  try {
    console.log('Generating Bonafide PDF for:', formData.name || formData.id);

    const templatePath = path.join(__dirname, '../views/bonafideTemplate.ejs');
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at: ${templatePath}`);
    }

    // Ensure defaults
    const dataWithDefaults = {
      date: new Date().toISOString().split('T')[0],
      title: formData.title || 'Mr.',
      name: formData.name || '---',
      rollno: formData.rollno || '---',
      relation: formData.relation || 'S/o',
      parentName: formData.parentName || '---',
      year: formData.year || 'III',
      course: formData.course || 'B.E',
      branch: formData.branch || 'Electronics and Communication Engineering',
      certificateFor: formData.certificateFor || 'Scholarship',
      scholarshipType: formData.scholarshipType || '',
    };

    // Render HTML
    const html = await ejs.renderFile(templatePath, {
      formData: dataWithDefaults,
    });

    // Options
    const options = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    };

    // Generate PDF
    const file = { content: html };
    const pdfBuffer = await pdf.generatePdf(file, options);

    return pdfBuffer;
  } catch (error) {
    console.error('Error in generateBonafidePDF:', error.message);
    throw error;
  }
}

module.exports = generateBonafidePDF;
