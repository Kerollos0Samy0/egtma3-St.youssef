/**
 * إرسال رابط اللوكيشن تجريبياً لكيرلس وميريام عبر واتساب
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SESSION_DIR = path.join(__dirname, 'whatsapp_session');
const browserPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

const targets = [
  {
    name: 'كيرلس سامي عزيز',
    firstName: 'كيرلس',
    phone: '201200093605',
    link: 'https://st-youssef.vercel.app/location?id=KH-06',
    msg: `سلام ونعمة يا كيرلس 🤍✨
يا رب تكون بخير دايماً 🙏

عشان لجنة الافتقاد تكون قريبة منك ونعرف نوصلك بسهولة 🚗🏠
يرجى فتح الرابط التالي لتحديد موقع بيتك على الخريطة في ثواني:
👉 https://st-youssef.vercel.app/location?id=KH-06

شكراً جداً لمحبتك وتعاونك معانا! 🌸✨`
  },
  {
    name: 'ميريام سامي عزيز',
    firstName: 'ميريام',
    phone: '201289955837',
    link: 'https://st-youssef.vercel.app/location?id=A34',
    msg: `سلام ونعمة يا ميريام 🤍✨
يا رب تكوني بخير دايماً 🙏

عشان لجنة الافتقاد تكون قريبة منكِ ونعرف نوصلك بسهولة 🚗🏠
يرجى فتح الرابط التالي لتحديد موقع بيتك على الخريطة في ثواني:
👉 https://st-youssef.vercel.app/location?id=A34

شكراً جداً لمحبتكِ وتعاونكِ معانا! 🌸✨`
  }
];

async function sendToOne(page, item) {
  console.log(`\n⏳ جاري الإرسال إلى ${item.name} (${item.phone})...`);
  const chatUrl = `https://web.whatsapp.com/send?phone=${item.phone}&text=${encodeURIComponent(item.msg)}`;
  await page.goto(chatUrl, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(3000);

  // Check invalid number popup
  const invalidAlert = await page.$('div[data-animate-modal-body="true"], [data-testid="popup-contents"]');
  if (invalidAlert) {
    const alertText = await page.evaluate(el => el.innerText, invalidAlert);
    if (alertText.includes('invalid') || alertText.includes('غير صحيح') || alertText.includes('غير مسجل')) {
      console.log(`❌ الرقم غير مسجل في واتساب: ${item.phone}`);
      const okBtn = await page.$('button[data-testid="popup-controls-ok"], button');
      if (okBtn) await okBtn.click();
      return false;
    }
  }

  console.log('   ⏳ انتظار تحميل صندوق الرسالة...');
  await page.waitForSelector('footer div[contenteditable="true"]', { timeout: 20000 });
  await sleep(1500);

  await page.focus('footer div[contenteditable="true"]');
  await sleep(300);
  await page.keyboard.press('End');
  await page.keyboard.press('Space');
  await page.keyboard.press('Backspace');
  await sleep(500);

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
    await sleep(800);
  }

  console.log(`✅ تم إرسال الرابط بنجاح إلى: ${item.name} (${item.phone})`);
  await sleep(2000);
  return true;
}

async function main() {
  console.log('\n=============================================================');
  console.log('   🚀 إرسال رابط اللوكيشن تجريبياً لكيرلس وميريام عبر واتساب');
  console.log('=============================================================\n');

  console.log('⏳ جاري تشغيل المتصفح وفتح WhatsApp Web...');
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

  console.log('📱 في انتظار الدخول إلى WhatsApp Web...');
  try {
    await page.waitForSelector('div[contenteditable="true"], [data-icon="chat"], #side', { timeout: 120000 });
    console.log('✅ تم تسجيل الدخول بنجاح إلى WhatsApp Web!\n');
  } catch (e) {
    console.error('❌ انتهت مهلة تسجيل الدخول. يرجى مسح الـ QR وإعادة المحاولة.');
    await browser.close();
    return;
  }

  for (let i = 0; i < targets.length; i++) {
    await sendToOne(page, targets[i]);
    if (i < targets.length - 1) {
      console.log('⏳ انتظار أمان 5 ثوانٍ...');
      await sleep(5000);
    }
  }

  console.log('\n=============================================================');
  console.log('🎉 اكتمل إرسال التجربة بنجاح لكيرلس وميريام!');
  console.log('=============================================================\n');

  await ask('اضغط Enter لإغلاق المتصفح...');
  await browser.close();
}

main().catch(err => console.error('Error:', err.message));
