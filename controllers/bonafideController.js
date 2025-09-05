const { db } = require('../config/firebase');
const {
  sendBonafideNotification,
} = require('../helper/sendBonafideNotification');
const generateBonafidePDF = require('../helper/generateBonafidePDF');
const {
  createFolderIfNotExists,
  uploadFile,
} = require('../helper/uploadToDrive');

exports.getForm = (req, res) => {
  const formData = req.session.bonafideData || {};
  res.render('bonafide', { formData });
};

exports.postForm = (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    const academicYear = `${currentYear}-${nextYear}`;

    const formData = {
      title: req.body.title,
      name: req.body.name,
      rollno: req.body.rollno,
      relation: req.body.relation,
      parentName: req.body.parentName,
      year: req.body.year,
      course: req.body.course,
      branch: req.body.branch,
      certificateFor: req.body.certificateFor,
      scholarshipType: req.body.scholarshipType || '',
      date: req.body.date,
      academicYear, // ✅ dynamic academic year
    };

    req.session.bonafideData = formData;
    res.render('preview', { formData });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing form');
  }
};

exports.confirmForm = async (req, res) => {
  const finalData = req.session.bonafideData;
  if (!finalData) return res.redirect('/bonafide');

  try {
    // ✅ recompute academic year to be safe
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    finalData.academicYear = `${currentYear}-${nextYear}`;

    await db.collection('bonafideForms').add({
      ...finalData,
      createdAt: new Date(),
    });

    const buffer = await generateBonafidePDF(finalData);

    const folderName = now.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    const folderId = await createFolderIfNotExists(folderName);

    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const fileName = `${day}-${month}-${year}-bonafide-certificate-${finalData.rollno}.pdf`;

    const uploadedFile = await uploadFile(buffer, fileName, folderId);
    console.log('Bonafide PDF uploaded to Drive:', uploadedFile);

    await sendBonafideNotification(finalData, buffer, fileName);

    req.session.bonafideData = null;
    res.render('success', { name: finalData.name });
  } catch (err) {
    console.error('Error saving form or uploading PDF:', err);
    res.status(500).send('Error saving form data or uploading PDF.');
  }
};
