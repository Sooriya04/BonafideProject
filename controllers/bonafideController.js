const { db } = require('../config/firebase');
const generateBonafidePDF = require('../helper/generateBonafidePDF');
const {
  createFolderIfNotExists,
  uploadFile,
} = require('../helper/uploadToDrive');
const {
  sendBonafideNotification,
} = require('../helper/sendBonafideNotification');

exports.getForm = (req, res) => {
  const formData = req.session.bonafideData || {};
  res.render('bonafide', { formData });
};

exports.postForm = (req, res) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;

  const formData = {
    title: req.body.title.toUpperCase(),
    name: req.body.name,
    rollno: req.body.rollno,
    relation: req.body.relation,
    parentName: req.body.parentName.toUpperCase(),
    year: req.body.year,
    course: req.body.course,
    branch: req.body.branch,
    certificateFor: req.body.certificateFor,
    scholarshipType: req.body.scholarshipType || '',
    date: req.body.date,
    academicYear: `${currentYear}-${nextYear}`,
  };

  req.session.bonafideData = formData;
  res.render('preview', { formData });
};

exports.confirmForm = async (req, res) => {
  const finalData = req.session.bonafideData;
  if (!finalData) return res.redirect('/bonafide');

  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    finalData.academicYear = `${currentYear}-${nextYear}`;

    // Save form data to Firestore
    await db.collection('bonafideForms').add({
      ...finalData,
      createdAt: new Date(),
    });

    // Generate PDF buffer
    const buffer = await generateBonafidePDF(finalData);

    // Upload to Google Drive
    const folderName = now.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    const folderId = await createFolderIfNotExists(folderName);
    const fileName = `${String(now.getDate()).padStart(2, '0')}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${now.getFullYear()}-bonafide-certificate-${
      finalData.rollno
    }.pdf`;

    await uploadFile(buffer, fileName, folderId);
    await sendBonafideNotification(finalData, buffer, fileName);

    req.session.bonafideData = null;
    res.render('success', { name: finalData.name });
  } catch (err) {
    console.error('Error saving form or generating PDF:', err);
    res.status(500).send('Error saving form or generating PDF.');
  }
};
