#!/usr/bin/env node

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '../public');

// Create a simple icon with GrooveVie branding (gold/amber color)
const createIcon = async (size, filename, maskable = false) => {
  const bgColor = maskable ? { r: 251, g: 191, b: 36 } : { r: 30, g: 30, b: 30 }; // Amber or dark
  const textColor = maskable ? '#1e1e1e' : '#fbbf24'; // Dark or amber

  try {
    // Create base image
    let svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .icon-bg { fill: ${bgColor.r > 200 ? '#fbbf24' : '#1e1e1e'}; }
            .icon-text { font-size: ${size * 0.5}px; font-weight: bold; fill: ${textColor}; text-anchor: middle; dominant-baseline: middle; font-family: Arial, sans-serif; }
            .icon-circle { fill: none; stroke: ${textColor}; stroke-width: ${size * 0.08}px; }
          </style>
        </defs>
        <rect class="icon-bg" width="${size}" height="${size}"/>
        ${maskable ? '' : `<circle class="icon-circle" cx="${size/2}" cy="${size/2}" r="${size * 0.35}"/>`}
        <text class="icon-text" x="${size/2}" y="${size/2}">G</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(publicDir, filename));

    console.log(`✓ Generated ${filename} (${size}x${size})`);
  } catch (error) {
    console.error(`✗ Failed to generate ${filename}:`, error.message);
  }
};

const createScreenshot = async (width, height, filename) => {
  try {
    let svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1e1e1e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#111;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)"/>
        <rect x="20" y="20" width="${width - 40}" height="100" fill="#fbbf24" rx="10"/>
        <text x="${width/2}" y="75" font-size="40" font-weight="bold" fill="#1e1e1e" text-anchor="middle" font-family="Arial">GrooveVie</text>
        <text x="${width/2}" y="120" font-size="16" fill="#999" text-anchor="middle" font-family="Arial">Order Food</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(publicDir, filename));

    console.log(`✓ Generated ${filename} (${width}x${height})`);
  } catch (error) {
    console.error(`✗ Failed to generate ${filename}:`, error.message);
  }
};

(async () => {
  console.log('Generating PWA icons...');
  
  // Generate regular icons
  await createIcon(192, 'icon-192.png', false);
  await createIcon(512, 'icon-512.png', false);
  
  // Generate maskable icons (for adaptive icons on Android)
  await createIcon(192, 'icon-192-maskable.png', true);
  await createIcon(512, 'icon-512-maskable.png', true);
  
  // Generate screenshots
  await createScreenshot(540, 720, 'screenshot-1.png');
  await createScreenshot(540, 720, 'screenshot-2.png');
  
  console.log('✓ All PWA icons generated successfully!');
})();
