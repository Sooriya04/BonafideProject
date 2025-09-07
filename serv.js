const generateBonafidePDF = require('./helper/generateBonafidePDF');
const fs = require('fs');
const formData = {
  title: 'Ms.',
  name: 'Janani',
  rollno: '660922',
  relation: 'D/o',
  parentName: 'BALA',
  year: 'III',
  course: 'B.Tech',
  branch: 'Information Technology',
  academicYear: '2025-2026',
  certificateFor: 'VISA',
  date: '2025-09-17',
};

generateBonafidePDF(formData)
  .then((pdfBuffer) => {
    // Save the PDF or send it as response
    fs.writeFileSync(`${formData.rollno}bonafide_certificate.pdf`, pdfBuffer);
  })
  .catch((error) => {
    console.error('Failed to generate PDF:', error);
  });
