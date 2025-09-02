const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const admin = require('firebase-admin');
const libre = require('libreoffice-convert');
const { print, getPrinters } = require('pdf-to-printer');
const util = require('util');

const db = admin.firestore();
libre.convertAsync = util.promisify(libre.convert);
libre._options = {
  executablePath: '/usr/lib/libreoffice/program/soffice',
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
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  // track files we create so we can cleanup even on error
  const createdFiles = [];

  try {
    console.log('printMultipleBonafide route hit');

    const PDFMerger = (await import('pdf-merger-js')).default;
    const ids = (req.query.ids || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!ids.length) return res.status(400).send('No document IDs provided');

    const merger = new PDFMerger();

    for (const docId of ids) {
      try {
        const docRef = db.collection('bonafideForms').doc(docId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
          console.warn(`Document ${docId} not found, skipping.`);
          continue;
        }

        const student = docSnap.data();
        const dateObj = student.date?.toDate
          ? student.date.toDate()
          : new Date(student.date || Date.now());
        const formattedDate = dateObj.toLocaleDateString('en-GB');
        const yearNow = new Date().getFullYear();
        const academicYear = `${yearNow}-${yearNow + 1}`;

        // Load template
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

        // Replace variables
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

        // Bold values
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

        // Convert to PDF
        const buf = newZip.generate({
          type: 'nodebuffer',
          compression: 'DEFLATE',
        });
        console.log(`Converting DOCX to PDF for: ${docId}`);
        const pdfBuf = await libre.convertAsync(buf, '.pdf', undefined);
        console.log('PDF conversion done for:', docId);

        const tempPath = path.join(tempDir, `${docId}.pdf`);
        fs.writeFileSync(tempPath, pdfBuf);
        createdFiles.push(tempPath);
        await merger.add(tempPath);
      } catch (innerErr) {
        console.error(`Error processing document ${docId}:`, innerErr);
        // continue processing other documents
      }
    }

    // Merge PDFs
    const mergedPath = path.join(tempDir, 'merged.pdf');
    await merger.save(mergedPath);
    // ensure we cleanup merged file too
    createdFiles.push(mergedPath);

    // --- Fetch printer name from Firestore (settings/printerConfig.printerName) ---
    const printerDoc = await db
      .collection('settings')
      .doc('printerConfig')
      .get();
    const printerName =
      printerDoc.exists && printerDoc.data()
        ? printerDoc.data().printerName || printerDoc.data().name
        : undefined;

    console.log('printer name :', printerName);

    if (!printerName) {
      // return a clear 400 so browser shows a helpful message (not just 500)
      return res
        .status(400)
        .json({
          error:
            'No printer configured in Firestore at settings/printerConfig.printerName',
        });
    }

    // Get available system printers
    let printers = [];
    try {
      printers = await getPrinters();
    } catch (gpErr) {
      console.error(
        'Failed to list local printers (getPrinters error):',
        gpErr
      );
      return res.status(500).json({
        error:
          'Unable to list system printers. Are you running in an environment with printers accessible?',
        details: gpErr.message,
      });
    }

    if (!printers || printers.length === 0) {
      return res.status(500).json({
        error:
          'No printers available on this machine. If you are running in a container/cloud (Render/Docker), local printers are not accessible.',
      });
    }

    // Find a case-insensitive match and use the actual system printer name for printing
    const match = printers.find(
      (p) =>
        p &&
        p.name &&
        p.name.trim().toLowerCase() === printerName.trim().toLowerCase()
    );

    if (!match) {
      // Provide list of available printers for debugging
      return res.status(400).json({
        error: `Printer "${printerName}" not found on this system.`,
        availablePrinters: printers.map((p) => p.name),
      });
    }

    // Print merged PDF using the exact system printer name
    try {
      await print(mergedPath, { printer: match.name });
      console.log(`Merged PDF printed successfully on "${match.name}"`);
    } catch (printErr) {
      console.error('Error printing PDF:', printErr);
      // bubble up as 500 because this is a runtime/OS-level failure
      return res
        .status(500)
        .json({
          error: 'Failed to send PDF to printer',
          details: printErr.message,
        });
    }

    // Success
    return res.send(
      `All Bonafide certificates processed and sent to printer "${match.name}".`
    );
  } catch (err) {
    console.error('Error generating/printing PDFs (outer):', err);
    return res
      .status(500)
      .send('Error generating/printing PDFs: ' + err.message);
  } finally {
    // Try best-effort cleanup of created files
    try {
      for (const f of createdFiles) {
        if (fs.existsSync(f)) {
          try {
            fs.unlinkSync(f);
          } catch (e) {
            console.warn('Could not delete temp file', f, e.message);
          }
        }
      }
    } catch (cleanupErr) {
      console.warn('Cleanup failed:', cleanupErr);
    }
  }
};
