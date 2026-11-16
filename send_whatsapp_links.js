/**
 * بوت الإرسال التلقائي للروابط عبر واتساب
 * كنيسة السيدة العذراء مريم - اجتماع يوسف الصديق للشباب
 * يرسل رابط استمارة الرغبات + رابط تحديد موقع المنزل على الخريطة مخصص لكل شاب
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const puppeteer = require('puppeteer-core');

const DB_FILE = path.join(__dirname, 'attendance_db.json');
const CARDS_DIR = path.join(__dirname, 'كروت_QR_الشباب');
const REPORT_FILE = path.join(__dirname, 'whatsapp_links_report.json');
const SESSION_DIR = path.join(__dirname, 'whatsapp_session');

const BASE_URL = 'https://st-youssef.vercel.app';

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

// Extract first name only (e.g. "مادونا عاطف" -> "مادونا")
function getFirstName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  let first = parts[0].replace(/[()[\]{}0-9.,_-]/g, '').trim();
  if (!first && parts.length > 1) {
    first = parts[1].replace(/[()[\]{}0-9.,_-]/g, '').trim();
  }
  return first || fullName.trim();
}

// Build friendly, personalized message
function buildMessage(member, templateId = '1', customText = '') {
  const firstName = getFirstName(member.name);
  const surveyUrl = `${BASE_URL}/survey?id=${member.id}`;
  const locationUrl = `${BASE_URL}/location?id=${member.id}`;
  const siteUrl = BASE_URL;

  switch (templateId) {
    case '1': // [المطلوب: 3+4] رابط الاستمارة + رابط تحديد الموقع + مواعيد اللقاءات
      return `سلام ونعمة يا ${firstName} 🤍✨
يا رب تكون بأحسن حال ومبسوط دايماً 🙏

حابين نشاركك لينكين مهمين جداً يخصوك في اجتماع يوسف الصديق للشباب ❤️:

1️⃣ استمارة الرغبات والاقتراحات 📝:
رأيك يهمنا جداً في اختيار الأنشطة والفقرات والرحلات، شاركنا أفكارك ورغباتك من خلال الرابط (اسمك مسجل تلقائياً):
👉 ${surveyUrl}

2️⃣ تحديد موقع منزلك على الخريطة 📍🏠:
عشان لجنة الافتقاد تكون قريبة منك ونعرف نوصلك بسهولة في المناسبات والافتقاد، سجل موقع بيتك في ثواني:
👉 ${locationUrl}

ومستنيينك تنورنا وتفرحنا بوجودك دايماً في بيتك التاني ❤️:
• 👥 اجتماع الشباب: الثلاثاء 7:00 م
• 📖 كتاب مقدس وتسبحة: الأربعاء 7:00 م
• ⛪ القداس الإلهي: الخميس 7:00 ص
• 🕊️ اجتماع الصلاة: الجمعة 8:00 م

مشاركتك ولمتنا سوا بتفرّق جداً معانا ومستنيين نشوفك وسطنا دايماً! 🙏🤍`;

    case '2': // رابط الموقع العام فقط
      return `سلام ونعمة يا ${firstName} 🤍✨
يا رب تكون بخير دايماً 🙏

رابط موقع اجتماع يوسف الصديق للشباب الجديد 🌐:
👉 ${siteUrl}

تقدر من خلاله تتابع مواعيد اللقاءات، ترتيب الأسر، والنقاط والأنشطة أول بأول 🎯⭐

مستنيينك تنورنا كل أسبوع في بيتك التاني ❤️`;

    case '3': // استمارة الرغبات فقط
      return `سلام ونعمة يا ${firstName} 🤍✨
يا رب تكون بأحسن حال 🙏

رأيك يهمنا جداً في اجتماع يوسف الصديق للشباب ❤️
ادخل على الرابط التالي وشاركنا رغباتك واقتراحاتك للأنشطة والرحلات:
👉 ${surveyUrl}

مش هياخد من وقتك دقيقتين ومشاركتك هتساعدنا نطور الاجتماع سوا! 🌟🤍`;

    case '4': // تحديد الموقع فقط
      return `سلام ونعمة يا ${firstName} 🤍✨
يا رب تكون بخير دايماً 🙏

عشان لجنة الافتقاد تكون قريبة منك ونعرف نوصلك بسهولة 🚗🏠
يرجى فتح الرابط التالي لتحديد موقع بيتك على الخريطة في ثواني:
👉 ${locationUrl}

شكراً جداً لمحبتك وتعاونك معانا! 🌸✨`;

    case '5': // نص مخصص
      return customText
        .replace(/{name}/g, member.name)
        .replace(/{firstName}/g, firstName)
        .replace(/{id}/g, member.id)
        .replace(/{surveyUrl}/g, surveyUrl)
        .replace(/{locationUrl}/g, locationUrl)
        .replace(/{siteUrl}/g, siteUrl);

    default:
      return `سلام ونعمة يا ${firstName} 🤍✨
استمارة الرغبات: ${surveyUrl}
تحديد موقع المنزل: ${locationUrl}`;
  }
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Readline helper
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Report management
function loadReport() {
  if (fs.existsSync(REPORT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
    } catch (e) {}
  }
  return { sent: {}, failed: {}, lastUpdated: new Date().toISOString() };
}

function saveReport(report) {
  report.lastUpdated = new Date().toISOString();
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');
}

// Send message to one contact using open WhatsApp Web page
async function sendMessageToContact(page, member, messageText, report) {
  const phoneFormatted = formatPhone(member.phone);
  if (!phoneFormatted) {
    console.log(`   ⚠️ تم التخطي: لا يوجد رقم هاتف صالح.`);
    report.failed[member.id] = { reason: 'Invalid or missing phone', date: new Date().toISOString() };
    saveReport(report);
    return false;
  }

  try {
    const chatUrl = `https://web.whatsapp.com/send?phone=${phoneFormatted}&text=${encodeURIComponent(messageText)}`;
    await page.goto(chatUrl, { waitUntil: 'networkidle2', timeout: 45000 });

    await sleep(2500);

    // Check if phone number is invalid on WhatsApp
    const invalidAlert = await page.$('div[data-animate-modal-body="true"], [data-testid="popup-contents"]');
    if (invalidAlert) {
      const alertText = await page.evaluate(el => el.innerText, invalidAlert);
      if (alertText.includes('invalid') || alertText.includes('غير صحيح') || alertText.includes('غير مسجل')) {
        console.log(`   ❌ الرقم غير مسجل في واتساب: ${phoneFormatted}`);
        report.failed[member.id] = { reason: 'Number not on WhatsApp', date: new Date().toISOString() };
        saveReport(report);
        const okBtn = await page.$('button[data-testid="popup-controls-ok"], button');
        if (okBtn) await okBtn.click();
        await sleep(1500);
        return false;
      }
    }

    // Wait for text input box
    console.log('   ⏳ انتظار تحميل صندوق الرسالة...');
    await page.waitForSelector('footer div[contenteditable="true"]', { timeout: 20000 });
    await sleep(1200);

    await page.focus('footer div[contenteditable="true"]');
    await sleep(300);
    await page.keyboard.press('End');
    await page.keyboard.press('Space');
    await page.keyboard.press('Backspace');
    await sleep(500);

    // Send click
    let sent = await page.evaluate(() => {
      const sendBtn = document.querySelector('footer span[data-icon="send"]') ||
                      document.querySelector('footer span[data-testid="send"]') ||
                      document.querySelector('footer button[aria-label="إرسال"]') ||
                      document.querySelector('footer button[aria-label="Send"]') ||
                      document.querySelector('footer [data-icon="send"]') ||
                      document.querySelector('footer button[data-tab="11"]');
      if (sendBtn) {
        const clickable = sendBtn.closest('button, div[role="button"]') || sendBtn;
        clickable.click();
        return true;
      }
      return false;
    });

    if (!sent) {
      await page.keyboard.press('Enter');
      await sleep(600);
    }

    console.log(`   ✅ تم الإرسال بنجاح إلى: ${member.name}`);
    report.sent[member.id] = { name: member.name, phone: phoneFormatted, date: new Date().toISOString() };
    delete report.failed[member.id];
    saveReport(report);
    return true;

  } catch (err) {
    console.log(`   ❌ خطأ أثناء الإرسال لـ ${member.name}: ${err.message}`);
    report.failed[member.id] = { reason: err.message, date: new Date().toISOString() };
    saveReport(report);
    return false;
  }
}

async function main() {
  console.log('\n=============================================================');
  console.log('   🚀 بوت إرسال الروابط التلقائي عبر واتساب');
  console.log('   كنيسة السيدة العذراء مريم - اجتماع يوسف الصديق للشباب');
  console.log('   الروابط: استمارة الرغبات (Survey) + تحديد موقع المنزل (GPS)');
  console.log('=============================================================\n');

  const browserPath = getBrowserPath();
  if (!browserPath) {
    console.error('❌ لم يتم العثور على متصفح Google Chrome أو Microsoft Edge.');
    return;
  }
  console.log(`✓ المتصفح المكتشف: ${path.basename(browserPath)}`);

  if (!fs.existsSync(DB_FILE)) {
    console.error(`❌ لم يتم العثور على قاعدة البيانات: ${DB_FILE}`);
    return;
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const members = db.members || [];
  console.log(`✓ إجمالي الأعضاء في قاعدة البيانات: ${members.length} عضو`);

  const report = loadReport();
  const sentCount = Object.keys(report.sent).length;
  console.log(`✓ تم الإرسال سابقاً لـ: ${sentCount} عضو في تقرير الروابط`);

  // Step 1: Template selection (Default: 1 = Survey + Location)
  console.log('\n📋 اختر محتوى الرسالة المراد إرسالها:');
  console.log('1. [الموصى به] رابط استمارة الرغبات + رابط تحديد موقع المنزل + مواعيد اللقاءات');
  console.log('2. [رابط الموقع العام فقط] https://st-youssef.vercel.app');
  console.log('3. [استمارة الرغبات فقط] https://st-youssef.vercel.app/survey');
  console.log('4. [تحديد موقع المنزل فقط] https://st-youssef.vercel.app/location');
  console.log('5. [نص مخصص يكتبه الخادم]');
  console.log('0. خروج');

  const templateChoice = await ask('\nاكتب رقم النموذج [افتراضي 1]: ') || '1';
  if (templateChoice === '0') {
    console.log('تم الإلغاء.');
    return;
  }

  let customText = '';
  if (templateChoice === '5') {
    console.log('اكتب النص المخصص (يمكنك استخدام {firstName}, {surveyUrl}, {locationUrl}):');
    customText = await ask('النص: ');
  }

  // Preview Message
  console.log('\n----------------- معاينة الرسالة -----------------');
  const sampleMember = members[0] || { name: 'مينا سمير', id: 'YS-001', phone: '01234567890' };
  console.log(buildMessage(sampleMember, templateChoice, customText));
  console.log('--------------------------------------------------\n');

  // Step 2: Test First or Send Directly?
  console.log('🎯 خطة الإرسال:');
  console.log('1. [موصى به] تجربة الإرسال على رقم هاتفك الشخصي أولاً، ثم البدء للجميع');
  console.log(`2. [مباشر] البدء فوراً لجميع الأعضاء الـ ${members.length} المسجلين`);
  console.log('3. [الأعضاء الجدد فقط] إرسال للخريجين والأسماء الـ 12 المضافة حديثاً');
  console.log('4. [استئناف] إرسال للمتبقين فقط ممن لم يستلموا في التقرير');
  console.log('5. [تحديد عضو محدد] بالاسم أو الكود');
  console.log('6. [تحديد البداية] البدء من رقم عضو معين');

  const planChoice = await ask('\nاختر رقم الخطة [افتراضي 1]: ') || '1';

  let testPhone = null;
  let targetList = [];

  if (planChoice === '1') {
    testPhone = await ask('📱 أدخل رقم تليفونك الشخصي لإرسال التجربة (مثال: 01223708282): ');
    targetList = [...members];
  } else if (planChoice === '2') {
    targetList = [...members];
  } else if (planChoice === '3') {
    const recentIds = ['YS-164', 'YS-165', 'YS-166', 'YS-167', 'YS-168', 'YS-169', 'YS-170', 'YS-171', 'YS-172', 'YS-173', 'YS-174', 'YS-175'];
    targetList = members.filter(m => recentIds.includes(m.id) || (m.collegeStage === 'خريج' && m.id.startsWith('YS-1')));
  } else if (planChoice === '4') {
    targetList = members.filter(m => !report.sent[m.id]);
  } else if (planChoice === '5') {
    const q = await ask('أدخل اسم أو كود العضو: ');
    targetList = members.filter(m => m.name.includes(q) || m.id.includes(q));
    if (targetList.length === 0) {
      console.log('❌ لم يتم العثور على أعضاء مطابقة.');
      return;
    }
  } else if (planChoice === '6') {
    const startStr = await ask(`أدخل رقم العضو للبدء من عنده (1 - ${members.length}): `);
    const startNum = parseInt(startStr, 10);
    if (!isNaN(startNum) && startNum >= 1 && startNum <= members.length) {
      targetList = members.slice(startNum - 1);
    }
  }

  // Open Browser & WhatsApp Web
  console.log(`\n⏳ جاري تشغيل المتصفح وربط WhatsApp Web...`);

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

  console.log('📱 في انتظار تسجيل الدخول إلى WhatsApp Web...');
  console.log('(إذا كنت مسجلاً مسبقاً، سيتم الدخول تلقائياً خلال ثوانٍ)');

  try {
    await page.waitForSelector('div[contenteditable="true"], [data-icon="chat"], #side', { timeout: 120000 });
    console.log('✅ تم تسجيل الدخول بنجاح إلى WhatsApp Web!\n');
  } catch (e) {
    console.error('❌ انتهت مهلة تسجيل الدخول. يرجى التأكد من مسح الـ QR وإعادة المحاولة.');
    await browser.close();
    return;
  }

  // If Test option was selected
  if (testPhone) {
    console.log(`\n🧪 جاري إرسال الرسالة التجريبية إلى: ${testPhone}...`);
    const testMember = {
      ...members[0],
      name: 'خادم الاجتماع (تجربة)',
      phone: testPhone
    };
    const testMsg = buildMessage(testMember, templateChoice, customText);
    const ok = await sendMessageToContact(page, testMember, testMsg, report);
    if (ok) {
      console.log('🎉 تم إرسال رسالة التجربة بنجاح على تليفونك!');
      console.log('يرجى مراجعة شكل اللينكات والرسالة على هاتفك الآن.');
      const continueAll = await ask(`\nهل شكل الرسالة ممتاز وتريد البدء فوراً في إرسالها لجميع الأعضاء الـ ${targetList.length}؟ (y/n) [افتراضي y]: `) || 'y';
      if (continueAll.toLowerCase() !== 'y' && continueAll.toLowerCase() !== 'yes') {
        console.log('تم إيقاف الإرسال بناءً على طلبك.');
        await browser.close();
        return;
      }
    } else {
      console.log('⚠️ تعذر إرسال رسالة التجربة. يرجى مراجعة الرقم.');
    }
  }

  // Process Main Target List
  const validTargets = targetList.filter(m => formatPhone(m.phone));
  const skippedNoPhone = targetList.filter(m => !formatPhone(m.phone));

  console.log('\n=============================================================');
  console.log(`🚀 بدء عملية الإرسال لـ ${validTargets.length} عضو مؤهل عبر واتساب...`);
  if (skippedNoPhone.length > 0) {
    console.log(`⚠️ تم استبعاد ${skippedNoPhone.length} عضو ليس لديهم رقم هاتف مسجل (متاحين في ملف روابط_الشباب_بدون_واتساب.txt)`);
  }
  console.log('⚠️ تم ضبط فاصل زمني أمان (5 - 8 ثوانٍ) بين كل رسالة لحماية حسابك.');
  console.log('=============================================================\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < validTargets.length; i++) {
    const m = validTargets[i];
    const globalIdx = members.findIndex(x => x.id === m.id) + 1;

    console.log(`\n[${i + 1}/${validTargets.length}] (عضو رقم ${globalIdx || i + 1} من ${members.length}) معالجة: ${m.name} (${m.id}) - تليفون: ${m.phone || 'بدون'}`);

    const msg = buildMessage(m, templateChoice, customText);
    const success = await sendMessageToContact(page, m, msg, report);

    if (success) successCount++;
    else failCount++;

    // Safety Delay (5 to 8 seconds)
    if (i < validTargets.length - 1) {
      const waitSeconds = Math.floor(Math.random() * 4) + 5;
      process.stdout.write(`   ⏳ انتظار أمان: `);
      for (let sec = waitSeconds; sec > 0; sec--) {
        process.stdout.write(`${sec}.. `);
        await sleep(1000);
      }
      console.log('');
    }
  }

  console.log('\n=============================================================');
  console.log(`🎉 اكتملت العملية بنجاح!`);
  console.log(`✅ إجمالي المرسل بنجاح: ${successCount}`);
  console.log(`❌ إجمالي غير المسجلين أو الفاشلين: ${failCount}`);
  console.log(`📄 تم حفظ التقرير في: ${path.basename(REPORT_FILE)}`);
  console.log('=============================================================\n');

  await ask('اضغط Enter لإغلاق المتصفح وإنهاء البرنامج...');
  await browser.close();
}

main().catch(err => {
  console.error('Fatal Error:', err);
});
