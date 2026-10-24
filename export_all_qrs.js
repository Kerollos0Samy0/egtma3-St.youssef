const fs = require('fs');
const path = require('path');
const QRCode = require('./attendance/node_modules/qrcode');

// Read members
const db = JSON.parse(fs.readFileSync('./attendance/attendance_db.json', 'utf8'));
const members = db.members;

console.log(`Found ${members.length} members.`);

// Target folder
const outputDir = path.join(__dirname, 'كروت_QR_الشباب');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to sanitize filename
function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

async function run() {
  const startTime = Date.now();
  let count = 0;

  for (const m of members) {
    const cleanName = sanitizeFilename(m.name);
    const cleanId = sanitizeFilename(m.id);
    const filename = `${cleanName} - ${cleanId}.png`;
    const filePath = path.join(outputDir, filename);

    // Generate high resolution QR code
    // Content is exactly m.id which matches the scanner
    await QRCode.toFile(filePath, m.id, {
      width: 600,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H' // High error correction level for best scanning resilience
    });

    count++;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Successfully generated ${count} QR code files in ${duration}s.`);
  console.log(`Folder path: ${outputDir}`);
}

run().catch(console.error);
