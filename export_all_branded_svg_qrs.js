const fs = require('fs');
const path = require('path');
const QRCode = require('./attendance/node_modules/qrcode');
const { execSync } = require('child_process');

const db = JSON.parse(fs.readFileSync('./attendance/attendance_db.json', 'utf8'));
const members = db.members;

const outputDir = path.join(__dirname, 'كروت_QR_الشباب');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Logo base64
const logoBase64 = fs.readFileSync(path.join(__dirname, 'favicon.png')).toString('base64');

function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

async function run() {
  console.log(`Starting branded card generation for ${members.length} members...`);
  const startTime = Date.now();

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const cleanName = sanitizeFilename(m.name);
    const cleanId = sanitizeFilename(m.id);
    const svgPath = path.join(outputDir, `${cleanName} - ${cleanId}.svg`);

    const stage = m.collegeStage || m.universityStage || 'شباب جامعي';
    const area = m.areaGroup || (m.groupCode ? ('منطقة ' + m.groupCode) : 'اجتماع الشباب');

    const qrSvg = await QRCode.toString(m.id, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'H'
    });
    
    // Extract inner path from qrSvg
    const qrMatch = qrSvg.match(/<path[^>]*d="([^"]+)"/g) || [];
    let qrPaths = '';
    qrMatch.forEach(p => qrPaths += p + ' />');

    const cardSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="780" viewBox="0 0 600 780" style="background:#070c18;font-family:'Segoe UI', Tahoma, Cairo, Arial, sans-serif;">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#070c18" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="600" height="780" fill="url(#bgGrad)" />

  <!-- Dual Gold Borders -->
  <rect x="14" y="14" width="572" height="752" rx="26" fill="none" stroke="#c59b27" stroke-width="3.5" />
  <rect x="22" y="22" width="556" height="736" rx="18" fill="none" stroke="rgba(197, 155, 39, 0.3)" stroke-width="1" />

  <!-- Church Logo -->
  <circle cx="300" cy="72" r="36" fill="#ffffff" stroke="#c59b27" stroke-width="2.5" />
  <clipPath id="logoClip">
    <circle cx="300" cy="72" r="34" />
  </clipPath>
  <image href="data:image/png;base64,${logoBase64}" x="266" y="38" width="68" height="68" clip-path="url(#logoClip)" />

  <!-- Header Text -->
  <text x="300" y="136" font-size="23" font-weight="900" fill="#f59e0b" text-anchor="middle">اجتماع يوسف الصديق للشباب</text>
  <text x="300" y="158" font-size="13.5" font-weight="700" fill="#94a3b8" text-anchor="middle">كنيسة السيدة العذراء مريم بالقناطر الخيرية</text>
  <text x="300" y="179" font-size="13" font-weight="bold" fill="#c59b27" text-anchor="middle">─── ✝ ───</text>

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

  <!-- Person Name (Large & Bold) -->
  <text x="300" y="562" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">${m.name}</text>

  <!-- Code Badge Pill -->
  <rect x="200" y="582" width="200" height="34" rx="17" fill="url(#goldGrad)" />
  <text x="300" y="605" font-size="16" font-weight="900" fill="#0b1120" text-anchor="middle">كود الحضور: ${m.id}</text>

  <!-- Meta Details -->
  <text x="300" y="652" font-size="15" font-weight="700" fill="#38bdf8" text-anchor="middle">🎓 ${stage}   •   📍 ${area}</text>
  ${m.father ? `<text x="300" y="682" font-size="13" font-weight="600" fill="#94a3b8" text-anchor="middle">أب الاعتراف: ${m.father}  |  الموبايل: ${m.phone || '—'}</text>` : ''}

  <!-- Footer Text -->
  <text x="300" y="730" font-size="11" font-weight="600" fill="#475569" text-anchor="middle">بطاقة الهوية الرقمية الذكية بالـ QR • 2026 - 2027 ✝️</text>
</svg>`;

    fs.writeFileSync(svgPath, cardSvg, 'utf8');
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Generated ${members.length} branded vector card files in ${duration}s!`);
}

run().catch(console.error);
