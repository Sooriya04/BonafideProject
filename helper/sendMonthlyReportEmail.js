const transporter = require('./transporter');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function sendMonthlyReportEmail(filePath, start, end) {
  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: ADMIN_EMAIL,
    subject: `Monthly Bonafide Report (${start.toLocaleDateString(
      'en-GB'
    )} - ${end.toLocaleDateString('en-GB')})`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#333333; line-height:1.6; padding:20px; background-color:#ffffff; border-radius:10px; max-width:600px; margin:0 auto;">
        <p style="font-size:16px;">Hi Admin,</p>
        <p style="font-size:16px;">
          This is a monthly update for Bonafide submissions between 
          <strong>${start.toLocaleDateString('en-GB')}</strong> and 
          <strong>${end.toLocaleDateString('en-GB')}</strong>.
        </p>
        <p style="font-size:16px;">Regards,<br/>Student Portal</p>
      </div>

    `,
  };

  if (filePath) {
    mailOptions.attachments = [
      {
        filename: `Bonafide_Report_${
          start.getMonth() + 1
        }_${start.getFullYear()}.pdf`,
        path: filePath,
      },
    ];
  }

  return transporter.sendMail(mailOptions);
}

module.exports = { sendMonthlyReportEmail };
