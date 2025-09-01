const fs = require('fs');
const PDFDocument = require('pdfkit');

async function generateBonafideReport(filePath, start, end, data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Title
      doc.fontSize(18).text('Monthly Bonafide Report', { align: 'center' });
      doc.moveDown(0.8);
      doc
        .fontSize(12)
        .text(
          `Report for: ${start.toLocaleDateString(
            'en-GB'
          )} - ${end.toLocaleDateString('en-GB')}`,
          { align: 'center', lineGap: 4 }
        );
      doc.moveDown(2); // more space before table

      // Table configuration
      const tableTop = 150; // shifted slightly down
      const itemHeight = 28; // more spacing between rows

      const columns = [
        { label: 'S.No', property: 'sno', width: 40 },
        { label: 'Name', property: 'name', width: 120 },
        { label: 'Roll No', property: 'rollno', width: 80 },
        { label: 'Dept', property: 'branch', width: 120 },
        { label: 'Year', property: 'year', width: 50 },
        { label: 'Certificate For', property: 'certificateFor', width: 150 },
      ];

      // Draw table headers
      let x = doc.page.margins.left;
      columns.forEach((col) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .text(col.label, x + 2, tableTop, {
            width: col.width - 4,
            align: 'left',
            lineGap: 3,
          });
        x += col.width;
      });

      // Header line
      doc
        .moveTo(doc.page.margins.left, tableTop + itemHeight - 6)
        .lineTo(
          doc.page.width - doc.page.margins.right,
          tableTop + itemHeight - 6
        )
        .stroke();

      // Draw rows
      let y = tableTop + itemHeight;
      data.forEach((entry, idx) => {
        x = doc.page.margins.left;
        const row = {
          sno: idx + 1,
          name: entry.name,
          rollno: entry.rollno,
          branch: entry.branch,
          year: entry.year,
          certificateFor: entry.certificateFor,
        };

        columns.forEach((col) => {
          doc
            .font('Helvetica')
            .fontSize(10)
            .text(row[col.property], x + 2, y, {
              width: col.width - 4,
              align: 'left',
              lineGap: 2, // spacing for wrapped text
            });
          x += col.width;
        });

        y += itemHeight;

        // Page overflow check
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 50;
        }
      });

      doc.end();

      stream.on('finish', () => resolve(filePath));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateBonafideReport };
