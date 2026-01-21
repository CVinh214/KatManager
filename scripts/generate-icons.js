const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const svgPath = path.join(__dirname, '..', 'public', 'icons', 'icon-512.svg');
  const maskableSvgPath = path.join(__dirname, '..', 'public', 'icons', 'maskable-icon-512.svg');
  const outRoot = path.join(__dirname, '..', 'public');

  if (!fs.existsSync(svgPath)) {
    console.error('Source SVG not found:', svgPath);
    process.exit(1);
  }

  try {
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(outRoot, 'icon-512.png'));

    await sharp(svgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(outRoot, 'icon-192.png'));

    await sharp(maskableSvgPath)
      .resize(1024, 1024)
      .png()
      .toFile(path.join(outRoot, 'icons', 'icon-1024.png'));

    console.log('Generated icons: icon-192.png, icon-512.png, icons/icon-1024.png');
  } catch (err) {
    console.error('Failed to generate icons:', err);
    process.exit(1);
  }
}

generate();
