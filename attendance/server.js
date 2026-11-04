const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, 'attendance_db.json');
const BACKUPS_DIR = path.join(__dirname, 'backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
  try {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  } catch (err) {
    console.error("Could not create backups directory:", err);
  }
}

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
    { id: "SES-01", date: "2026-11-03", title: "خدام", family: "خدام", attendees: [] },
    { id: "SES-02", date: "2026-11-10", title: "أسرة 1", family: "أسرة", attendees: [] },
    { id: "SES-03", date: "2026-11-17", title: "أسرة 2", family: "أسرة", attendees: [] },
    { id: "SES-04", date: "2026-11-24", title: "أسرة 3 (رفاع)", family: "أسرة", attendees: [] },
    { id: "SES-05", date: "2026-12-01", title: "أسرة", family: "أسرة", attendees: [] },
    { id: "SES-06", date: "2026-12-08", title: "أسرة", family: "أسرة", attendees: [] },
    { id: "SES-07", date: "2026-12-15", title: "أسرة", family: "أسرة", attendees: [] },
    { id: "SES-08", date: "2026-12-22", title: "سهرة لحد 12", family: "أمناء", attendees: [] },
    { id: "SES-09", date: "2026-12-25", title: "سهرة الجمعة 25/12", family: "أمناء", attendees: [] },
    { id: "SES-10", date: "2026-12-29", title: "حفلة الكريسماس", family: "أمناء", attendees: [] },
    { id: "SES-11", date: "2027-01-12", title: "خدام", family: "خدام", attendees: [] },
    { id: "SES-12", date: "2027-01-19", title: "خدام", family: "خدام", attendees: [] },
    { id: "SES-13", date: "2027-01-26", title: "Outing (أمناء)", family: "أمناء", attendees: [] },
    { id: "SES-14", date: "2027-02-02", title: "أسرة", family: "أسرة", attendees: [] },
    { id: "SES-15", date: "2027-02-09", title: "أسرة", family: "أسرة", attendees: [] },
    { id: "SES-16", date: "2027-02-16", title: "أسرة", family: "أسرة", attendees: [] },
    { id: "SES-17", date: "2027-02-23", title: "كورس", family: "كورس", attendees: [] },
    { id: "SES-18", date: "2027-03-02", title: "كورس", family: "كورس", attendees: [] },
    { id: "SES-19", date: "2027-03-09", title: "كورس", family: "كورس", attendees: [] },
    { id: "SES-20", date: "2027-03-16", title: "كورس", family: "كورس", attendees: [] },
    { id: "SES-21", date: "2027-03-23", title: "أسرة", family: "أسرة", attendees: [] },
    { id: "SES-22", date: "2027-03-30", title: "أسرة", family: "أسرة", attendees: [] },
    { id: "SES-23", date: "2027-04-06", title: "أسرة", family: "أسرة", attendees: [] },
    { id: "SES-24", date: "2027-04-13", title: "بانوراما", family: "بانوراما", attendees: [] },
    { id: "SES-25", date: "2027-04-20", title: "بانوراما", family: "بانوراما", attendees: [] }
  ],
  visitationNotes: []
};

// Safe Synchronous DB Reader
function getDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading DB file, reinitializing:", err);
  }
  saveDBAtomic(DEFAULT_DATA, false);
  return DEFAULT_DATA;
}

// Atomic File Writer with Rolling Backup
function saveDBAtomic(data, createBackup = true) {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    
    // 1. Write to temp file first
    fs.writeFileSync(tempFile, jsonStr, 'utf8');

    // 2. Atomic rename replaces target safely
    fs.renameSync(tempFile, DB_FILE);

    // 3. Create rolling snapshot backup if requested
    if (createBackup) {
      createRollingSnapshot(jsonStr);
    }
    return true;
  } catch (err) {
    console.error("Critical Error writing DB file atomically:", err);
    return false;
  }
}

// Rolling snapshot manager (keeps last 30 snapshots)
function createRollingSnapshot(jsonStr) {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUPS_DIR, `snapshot_${timestamp}.json`);
    fs.writeFileSync(backupFile, jsonStr, 'utf8');

    // Prune older backups if exceeding 30
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('snapshot_') && f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.statSync(path.join(BACKUPS_DIR, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 30) {
      files.slice(30).forEach(f => {
        try { fs.unlinkSync(path.join(BACKUPS_DIR, f.name)); } catch (e) {}
      });
    }
  } catch (err) {
    console.warn("Could not create rolling backup:", err.message);
  }
}

// Write Mutex Queue to prevent Race Conditions during concurrent scans
let writeQueue = Promise.resolve();
function queueDBWrite(mutatorFn) {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const db = getDB();
        const result = await mutatorFn(db);
        saveDBAtomic(db, true);
        resolve(result);
      } catch (err) {
        console.error("Mutex write error:", err);
        reject(err);
      }
    });
  });
}

// Update member visitation summary (last visitation, invitation, priest, servants)
function updateMemberVisitationSummary(member) {
  if (!member.visitations) member.visitations = [];
  member.visitations.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  member.visitationsCount = member.visitations.length;
  member.lastVisitation = member.visitations[0] || null;
  member.lastInvitation = member.visitations.find(v => v.type === 'invitation') || null;
  member.lastPriestVisit = member.visitations.find(v => v.type === 'priest') || null;
  member.lastServantVisit = member.visitations.find(v => v.type === 'servants') || null;
}

// Ensure DB exists on start
getDB();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
  '.pdf': 'application/pdf'
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

  // ==========================================
  // API ENDPOINTS
  // ==========================================
  if (pathname.startsWith('/api/')) {
    
    // GET /api/data - Full database fetch
    if (pathname === '/api/data' && req.method === 'GET') {
      const db = getDB();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(db));
      return;
    }

    // GET /api/auth-settings - Get synchronized RBAC settings & passwords
    if (pathname === '/api/auth-settings' && req.method === 'GET') {
      const db = getDB();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(db.authSettings || null));
      return;
    }

    // POST /api/auth-settings - Update synchronized RBAC settings & passwords
    if (pathname === '/api/auth-settings' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const settings = JSON.parse(body);
          await queueDBWrite(db => {
            db.authSettings = settings;
            return true;
          });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: e.message }));
        }
      });
      return;
    }

    
    // GET /api/family-meetings (Fetch scheduled family meetings)
    if (pathname === '/api/family-meetings' && req.method === 'GET') {
      const db = await readDB();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        meetings: db.familyMeetings || [],
        notifications: db.adminNotifications || []
      }));
      return;
    }

    // POST /api/family-meetings (Schedule or update a family meeting)
    if (pathname === '/api/family-meetings' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const meetingData = JSON.parse(body);
          if (!meetingData.family || !meetingData.date || !meetingData.topic) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'بيانات الاجتماع غير مكتملة (الأسرة، التاريخ، والموضوع مطلوبة).' }));
            return;
          }

          const result = await queueDBWrite(db => {
            if (!db.familyMeetings) db.familyMeetings = [];
            if (!db.adminNotifications) db.adminNotifications = [];

            const isEdit = Boolean(meetingData.id);
            let savedMeeting;

            if (isEdit) {
              const idx = db.familyMeetings.findIndex(m => m.id === meetingData.id);
              if (idx !== -1) {
                db.familyMeetings[idx] = { ...db.familyMeetings[idx], ...meetingData, updatedAt: new Date().toISOString() };
                savedMeeting = db.familyMeetings[idx];
              } else {
                savedMeeting = { ...meetingData, createdAt: new Date().toISOString() };
                db.familyMeetings.push(savedMeeting);
              }
            } else {
              savedMeeting = {
                id: 'FM-' + Date.now(),
                ...meetingData,
                createdAt: new Date().toISOString()
              };
              db.familyMeetings.unshift(savedMeeting);
            }

            const notif = {
              id: 'NOTIF-' + Date.now(),
              type: 'family_meeting',
              meetingId: savedMeeting.id,
              title: isEdit ? `📝 تعديل موعد اجتماع: ${savedMeeting.family}` : `📅 موعد اجتماع أسرة جديد: ${savedMeeting.family}`,
              message: `${isEdit ? 'تم تحديث' : 'تم تحديد'} موعد اجتماع ${savedMeeting.family} يوم ${savedMeeting.day || ''} ${savedMeeting.date} الساعة ${savedMeeting.time || ''} (${savedMeeting.location || 'قاعة الكنيسة'}).`,
              createdAt: new Date().toISOString(),
              read: false
            };
            db.adminNotifications.unshift(notif);
            if (db.adminNotifications.length > 50) db.adminNotifications = db.adminNotifications.slice(0, 50);

            return { meeting: savedMeeting, notification: notif };
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, ...result }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في معالجة موعد الاجتماع: ' + e.message }));
        }
      });
      return;
    }

    // DELETE /api/family-meetings/:id
    if (pathname.startsWith('/api/family-meetings/') && req.method === 'DELETE') {
      const meetingId = pathname.replace('/api/family-meetings/', '').trim();
      const result = await queueDBWrite(db => {
        if (!db.familyMeetings) db.familyMeetings = [];
        const initialLen = db.familyMeetings.length;
        db.familyMeetings = db.familyMeetings.filter(m => m.id !== meetingId);
        return { deleted: db.familyMeetings.length < initialLen };
      });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, ...result }));
      return;
    }

    // GET /api/backup - Download complete timestamped JSON backup
    if (pathname === '/api/backup' && req.method === 'GET') {
      const db = getDB();
      const dateStr = new Date().toISOString().split('T')[0];
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="egtma3_db_backup_${dateStr}.json"`
      });
      res.end(JSON.stringify(db, null, 2));
      return;
    }

    // GET /api/backups/list - Get rolling snapshots list
    if (pathname === '/api/backups/list' && req.method === 'GET') {
      try {
        if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
        const files = fs.readdirSync(BACKUPS_DIR)
          .filter(f => f.endsWith('.json'))
          .map(f => {
            const stat = fs.statSync(path.join(BACKUPS_DIR, f));
            return {
              filename: f,
              sizeBytes: stat.size,
              createdAt: stat.mtime
            };
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, backups: files }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
      return;
    }

    // POST /api/restore - Restore DB from uploaded JSON body
    if (pathname === '/api/restore' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const uploadedData = JSON.parse(body);
          if (!uploadedData.members || !Array.isArray(uploadedData.members)) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'صيغة الملف غير صالحة (بيانات الأعضاء مفقودة).' }));
            return;
          }

          await queueDBWrite(db => {
            // Backup current state first
            createRollingSnapshot(JSON.stringify(db, null, 2));
            // Overwrite with restored data
            db.members = uploadedData.members;
            if (uploadedData.sessions) db.sessions = uploadedData.sessions;
            if (uploadedData.visitationNotes) db.visitationNotes = uploadedData.visitationNotes;
            if (uploadedData.evaluationCriteria) db.evaluationCriteria = uploadedData.evaluationCriteria;
            if (uploadedData.familyEvaluations) db.familyEvaluations = uploadedData.familyEvaluations;
            return { memberCount: db.members.length, sessionCount: (db.sessions || []).length };
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, message: 'تم استعادة النسخة الاحتياطية بنجاح!' }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'الملف غير صالح أو تالف: ' + e.message }));
        }
      });
      return;
    }

    // POST /api/scan (Register Attendance with Concurrency Mutex Queue)
    if (pathname === '/api/scan' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { memberId, sessionId, timestamp } = JSON.parse(body);
          
          const result = await queueDBWrite(db => {
            const member = db.members.find(m => m.id === memberId || m.name === memberId || m.phone === memberId);
            if (!member) {
              return { notFound: true, message: 'عضواً غير موجود بالنظام' };
            }

            let session = db.sessions.find(s => s.id === sessionId);
            if (!session) {
              session = db.sessions[db.sessions.length - 1]; // default to latest session
            }

            if (!session.attendees) session.attendees = [];

            const alreadyAttended = session.attendees.find(a => a.memberId === member.id);
            if (alreadyAttended) {
              return {
                alreadyRegistered: true,
                member,
                time: alreadyAttended.time,
                message: `تم تسجيل حضور ${member.name} مسبقاً في تمام الساعة ${alreadyAttended.time}`
              };
            }

            const recordTime = timestamp || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            session.attendees.push({
              memberId: member.id,
              name: member.name,
              family: member.family || member.areaGroup || '',
              time: recordTime,
              date: new Date().toISOString().split('T')[0]
            });

            return {
              success: true,
              member,
              time: recordTime,
              totalSessionAttendees: session.attendees.length,
              message: `أهلاً بك يا ${member.name}! تم تسجيل الحضور بنجاح.`
            };
          });

          if (result.notFound) {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: result.message }));
          } else if (result.alreadyRegistered) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, ...result }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, ...result }));
          }
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
      req.on('end', async () => {
        try {
          const newMember = JSON.parse(body);
          const result = await queueDBWrite(db => {
            if (!newMember.id) {
              const maxNum = db.members.reduce((max, m) => {
                const num = parseInt((m.id || '').replace(/[^0-9]/g, '')) || 0;
                return num > max ? num : max;
              }, 0);
              newMember.id = `SM-${String(maxNum + 1).padStart(2, '0')}`;
            }
            newMember.active = true;
            db.members.push(newMember);
            return newMember;
          });

          res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, member: result }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في إضافة العضو' }));
        }
      });
      return;
    }

    // POST /api/members/update (Update member details in Directory)
    if (pathname === '/api/members/update' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const updated = JSON.parse(body);
          if (!updated.id) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'معرف العضو مطلوب' }));
            return;
          }
          const result = await queueDBWrite(db => {
            const idx = db.members.findIndex(m => m.id === updated.id);
            if (idx === -1) return { notFound: true };
            db.members[idx] = Object.assign({}, db.members[idx], updated);
            return db.members[idx];
          });

          if (result.notFound) {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'العضو غير موجود' }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, member: result }));
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في تعديل العضو: ' + e.message }));
        }
      });
      return;
    }

    // POST /api/sessions (Add new session)
    if (pathname === '/api/sessions' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const newSession = JSON.parse(body);
          const result = await queueDBWrite(db => {
            if (!newSession.id) {
              newSession.id = `SES-${String(db.sessions.length + 1).padStart(2, '0')}`;
            }
            if (!newSession.attendees) newSession.attendees = [];
            db.sessions.push(newSession);
            return newSession;
          });

          res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, session: result }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في إنشاء اللقاء' }));
        }
      });
      return;
    }

    // POST /api/points/add (Add or deduct points for a member)
    if (pathname === '/api/points/add' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          if (!data.memberId || typeof data.points !== 'number') {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'بيانات النقاط غير مكتملة' }));
            return;
          }

          const result = await queueDBWrite(db => {
            if (!db.pointsLog) db.pointsLog = [];
            const member = (db.members || []).find(m => m.id === data.memberId);
            const memberName = member ? member.name : (data.memberName || 'عضو');

            const transaction = {
              id: 'PT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              memberId: data.memberId,
              memberName: memberName,
              points: data.points,
              category: data.category || 'custom',
              reason: data.reason || 'نقاط تشجيعية',
              servant: data.servant || 'أمناء الاجتماع',
              date: data.date || new Date().toISOString().split('T')[0],
              time: data.time || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
              timestamp: Date.now()
            };

            db.pointsLog.unshift(transaction);
            if (member) {
              member.points = (Number(member.points) || 0) + data.points;
            }
            return { transaction, totalPoints: member ? member.points : 0 };
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, ...result }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في إضافة النقاط: ' + e.message }));
        }
      });
      return;
    }

    // POST /api/points/batch (Add points to multiple members at once)
    if (pathname === '/api/points/batch' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          if (!Array.isArray(data.memberIds) || typeof data.points !== 'number') {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'بيانات النقاط الجماعية غير مكتملة' }));
            return;
          }

          const result = await queueDBWrite(db => {
            if (!db.pointsLog) db.pointsLog = [];
            const now = Date.now();
            const dateStr = data.date || new Date().toISOString().split('T')[0];
            const timeStr = data.time || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            let count = 0;

            data.memberIds.forEach((mId, idx) => {
              const member = (db.members || []).find(m => m.id === mId);
              const memberName = member ? member.name : 'عضو';
              const transaction = {
                id: `PT-${now}-${idx}-${Math.floor(Math.random() * 1000)}`,
                memberId: mId,
                memberName: memberName,
                points: data.points,
                category: data.category || 'batch',
                reason: data.reason || 'نقاط جماعية',
                servant: data.servant || 'أمناء الاجتماع',
                date: dateStr,
                time: timeStr,
                timestamp: now
              };
              db.pointsLog.unshift(transaction);
              if (member) {
                member.points = (Number(member.points) || 0) + data.points;
              }
              count++;
            });
            return { updatedCount: count };
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, ...result }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في إضافة النقاط الجماعية' }));
        }
      });
      return;
    }

    // POST /api/points/delete (Undo a point transaction)
    if (pathname === '/api/points/delete' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          if (!data.transactionId) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'معرف العملية مطلوب' }));
            return;
          }

          const result = await queueDBWrite(db => {
            if (!db.pointsLog) db.pointsLog = [];
            const idx = db.pointsLog.findIndex(p => p.id === data.transactionId);
            if (idx === -1) return { notFound: true };

            const removed = db.pointsLog.splice(idx, 1)[0];
            const member = (db.members || []).find(m => m.id === removed.memberId);
            if (member) {
              member.points = (Number(member.points) || 0) - removed.points;
            }
            return { removed, totalPoints: member ? member.points : 0 };
          });

          if (result.notFound) {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'العملية غير موجودة' }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, ...result }));
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في حذف النقطة' }));
        }
      });
      return;
    }

    // POST /api/visitations/add (Add a single visitation record)
    if (pathname === '/api/visitations/add' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const entry = JSON.parse(body);
          if (!entry.memberId || !entry.type || !entry.date) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'بيانات الافتقاد غير مكتملة (المعرف، النوع، والتاريخ مطلوبة).' }));
            return;
          }

          const result = await queueDBWrite(db => {
            if (!db.visitationLog) db.visitationLog = [];
            const member = (db.members || []).find(m => m.id === entry.memberId);
            if (!member) return { notFound: true };

            if (!member.visitations) member.visitations = [];
            if (!entry.id) {
              entry.id = 'VIS-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            }
            entry.createdAt = entry.createdAt || new Date().toISOString();
            entry.memberName = member.name;

            member.visitations.unshift(entry);
            db.visitationLog.unshift(entry);

            updateMemberVisitationSummary(member);
            return { entry, member };
          });

          if (result.notFound) {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'العضو غير موجود بالنظام' }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, ...result }));
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في حفظ الافتقاد: ' + e.message }));
        }
      });
      return;
    }

    // POST /api/visitations/batch-invitations (Bulk assign weekly invitations)
    if (pathname === '/api/visitations/batch-invitations' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          if (!Array.isArray(data.memberIds) || data.memberIds.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'قائمة الأعضاء فارغة' }));
            return;
          }

          const result = await queueDBWrite(db => {
            if (!db.visitationLog) db.visitationLog = [];
            const now = Date.now();
            const dateStr = data.date || new Date().toISOString().split('T')[0];
            const servantStr = data.servant || 'خدام الافتقاد';
            const notesStr = data.notes || 'تم تسليم إنفتيشن الاجتماع الأسبوعي';
            let count = 0;

            data.memberIds.forEach((mId, idx) => {
              const member = (db.members || []).find(m => m.id === mId);
              if (member) {
                if (!member.visitations) member.visitations = [];
                const entry = {
                  id: `VIS-INV-${now}-${idx}-${Math.floor(Math.random() * 1000)}`,
                  memberId: member.id,
                  memberName: member.name,
                  type: 'invitation',
                  date: dateStr,
                  servant: servantStr,
                  father: '',
                  status: 'completed',
                  statusText: 'تم تسليم الانفتيشن',
                  notes: notesStr,
                  createdAt: new Date().toISOString()
                };
                member.visitations.unshift(entry);
                db.visitationLog.unshift(entry);
                updateMemberVisitationSummary(member);
                count++;
              }
            });
            return { updatedCount: count };
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, ...result }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في التوزيع الجماعي: ' + e.message }));
        }
      });
      return;
    }

    // POST /api/visitations/delete (Delete a visitation entry)
    if (pathname === '/api/visitations/delete' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { memberId, visitationId } = JSON.parse(body);
          if (!memberId || !visitationId) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'معرف العضو ومعرف الافتقاد مطلوبان' }));
            return;
          }

          const result = await queueDBWrite(db => {
            const member = (db.members || []).find(m => m.id === memberId);
            if (!member || !member.visitations) return { notFound: true };

            const idx = member.visitations.findIndex(v => v.id === visitationId);
            if (idx === -1) return { notFound: true };

            const removed = member.visitations.splice(idx, 1)[0];
            if (db.visitationLog) {
              const logIdx = db.visitationLog.findIndex(v => v.id === visitationId);
              if (logIdx !== -1) db.visitationLog.splice(logIdx, 1);
            }

            updateMemberVisitationSummary(member);
            return { removed, member };
          });

          if (result.notFound) {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, message: 'الافتقاد غير موجود' }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, ...result }));
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'خطأ في حذف الافتقاد: ' + e.message }));
        }
      });
      return;
    }

    // Fallback 404 for unknown api
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
    return;
  }

  // ==========================================
  // STATIC FILE SERVING
  // ==========================================
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
  console.log(` ✝ اجتماع يوسف الصديق للشباب - كنيسة السيدة العذراء `);
  console.log(` السيرفر الاحترافي يعمل بنجاح على المنفذ: http://localhost:${PORT}`);
  console.log(` للوصول من الموبايل على شبكة الواي فاي: http://<IP_الكمبيوتر>:${PORT}`);
  console.log(` نظام الحماية: الكتابة الذرية (Atomic Writes) والتسجيل المتزامن مفعل.`);
  console.log(` نظام النسخ الاحتياطي التلقائي (Rolling Backups) مفعل.`);
  console.log(`==========================================================`);
});
