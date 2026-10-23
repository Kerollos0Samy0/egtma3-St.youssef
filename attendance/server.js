const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, 'attendance_db.json');

// Initial seed data with servants from Book1.xlsx
const DEFAULT_DATA = {
  members: [
    { id: "SM-01", name: "ريموندا عزمي", family: "الأسرة أ", phone: "01200000001", role: "أمين قلب واحد", active: true },
    { id: "SM-02", name: "بولا هشام", family: "الأسرة أ", phone: "01200000002", role: "مساعد قلب واحد", active: true },
    { id: "SM-03", name: "ساندي ميلاد", family: "الأسرة أ", phone: "01200000003", role: "أمين ديكور", active: true },
    { id: "SM-04", name: "كيرلس بطرس", family: "الأسرة ب", phone: "01200000004", role: "أمين الافتقاد", active: true },
    { id: "SM-05", name: "هيلانة اشرف", family: "الأسرة ب", phone: "01200000005", role: "مساعد الافتقاد", active: true },
    { id: "SM-06", name: "فيرونيا عزمي", family: "الأسرة ب", phone: "01200000006", role: "عضو افتقاد", active: true },
    { id: "SM-07", name: "بافلي داود", family: "الأسرة ج", phone: "01200000007", role: "أمين الميديا", active: true },
    { id: "SM-08", name: "مينا ايهاب", family: "الأسرة ج", phone: "01200000008", role: "مساعد ميديا", active: true },
    { id: "SM-09", name: "توني عادل", family: "الأسرة ج", phone: "01200000009", role: "عضو ميديا", active: true },
    { id: "SM-10", name: "بولا ايليا", family: "الأسرة أ", phone: "01200000010", role: "أمين Revive", active: true },
    { id: "SM-11", name: "جومانا عاطف", family: "الأسرة أ", phone: "01200000011", role: "مساعد Revive", active: true },
    { id: "SM-12", name: "كريم شريف", family: "الأسرة أ", phone: "01200000012", role: "عضو Revive", active: true },
    { id: "SM-13", name: "مينا عادل شفيق", family: "الأسرة ب", phone: "01200000013", role: "أمين الكتاب المقدس", active: true },
    { id: "SM-14", name: "انجيل هاني", family: "الأسرة ب", phone: "01200000014", role: "مساعد الكتاب المقدس", active: true },
    { id: "SM-15", name: "ماريا وحيد", family: "الأسرة ب", phone: "01200000015", role: "عضو دراسة كتاب", active: true },
    { id: "SM-16", name: "دافيد ايهاب", family: "الأسرة ج", phone: "01200000016", role: "أمين التسبيح", active: true },
    { id: "SM-17", name: "كارين فيكتور", family: "الأسرة ج", phone: "01200000017", role: "مساعد تسبيح", active: true },
    { id: "SM-18", name: "يوستينا جورج", family: "الأسرة ج", phone: "01200000018", role: "عضو كورال", active: true },
    { id: "SM-19", name: "ميريام جورج", family: "الأسرة أ", phone: "01200000019", role: "مساعد ديكور", active: true },
    { id: "SM-20", name: "شيري فادي", family: "الأسرة أ", phone: "01200000020", role: "عضو ديكور", active: true },
    { id: "SM-21", name: "مارتينا مدحت", family: "الأسرة ب", phone: "01200000021", role: "أمين المطبخ", active: true },
    { id: "SM-22", name: "مادونا عاطف", family: "الأسرة ب", phone: "01200000022", role: "مساعد مطبخ", active: true },
    { id: "SM-23", name: "مريم سعيد انور", family: "الأسرة ب", phone: "01200000023", role: "عضو ضيافة", active: true },
    { id: "SM-24", name: "توماس ملاك", family: "أمناء الاجتماع", phone: "01200000024", role: "أمين الصلاة", active: true },
    { id: "SM-25", name: "سارة يحي", family: "أمناء الاجتماع", phone: "01200000025", role: "مساعد صلاة", active: true },
    { id: "SM-26", name: "ماريا ايليا", family: "أمناء الاجتماع", phone: "01200000026", role: "عضو صلاة", active: true }
  ],
  sessions: [
    { id: "SES-01", date: "2026-11-03", title: "افتتاح الجدول والتعارف", family: "الأسرة أ", attendees: [] },
    { id: "SES-02", date: "2026-11-10", title: "أنا مين؟ هويتي وقيمتي", family: "الأسرة ب", attendees: [] },
    { id: "SES-03", date: "2026-11-17", title: "لعبة تعارف وتحديات جماعية", family: "الأسرة ج", attendees: [] },
    { id: "SES-04", date: "2026-11-24", title: "استعداد لصوم الميلاد", family: "أمناء الاجتماع", attendees: [] },
    { id: "SES-05", date: "2026-12-01", title: "التوبة: بداية جديدة", family: "الأسرة أ", attendees: [] }
  ],
  visitationNotes: []
};

// Load or initialize DB
function getDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading DB file, reinitializing:", err);
  }
  saveDB(DEFAULT_DATA);
  return DEFAULT_DATA;
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing DB file:", err);
  }
}

// Ensure DB exists
getDB();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // Enable CORS for local network multi-device access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // API Endpoints
  if (pathname.startsWith('/api/')) {
    const db = getDB();

    // GET /api/data
    if (pathname === '/api/data' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(db));
      return;
    }

    // POST /api/scan (Register Attendance)
    if (pathname === '/api/scan' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { memberId, sessionId, timestamp } = JSON.parse(body);
          const member = db.members.find(m => m.id === memberId || m.name === memberId || m.phone === memberId);
          if (!member) {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'عضواً غير موجود بالنظام' }));
            return;
          }

          let session = db.sessions.find(s => s.id === sessionId);
          if (!session) {
            session = db.sessions[db.sessions.length - 1]; // default to latest session
          }

          if (!session.attendees) session.attendees = [];

          const alreadyAttended = session.attendees.find(a => a.memberId === member.id);
          if (alreadyAttended) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: false,
              alreadyRegistered: true,
              member,
              time: alreadyAttended.time,
              message: `تم تسجيل حضور ${member.name} مسبقاً في تمام الساعة ${alreadyAttended.time}`
            }));
            return;
          }

          const recordTime = timestamp || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
          session.attendees.push({
            memberId: member.id,
            name: member.name,
            family: member.family,
            time: recordTime,
            date: new Date().toISOString().split('T')[0]
          });

          saveDB(db);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            member,
            time: recordTime,
            totalSessionAttendees: session.attendees.length,
            message: `أهلاً بك يا ${member.name} (${member.family})! تم تسجيل الحضور بنجاح.`
          }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في معالجة البيانات' }));
        }
      });
      return;
    }

    // POST /api/members (Add new member)
    if (pathname === '/api/members' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const newMember = JSON.parse(body);
          if (!newMember.id) {
            const maxNum = db.members.reduce((max, m) => {
              const num = parseInt((m.id || '').replace('SM-', '')) || 0;
              return num > max ? num : max;
            }, 0);
            newMember.id = `SM-${String(maxNum + 1).padStart(2, '0')}`;
          }
          newMember.active = true;
          db.members.push(newMember);
          saveDB(db);
          res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, member: newMember }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في إضافة العضو' }));
        }
      });
      return;
    }

    // POST /api/sessions (Add new session)
    if (pathname === '/api/sessions' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const newSession = JSON.parse(body);
          if (!newSession.id) {
            newSession.id = `SES-${String(db.sessions.length + 1).padStart(2, '0')}`;
          }
          if (!newSession.attendees) newSession.attendees = [];
          db.sessions.push(newSession);
          saveDB(db);
          res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, session: newSession }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في إنشاء اللقاء' }));
        }
      });
      return;
    }

    // Fallback 404 for unknown api
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback to index.html for SPA
        fs.readFile(path.join(__dirname, 'index.html'), (err2, content2) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('الملف غير موجود');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content2);
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`==========================================================`);
  console.log(` نظام حضور وغياب الشباب بالـ QR Code - كنيسة السيدة العذراء `);
  console.log(` يعمل بنجاح على المنفذ: http://localhost:${PORT}`);
  console.log(` للوصول من الموبايل أو أي جهاز على نفس شبكة الواي فاي:`);
  console.log(` افتح: http://<IP_الكمبيوتر>:${PORT}`);
  console.log(`==========================================================`);
});
