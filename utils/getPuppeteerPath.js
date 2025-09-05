// utils/getPuppeteerPath.js
const puppeteer = require('puppeteer');

/**
 * Get Puppeteer's executable path dynamically
 * Works on local + Render
 */
async function getPuppeteerPath() {
  return puppeteer.executablePath();
}

module.exports = getPuppeteerPath;
