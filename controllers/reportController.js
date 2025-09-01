const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');
const { sendMonthlyReportEmail } = require('../helper/sendMonthlyReportEmail');
const { generateBonafideReport } = require('../utils/monthlyReport');

const db = admin.firestore();

const generateMonthlyReport = async (req, res) => {
  try {
    const [year, month] = req.params.monthYear.split('-').map(Number);

    if (!year || !month || month < 1 || month > 12) {
      return res
        .status(400)
        .send('Invalid format. Use YYYY-MM (e.g., 2025-07).');
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    // 📂 Reports dir
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

    const filePath = path.join(
      reportsDir,
      `Bonafide_Report_${month}_${year}.pdf`
    );

    // 🔹 Fetch data from Firestore between start & end
    const snap = await db
      .collection('bonafideForms')
      .where('date', '>=', start.toISOString())
      .where('date', '<=', end.toISOString())
      .get();

    if (snap.empty) {
      return res.status(404).send('No submissions found for this month.');
    }

    const students = snap.docs.map((doc) => doc.data());

    await generateBonafideReport(filePath, start, end, students)
      .then(() => console.log('Report generated successfully'))
      .catch((err) =>
        console.log('Error while creating the bonafide report: ' + err.message)
      );

    await sendMonthlyReportEmail(filePath, start, end)
      .then(() => console.log('Report emailed successfully'))
      .catch((err) =>
        console.log('Error while sending the report email: ' + err.message)
      );

    res.send(`📧 Report for ${month}/${year} generated & sent to admin.`);
  } catch (err) {
    console.error('Error sending report:', err.message);
    res.status(500).send('Failed to generate and send monthly report.');
  }
};

module.exports = { generateMonthlyReport };
