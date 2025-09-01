const { db } = require('../config/firebase');
const {
  sendBonafideNotification,
} = require('../helper/sendBonafideNotification');
const generateBonafide = require('../helper/generateBonafide');
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
    // Save to Firestore
    const docRef = await db.collection('bonafideForms').add({
      ...finalData,
      createdAt: new Date(),
    });

    // Generate the docx (make sure generateBonafide returns { buffer, transformed })
    const { buffer, transformed } = await generateBonafide(finalData);

    // Prepare folder name
    const now = new Date();
    const folderName = now.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    const folderId = await createFolderIfNotExists(folderName);

    // File naming
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const fileName = `${day}-${month}-${year}-bonafide-certificate-${transformed.rollno}.docx`;

    // Upload to Google Drive
    const uploadedFile = await uploadFile(buffer, fileName, folderId);
    console.log('Bonafide uploaded to Drive:', uploadedFile);

    // ✅ Fix: pass the raw buffer and filename, not the uploadedFile object
    await sendBonafideNotification(finalData, buffer, fileName);

    // Clear session
    req.session.bonafideData = null;

    res.render('success', { name: finalData.name });
  } catch (err) {
    console.error('Error saving form or uploading file:', err);
    res.status(500).send('Error saving form data or uploading file.');
  }
};
