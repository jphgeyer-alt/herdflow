#!/usr/bin/env node

/**
 * Asset Generator for HerdFlow Expo App
 * Generates placeholder images for app icon, splash screen, and adaptive icon
 * 
 * Usage: node generate-assets.js
 * Or: npm run generate:assets (when added to package.json)
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('✅ Created assets directory');
}

/**
 * Generate SVG placeholder image
 * @param {string} filename - Output filename
 * @param {string} text - Text to display
 * @param {string} bgColor - Background color
 */
function generateSVG(filename, text, bgColor = '#2563eb') {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="${bgColor}"/>
  <text x="512" y="512" font-size="200" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">
    ${text}
  </text>
</svg>`;

  const filepath = path.join(assetsDir, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`✅ Generated ${filename}`);
}

/**
 * Generate adaptive icon SVG
 */
function generateAdaptiveIcon() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="108" height="108" viewBox="0 0 108 108" xmlns="http://www.w3.org/2000/svg">
  <rect width="108" height="108" fill="#2563eb"/>
  <circle cx="54" cy="54" r="40" fill="white"/>
  <text x="54" y="62" font-size="50" font-weight="bold" fill="#2563eb" text-anchor="middle">
    HF
  </text>
</svg>`;

  const filepath = path.join(assetsDir, 'adaptive-icon.svg');
  fs.writeFileSync(filepath, svg);
  console.log('✅ Generated adaptive-icon.svg');
}

/**
 * Generate favicon
 */
function generateFavicon() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#2563eb" rx="32"/>
  <text x="96" y="110" font-size="100" font-weight="bold" fill="white" text-anchor="middle">
    HF
  </text>
</svg>`;

  const filepath = path.join(assetsDir, 'favicon.svg');
  fs.writeFileSync(filepath, svg);
  console.log('✅ Generated favicon.svg');
}

// Generate placeholder assets
console.log('🎨 Generating HerdFlow placeholder assets...\n');
generateSVG('icon.svg', 'HF', '#2563eb');
generateSVG('splash.svg', 'HerdFlow', '#f8fafc');
generateAdaptiveIcon();
generateFavicon();

console.log('\n✨ Asset generation complete!');
console.log('\n📝 Note: These are placeholder SVG files.');
console.log('   For production, replace with:');
console.log('   - icon.png (1024x1024)');
console.log('   - splash.png (1080x2340 or similar)');
console.log('   - adaptive-icon.png (108x108)');
console.log('   - favicon.png (192x192)');
console.log('\n💡 Update references in expo/app.json to point to PNG files.');
