const { google } = require('googleapis');
const { Readable } = require('stream');
const { oAuth2Client } = require('../controllers/oauth2Controller');

// Initialize Google Drive client
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

/**
 * Create a folder in Drive if it doesn't exist
 */
async function createFolderIfNotExists(folderName, parentId = null) {
  const query =
    `name='${folderName}' and mimeType='application/vnd.google-apps.folder'` +
    (parentId ? ` and '${parentId}' in parents` : '');

  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files.length > 0) return res.data.files[0].id;

  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : [],
  };

  const folder = await drive.files.create({
    resource: folderMetadata,
    fields: 'id',
    supportsAllDrives: true,
  });

  return folder.data.id;
}

/**
 * Upload a file buffer to Drive inside a folder
 */
async function uploadFile(buffer, fileName, folderId) {
  const media = {
    mimeType: 'application/pdf', // ✅ correct mime type for PDF
    body: Readable.from([buffer]), // wrap buffer in array so it's a single chunk
  };

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, name',
    supportsAllDrives: true,
  });

  return file.data;
}

module.exports = { createFolderIfNotExists, uploadFile };
