const { execSync } = require('child_process');
const fs = require('fs');

console.log('Installing Chromium dependencies for Render...');

try {
  // Install required dependencies for Chrome
  execSync('apt-get update', { stdio: 'inherit' });
  execSync('apt-get install -y wget gnupg ca-certificates', {
    stdio: 'inherit',
  });

  // Download and install Google Chrome
  execSync(
    'wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -',
    { stdio: 'inherit' }
  );
  execSync(
    'sh -c \'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list\'',
    { stdio: 'inherit' }
  );
  execSync('apt-get update', { stdio: 'inherit' });
  execSync('apt-get install -y google-chrome-stable', { stdio: 'inherit' });

  console.log('Google Chrome installed successfully');
  console.log('Chrome path:', '/usr/bin/google-chrome');
} catch (error) {
  console.error('Error installing Chrome:', error);
  process.exit(1);
}
