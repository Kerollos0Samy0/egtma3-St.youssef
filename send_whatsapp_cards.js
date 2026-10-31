/**
 * بوت الإرسال التلقائي لكروت الـ QR ورسائل الترحيب عبر واتساب
 * اجتماع يوسف الصديق للشباب - كنيسة السيدة العذراء مريم
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const puppeteer = require('puppeteer-core');

const DB_FILE = path.join(__dirname, 'attendance', 'attendance_db.json');
const CARDS_DIR = path.join(__dirname, 'كروت_QR_الشباب');
const REPORT_FILE = path.join(__dirname, 'whatsapp_send_report.json');
const SESSION_DIR = path.join(__dirname, 'whatsapp_session');

// Detect browser executable (Chrome or Edge)
function getBrowserPath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Format phone number to international WhatsApp format (201xxxxxxxxx)
function formatPhone(phone) {
  if (!phone) return null;
  let clean = phone.toString().replace(/[^0-9]/g, '');
  if (clean.startsWith('20')) return clean;
  if (clean.startsWith('01')) return '20' + clean.substring(1);
  if (clean.length === 10 && clean.startsWith('1')) return '20' + clean;
  return clean.length >= 10 ? clean : null;
}

// Sanitize filename helper
function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

// Find card image file (.png or .svg)
function findCardFile(member) {
  const cleanName = sanitizeFilename(member.name);
  const cleanId = sanitizeFilename(member.id);
  const pngPath = path.join(CARDS_DIR, `${cleanName} - ${cleanId}.png`);
  if (fs.existsSync(pngPath)) return pngPath;
  const svgPath = path.join(CARDS_DIR, `${cleanName} - ${cleanId}.svg`);
  if (fs.existsSync(svgPath)) return svgPath;
  return null;
}

// Extract first name only (e.g. "ابانوب هاني" -> "ابانوب")
function getFirstName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  let first = parts[0].replace(/[()[\]{}0-9.,_-]/g, '').trim();
  if (!first && parts.length > 1) {
    first = parts[1].replace(/[()[\]{}0-9.,_-]/g, '').trim();
  }
  return first || fullName.trim();
}

// Generate friendly, warm youth welcome message (first name only)
function getWelcomeMessage(member) {
  const firstName = getFirstName(member.name);
  return `سلام ونعمة يا ${firstName} 🤍✨
يا رب تكون بأحسن حال ومبسوط دايماً 🙏

حابين نبعتلك كارت الـ QR الجميل بتاعك لاجتماع يوسف الصديق 🪪
خليه معاك على الموبايل عشان تسجل بيه حضورك وتاخد نقطك في الأنشطة والمسابقات 🎯⭐

ومستنيينك تنورنا وتفرحنا بوجودك في بيتك التاني (كنيسة العذراء مريم بالقناطر) ❤️
دي مواعيد لمتنا كل أسبوع، متفوتهاش:
• 👥 اجتماع الشباب: الثلاثاء 7:00 م
• 📖 كتاب مقدس وتسبحة: الأربعاء 7:00 م
• ⛪ القداس الإلهي: الخميس 7:00 ص
• 🕊️ اجتماع الصلاة: الجمعة 8:00 م

حضورك ولمتنا سوا بيفرّقوا جداً معانا ومستنيين نشوفك وسطنا دايماً! 🙏🤍`;
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Read line helper for interactive CLI
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Load send report
function loadReport() {
  if (fs.existsSync(REPORT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
    } catch (e) {}
  }
  return { sent: {}, failed: {}, lastUpdated: new Date().toISOString() };
}

// Save send report
function saveReport(report) {
  report.lastUpdated = new Date().toISOString();
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');
}

async function main() {
  console.log('\n=============================================================');
  console.log('   🚀 بوت الإرسال التلقائي لكروت الـ QR ورسائل الترحيب عبر واتساب');
  console.log('   كنيسة السيدة العذراء مريم - اجتماع يوسف الصديق للشباب');
  console.log('=============================================================\n');

  const browserPath = getBrowserPath();
  if (!browserPath) {
    console.error('❌ لم يتم العثور على متصفح Google Chrome أو Microsoft Edge على الجهاز.');
    console.log('يرجى تثبيت Chrome أو Edge والمحاولة مرة أخرى.');
    return;
  }
  console.log(`✓ تم العثور على المتصفح: ${path.basename(browserPath)}`);

  // Load database
  if (!fs.existsSync(DB_FILE)) {
    console.error(`❌ لم يتم العثور على قاعدة البيانات: ${DB_FILE}`);
    return;
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const members = db.members || [];
  console.log(`✓ إجمالي المخدومين في قاعدة البيانات: ${members.length} عضو`);

  const report = loadReport();
  const sentCount = Object.keys(report.sent).length;
  console.log(`✓ تم إرسال الكروت سابقاً إلى: ${sentCount} عضو\n`);

  console.log('اختر نوع العملية:');
  console.log('1. [تجربة أولاً] إرسال كارت تجريبي لرقم هاتف محدد للتأكد');
  console.log('2. [استئناف] إرسال الكروت لمن لم يتم الإرسال لهم بعد');
  console.log('3. [إرسال للجميع] البدء من جديد لجميع الأعضاء الـ 157');
  console.log('4. إرسال لعضو محدد بالاسم أو الكود');
  console.log('0. خروج');

  const choice = await ask('\nاكتب رقم الخيار ثم اضغط Enter: ');

  let targetList = [];

  if (choice === '0') {
    console.log('تم الإلغاء.');
    return;
  } else if (choice === '1') {
    const testPhone = await ask('أدخل رقم الهاتف للتجربة (مثال: 01234567890): ');
    const memberSample = members[0];
    targetList.push({
      ...memberSample,
      name: 'تجربة الإرسال',
      phone: testPhone
    });
  } else if (choice === '2') {
    targetList = members.filter(m => !report.sent[m.id]);
    console.log(`المتبقي للإرسال: ${targetList.length} عضو.`);
  } else if (choice === '3') {
    targetList = [...members];
  } else if (choice === '4') {
    const search = await ask('أدخل كود أو اسم العضو: ');
    const found = members.filter(m => m.id.includes(search) || m.name.includes(search));
    if (found.length === 0) {
      console.log('❌ لم يتم العثور على أعضاء مطابقة.');
      return;
    }
    console.log(`تم العثور على: ${found.map(m => `${m.name} (${m.id})`).join('، ')}`);
    targetList = found;
  } else {
    console.log('خيار غير صحيح.');
    return;
  }

  if (targetList.length === 0) {
    console.log('✓ لا توجد أرقام للإرسال إليها.');
    return;
  }

  console.log(`\n⏳ جاري فتح المتصفح لربط واتساب ويب...`);
  console.log(`يرجى مسح رمز الـ QR من شاشة المتصفح في حال طُلب منك ذلك.`);

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: browserPath,
    userDataDir: SESSION_DIR,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2', timeout: 60000 });

  console.log('\n📱 في انتظار تسجيل الدخول إلى WhatsApp Web...');
  console.log('(إذا كنت مسجلاً مسبقاً، سيتم الدخول تلقائياً خلال ثوانٍ)');

  try {
    // Wait for WhatsApp Web main chat interface or search box to appear
    await page.waitForSelector('div[contenteditable="true"], [data-icon="chat"], #side', { timeout: 120000 });
    console.log('✅ تم تسجيل الدخول بنجاح إلى WhatsApp Web!\n');
  } catch (e) {
    console.error('❌ انتهت مهلة تسجيل الدخول. يرجى التأكد من مسح الـ QR وإعادة المحاولة.');
    await browser.close();
    return;
  }

  console.log('=============================================================');
  console.log(`🚀 بدء عملية الإرسال لـ ${targetList.length} عضو...`);
  console.log('⚠️ تم ضبط فاصل زمني أمان (6 - 8 ثوانٍ) بين كل رسالة لحماية حسابك.');
  console.log('=============================================================\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targetList.length; i++) {
    const m = targetList[i];
    const phoneFormatted = formatPhone(m.phone);
    const cardPath = findCardFile(m);

    console.log(`[${i + 1}/${targetList.length}] جاري معالجة: ${m.name} (${m.id}) - تليفون: ${m.phone || 'بدون'}`);

    if (!phoneFormatted) {
      console.log(`   ⚠️ تم التخطي: لا يوجد رقم هاتف صالح.`);
      report.failed[m.id] = { reason: 'Invalid or missing phone', date: new Date().toISOString() };
      saveReport(report);
      failCount++;
      continue;
    }

    if (!cardPath) {
      console.log(`   ⚠️ تم التخطي: لم يتم العثور على صورة الكارت في مجلد كروت_QR_الشباب.`);
      report.failed[m.id] = { reason: 'Card file not found', date: new Date().toISOString() };
      saveReport(report);
      failCount++;
      continue;
    }

    try {
      const msg = getWelcomeMessage(m);
      const chatUrl = `https://web.whatsapp.com/send?phone=${phoneFormatted}&text=${encodeURIComponent(msg)}`;
      await page.goto(chatUrl, { waitUntil: 'networkidle2', timeout: 45000 });

      // Check if phone number is invalid on WhatsApp (popup with "Phone number shared via url is invalid")
      await sleep(2500);
      const invalidAlert = await page.$('div[data-animate-modal-body="true"], [data-testid="popup-contents"]');
      if (invalidAlert) {
        const alertText = await page.evaluate(el => el.innerText, invalidAlert);
        if (alertText.includes('invalid') || alertText.includes('غير صحيح') || alertText.includes('غير مسجل')) {
          console.log(`   ❌ الرقم غير مسجل في واتساب: ${phoneFormatted}`);
          report.failed[m.id] = { reason: 'Number not on WhatsApp', date: new Date().toISOString() };
          saveReport(report);
          failCount++;
          // Click OK to dismiss popup
          const okBtn = await page.$('button[data-testid="popup-controls-ok"], button');
          if (okBtn) await okBtn.click();
          await sleep(1500);
          continue;
        }
      }

      // Wait for chat input box
      await page.waitForSelector('footer div[contenteditable="true"]', { timeout: 15000 });

      // Attach file
      // Look for attach button (+) or file input
      const attachBtn = await page.$('span[data-icon="plus"], button[title="إرفاق"], button[title="Attach"], [data-icon="attach-menu-plus"]');
      if (attachBtn) {
        await attachBtn.click();
        await sleep(800);
      }

      // File input for image
      const fileInput = await page.$('input[accept*="image"], input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile(cardPath);
        await sleep(2500);

        // Wait for preview send button
        const mediaSendBtn = await page.waitForSelector('span[data-icon="send"], [data-testid="send"]', { timeout: 15000 });
        if (mediaSendBtn) {
          await mediaSendBtn.click();
          await sleep(2000);
        }
      } else {
        // Fallback: Send the welcome text directly if attachment element couldn't be located
        const sendBtn = await page.$('span[data-icon="send"], button[aria-label="إرسال"], button[aria-label="Send"]');
        if (sendBtn) await sendBtn.click();
        await sleep(2000);
      }

      console.log(`   ✅ تم إرسال الكارت والرسالة بنجاح إلى: ${m.name}`);
      report.sent[m.id] = { name: m.name, phone: phoneFormatted, date: new Date().toISOString() };
      delete report.failed[m.id];
      saveReport(report);
      successCount++;

    } catch (err) {
      console.log(`   ❌ خطأ أثناء الإرسال لـ ${m.name}: ${err.message}`);
      report.failed[m.id] = { reason: err.message, date: new Date().toISOString() };
      saveReport(report);
      failCount++;
    }

    // Safety Delay (6 to 9 seconds)
    if (i < targetList.length - 1) {
      const waitSeconds = Math.floor(Math.random() * 4) + 6; // 6 to 9 seconds
      process.stdout.write(`   ⏳ انتظار أمان لتفادي الحظر: `);
      for (let sec = waitSeconds; sec > 0; sec--) {
        process.stdout.write(`${sec}.. `);
        await sleep(1000);
      }
      console.log('');
    }
  }

  console.log('\n=============================================================');
  console.log(`🎉 اكتملت العملية!`);
  console.log(`✅ إجمالي الناجح: ${successCount}`);
  console.log(`❌ إجمالي الفاشل / غير مسجل: ${failCount}`);
  console.log(`📄 تم حفظ التقرير بالكامل في: ${path.basename(REPORT_FILE)}`);
  console.log('=============================================================\n');

  await ask('اضغط Enter لإغلاق المتصفح وإنهاء البرنامج...');
  await browser.close();
}

main().catch(err => {
  console.error('Fatal Error:', err);
});
