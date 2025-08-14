#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create dist/widget directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist', 'widget');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy logo.png from public to dist/widget
const sourceLogo = path.join(__dirname, '..', 'public', 'logo.png');
const destLogo = path.join(distDir, 'logo.png');

try {
  fs.copyFileSync(sourceLogo, destLogo);
  console.log('✅ Copied logo.png to dist/widget/');
} catch (error) {
  console.error('❌ Failed to copy logo.png:', error.message);
  process.exit(1);
}