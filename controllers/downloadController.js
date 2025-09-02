const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const admin = require('firebase-admin');
const libre = require('libreoffice-convert');
const { print } = require('pdf-to-printer');
const util = require('util');

const db = admin.firestore();
libre.convertAsync = util.promisify(libre.convert);
libre._options = {
  executablePath: '/usr/lib/libreoffice/program/soffice', // path inside your Docker container
};
// Helpers
const toUpper = (s) => (s ?? '').toString().trim().toUpperCase();
const capFirst = (s) =>
  s
    ? s.toString().trim().charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    : '';
const escapeXml = (str) =>
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
              if (/<w:b\/>/.test(inner)) return m;
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

exports.printMultipleBonafide = async (req, res) => {
  try {
    console.log('printMultipleBonafide route hit');

    const PDFMerger = (await import('pdf-merger-js')).default;
    const ids = (req.query.ids || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!ids.length) return res.status(400).send('No document IDs provided');

    const merger = new PDFMerger();
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    for (const docId of ids) {
      const docRef = db.collection('bonafideForms').doc(docId);
      const docSnap = await docRef.get();
      if (!docSnap.exists) continue;

      const student = docSnap.data();
      const dateObj = student.date?.toDate
        ? student.date.toDate()
        : new Date(student.date || Date.now());
      const formattedDate = dateObj.toLocaleDateString('en-GB');
      const yearNow = new Date().getFullYear();
      const academicYear = `${yearNow}-${yearNow + 1}`;

      // Load template from file system
      const templatePath = path.resolve(
        __dirname,
        '../templates/Bonafide_Certificate.docx'
      );
      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => '',
      });

      const transformed = {
        title: (student.title || '').trim(),
        name: toUpper(student.name),
        rollno: (student.rollno || '').trim(),
        relation: (student.relation || '').trim(),
        parentName: capFirst(student.parentName),
        year: (student.year ?? '').toString(),
        course: (student.course || '').trim(),
        branch: (student.branch || '').trim(),
        academicYear,
        certificateFor: (student.certificateFor || '').trim(),
        scholarshipType: (student.scholarshipType || '').trim(),
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

      console.log(`Converting DOCX to PDF for: ${docId}`);
      const pdfBuf = await libreConvert(buf, '.pdf', undefined);
      console.log('PDF conversion done for:', docId);

      const tempPath = path.join(tempDir, `${docId}.pdf`);
      fs.writeFileSync(tempPath, pdfBuf);
      await merger.add(tempPath);
    }

    const mergedPath = path.join(tempDir, 'merged.pdf');
    await merger.save(mergedPath);

    // Fetch printer from DB
    const printerDoc = await db.collection('settings').doc('printer').get();
    const printerName = printerDoc.exists ? printerDoc.data().name : undefined;

    if (!printerName) {
      throw new Error('No printer configured. Cannot print PDF.');
    }

    // Print PDF
    try {
      await print(mergedPath, { printer: printerName });
      console.log('Merged PDF printed successfully');
    } catch (printErr) {
      console.error('Error printing PDF:', printErr);
      throw new Error('Failed to print PDF: ' + printErr.message);
    }

    // Cleanup
    fs.readdirSync(tempDir).forEach((file) =>
      fs.unlinkSync(path.join(tempDir, file))
    );

    res.send('All Bonafide certificates processed successfully.');
  } catch (err) {
    console.error('Error generating/printing PDFs:', err.stack || err);
    res.status(500).send('Error generating/printing PDFs: ' + err.message);
  }
};
