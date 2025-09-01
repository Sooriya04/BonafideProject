const cron = require('node-cron');
const { generateMonthlyReport } = require('../utils/monthlyReport');

function scheduleMonthlyReportJob() {
  cron.schedule('5 0 1 * *', async () => {
    console.log('Running monthly bonafide report job...');
    try {
      await generateMonthlyReport();
      console.log('Monthly report generated and sent to admin.');
    } catch (err) {
      console.error('Monthly report job failed:', err.message);
    }
  });
}

module.exports = { scheduleMonthlyReportJob };
