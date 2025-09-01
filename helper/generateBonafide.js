const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Helper functions
const toUpper = (s) => (s ?? '').toString().trim().toUpperCase();
const capFirst = (s) => {
  if (!s) return '';
  const t = s.toString().trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
};
const escapeXml = (str = '') =>
  str
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

function forceBoldForValuesInDocxZip(zip, values = []) {
  try {
    const file = zip.file('word/document.xml');
    if (!file) return;
    let xml = file.asText();

    values.forEach((rawVal) => {
      if (!rawVal) return;
      const val = escapeXml(rawVal);

      const runRegex = new RegExp(
        `<w:r([^>]*)>([\\s\\S]*?)<w:t[^>]*>${val}</w:t>([\\s\\S]*?)</w:r>`,
        'g'
      );

      xml = xml.replace(runRegex, (match, rAttrs, beforeT, afterT) => {
        if (/<w:rPr[\s\S]*?>[\s\S]*?<\/w:rPr>/.test(beforeT)) {
          beforeT = beforeT.replace(
            /(<w:rPr[\s\S]*?>)([\s\S]*?)(<\/w:rPr>)/,
            (m, open, inner, close) => {
              if (/<w:b\/>/.test(inner)) return m; // already bold
              return `${open}<w:b/>${inner}${close}`;
            }
          );
          return `<w:r${rAttrs}>${beforeT}<w:t>${val}</w:t>${afterT}</w:r>`;
        } else {
          return `<w:r${rAttrs}><w:rPr><w:b/></w:rPr>${beforeT}<w:t>${val}</w:t>${afterT}</w:r>`;
        }
      });
    });

    zip.file('word/document.xml', xml);
  } catch (e) {
    console.error('forceBoldForValuesInDocxZip error:', e);
  }
}

// Main function
async function generateBonafide(student) {
  const dateObj = student.date?.toDate
    ? student.date.toDate()
    : new Date(student.date || Date.now());
  const formattedDate = dateObj.toLocaleDateString('en-GB');
  const yearNow = new Date().getFullYear();
  const academicYear = `${yearNow}-${yearNow + 1}`;

  const templatePath = path.resolve(
    __dirname,
    '../templates/Bonafide_Certificate.docx'
  );
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter() {
      return '';
    },
  });

  const transformed = {
    title: (student.title || '').toString().trim(),
    name: toUpper(student.name),
    rollno: (student.rollno || '').toString().trim(),
    relation: (student.relation || '').toString().trim(),
    parentName: capFirst(student.parentName),
    year: (student.year ?? '').toString(),
    course: (student.course || '').toString().trim(),
    branch: (student.branch || '').toString().trim(),
    academicYear: academicYear,
    certificateFor: (student.certificateFor || '').toString().trim(),
    scholarshipType: (student.scholarshipType || '').toString().trim(),
    date: formattedDate,
  };

  doc.render(transformed);

  const boldValues = [
    transformed.name,
    transformed.title,
    transformed.rollno,
    transformed.course,
    transformed.year,
    transformed.academicYear,
  ];

  const newZip = doc.getZip();
  forceBoldForValuesInDocxZip(newZip, boldValues);

  const buf = newZip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return { buffer: buf, transformed };
}

module.exports = generateBonafide;
