const fs = require('fs');
const path = require('path');
const QRCode = require('./attendance/node_modules/qrcode');
const puppeteer = require('puppeteer-core');

const db = JSON.parse(fs.readFileSync('./attendance/attendance_db.json', 'utf8'));
const members = db.members;

const outputDir = path.join(__dirname, 'كروت_QR_الشباب');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const logoBase64 = fs.readFileSync(path.join(__dirname, 'favicon.png')).toString('base64');

function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

function buildSvg(m, qrSvg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="630" viewBox="0 0 600 630" style="background:#070c18;font-family:'Segoe UI', Tahoma, Cairo, Arial, sans-serif;">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#070c18" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="600" height="630" fill="url(#bgGrad)" />

  <!-- Dual Gold Borders -->
  <rect x="14" y="14" width="572" height="602" rx="24" fill="none" stroke="#c59b27" stroke-width="3.5" />
  <rect x="22" y="22" width="556" height="586" rx="16" fill="none" stroke="rgba(197, 155, 39, 0.3)" stroke-width="1" />

  <!-- Church Logo -->
  <circle cx="300" cy="68" r="35" fill="#ffffff" stroke="#c59b27" stroke-width="2.5" />
  <clipPath id="logoClip">
    <circle cx="300" cy="68" r="33" />
  </clipPath>
  <image href="data:image/png;base64,${logoBase64}" x="266" y="34" width="68" height="68" clip-path="url(#logoClip)" />

  <!-- Header Text -->
  <text x="300" y="132" font-size="23" font-weight="900" fill="#f59e0b" text-anchor="middle">اجتماع يوسف الصديق للشباب</text>
  <text x="300" y="154" font-size="13.5" font-weight="700" fill="#94a3b8" text-anchor="middle">كنيسة السيدة العذراء مريم بالقناطر الخيرية</text>
  <text x="300" y="175" font-size="13" font-weight="bold" fill="#c59b27" text-anchor="middle">─── ✝ ───</text>

  <!-- Center White QR Container -->
  <rect x="140" y="195" width="320" height="320" rx="20" fill="#ffffff" stroke="rgba(197, 155, 39, 0.5)" stroke-width="2" />
  <g transform="translate(160, 215) scale(12.17)">
    ${qrSvg.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
  </g>

  <!-- Center Emblem over QR -->
  <circle cx="300" cy="355" r="26" fill="#ffffff" stroke="#c59b27" stroke-width="2.5" />
  <clipPath id="centerEmblemClip">
    <circle cx="300" cy="355" r="23" />
  </clipPath>
  <image href="data:image/png;base64,${logoBase64}" x="277" y="332" width="46" height="46" clip-path="url(#centerEmblemClip)" />

  <!-- Person Name Only -->
  <text x="300" y="572" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">${m.name}</text>
</svg>`;
}

async function main() {
  console.log(`Generating simplified cards for ${members.length} members...`);
  const t0 = Date.now();

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const cleanName = sanitizeFilename(m.name);
    const cleanId = sanitizeFilename(m.id);
    const svgPath = path.join(outputDir, `${cleanName} - ${cleanId}.svg`);

    const qrSvg = await QRCode.toString(m.id, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'H'
    });

    const cardSvg = buildSvg(m, qrSvg);
    fs.writeFileSync(svgPath, cardSvg, 'utf8');
  }

  console.log(`Updated all 157 SVGs in ${((Date.now() - t0) / 1000).toFixed(2)}s`);

  // Render a sample PNG and also update sample_card.png
  console.log('Rendering sample card PNG...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = fs.existsSync(edgePath) ? edgePath : chromePath;

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 600, height: 630, deviceScaleFactor: 2 });

  // Sample: ابانوب هاني حشمت
  const sampleMember = members.find(x => x.id === 'YS-002') || members[0];
  const sampleCleanName = sanitizeFilename(sampleMember.name);
  const sampleCleanId = sanitizeFilename(sampleMember.id);
  const sampleSvgPath = path.join(outputDir, `${sampleCleanName} - ${sampleCleanId}.svg`);

  const svgContent = fs.readFileSync(sampleSvgPath, 'utf8');
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#000;">${svgContent}</body></html>`);

  await page.screenshot({ path: path.join(__dirname, 'sample_card.png'), type: 'png' });

  // Copy to brain artifacts directory
  const brainArtifactDir = 'C:\\Users\\ACC\\.gemini\\antigravity\\brain\\96dec7ea-dbad-4ddc-95cb-99cf793d029f';
  if (fs.existsSync(brainArtifactDir)) {
    fs.copyFileSync(path.join(__dirname, 'sample_card.png'), path.join(brainArtifactDir, 'sample_card.png'));
  }

  console.log('Sample card rendered and copied to artifacts!');

  // Now convert all 157 SVGs to PNGs in outputDir so WhatsApp sender has high-res PNGs
  console.log('Converting all 157 cards to high-res PNGs for WhatsApp sending...');
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const cleanName = sanitizeFilename(m.name);
    const cleanId = sanitizeFilename(m.id);
    const svgPath = path.join(outputDir, `${cleanName} - ${cleanId}.svg`);
    const pngPath = path.join(outputDir, `${cleanName} - ${cleanId}.png`);

    const svg = fs.readFileSync(svgPath, 'utf8');
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#000;">${svg}</body></html>`);
    await page.screenshot({ path: pngPath, type: 'png' });
    if ((i + 1) % 25 === 0 || i === members.length - 1) {
      console.log(`Converted ${i + 1}/${members.length} PNGs...`);
    }
  }

  await browser.close();
  console.log(`All done in ${((Date.now() - t0) / 1000).toFixed(2)}s!`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
