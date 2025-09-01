const { google } = require('googleapis');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const { oAuth2Client } = require('../controllers/oauth2Controller');

const drive = google.drive({ version: 'v3', auth: oAuth2Client });

/**
 * Create folder if not exists
 */
async function createFolderIfNotExists(folderName, parentId = null) {
  const query =
    `name='${folderName}' and mimeType='application/vnd.google-apps.folder'` +
    (parentId ? ` and '${parentId}' in parents` : '');

  const res = await drive.files.list({ q: query, fields: 'files(id, name)' });
  if (res.data.files.length > 0) return res.data.files[0].id;

  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : [],
  };

  const folder = await drive.files.create({
    resource: folderMetadata,
    fields: 'id',
  });
  return folder.data.id;
}

/**
 * Upload file buffer to Drive
 */
async function uploadFile(buffer, fileName, folderId) {
  const media = {
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    body: Readable.from(buffer),
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
