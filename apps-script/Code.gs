/**
 * Manish & Alivia wedding backend (Google Apps Script).
 * RSVPs are stored in a private GitHub repo. Photos are stored in Google Drive.
 * This file is public on GitHub, so secrets live in Script Properties:
 * GITHUB_TOKEN and ADMIN_PASSWORD. See SETUP.md.
 */
var DRIVE_FOLDER_ID = '1_hC7qifCuOezrvwijxSnAvIkNGzyK5HO';
var GITHUB_REPO = 'manishdhasmana49/manish-weds-alivia-rsvps';
var RSVP_FILE = 'rsvps.csv';
var RSVP_COLUMNS = [
  ['First Submitted', 'firstSubmitted'], ['Last Updated', 'updated'], ['Name', 'name'], ['Phone', 'phone'],
  ['Side', 'side'], ['Attending', 'attending'], ['Guests', 'guests'], ['Events', 'events'], ['Arrival', 'arrival'],
  ['Departure', 'departure'], ['With Dehradun Group', 'withGroup'], ['Accommodation', 'accommodation'],
  ['Food', 'food'], ['Message', 'message'],
];
var UPLOAD_LOG = 'uploads-log.json';
var PHOTO_LIMIT = 5;
var MAX_BYTES = 10 * 1024 * 1024;
var MAX_LOGIN_FAILURES = 8;
var LOGIN_LOCK_SECONDS = 900;

/** Run once from the editor, after adding the two Script Properties. */
function setup() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('GITHUB_TOKEN')) throw new Error('Add GITHUB_TOKEN in Project Settings > Script Properties.');
  if (!props.getProperty('ADMIN_PASSWORD')) throw new Error('Add ADMIN_PASSWORD in Project Settings > Script Properties.');

  // Fails here, not on the wedding day, if this account can't add files to the folder.
  DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile('setup-check.txt', 'Safe to delete.').setTrashed(true);

  // Confirms the GitHub token can read and write the private RSVP repo.
  var current = readRsvps_();
  writeRsvps_(current.rows, current.sha);

  if (!props.getProperty('TOKEN')) props.setProperty('TOKEN', Utilities.getUuid().replace(/-/g, ''));
  Logger.log('Setup complete. Paste this into config.js as backend.token: ' + props.getProperty('TOKEN'));
}

function doGet() {
  return json_({ ok: true, service: 'wedding-backend' });
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var token = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!token || body.token !== token) return json_(fail_('unauthorized', 'This request is not authorised.'));
    if (body.action === 'rsvp') return json_(withLock_(function () { return saveRsvp_(body); }));
    if (body.action === 'quota') return json_(quota_(body));
    if (body.action === 'upload') return json_(upload_(body));
    if (body.action === 'admin_rsvps') return json_(adminRsvps_(body));
    return json_(fail_('bad_action', 'Unknown request.'));
  } catch (err) {
    console.error(err);
    return json_(fail_('server_error', 'Something went wrong. Please try again.', true));
  }
}

/* ---------- RSVP ---------- */

function saveRsvp_(b) {
  var name = clean_(b.name, 100);
  var phone = normalisePhone_(b.phone);
  var side = b.side === 'groom' || b.side === 'bride' ? b.side : '';
  var attending = b.attending === 'yes' || b.attending === 'no' ? b.attending : '';
  if (!name) return fail_('invalid', 'Please enter your name.');
  if (!phone) return fail_('invalid', 'Please enter a valid 10-digit Indian mobile number.');
  if (!side) return fail_('invalid', 'Please choose a side.');
  if (!attending) return fail_('invalid', 'Please tell us if you can attend.');

  var yes = attending === 'yes';
  var guests = yes ? parseInt(b.guests, 10) : 0;
  if (yes && (!(guests >= 1) || guests > 50)) return fail_('invalid', 'Please enter the number of guests.');

  var now = new Date().toISOString();
  var record = {
    firstSubmitted: now, updated: now, name: name, phone: phone, side: side, attending: attending, guests: guests,
    events: yes && Array.isArray(b.events) ? b.events.slice(0, 20).map(function (x) { return clean_(x, 80); }) : [],
    arrival: yes ? dateText_(b.arrival) : '', departure: yes ? dateText_(b.departure) : '',
    withGroup: yes && side === 'groom' ? yesNo_(b.withGroup) : '', accommodation: yes ? yesNo_(b.accommodation) : '',
    food: yes ? clean_(b.food, 30) : '', message: clean_(b.message, 1000),
  };

  for (var attempt = 0; attempt < 2; attempt++) {
    var data = readRsvps_();
    var index = -1;
    data.rows.forEach(function (r, i) { if (r.phone === phone) index = i; });
    var updated = index >= 0;
    if (updated) { record.firstSubmitted = data.rows[index].firstSubmitted; data.rows[index] = record; } else data.rows.push(record);
    if (writeRsvps_(data.rows, data.sha)) return { ok: true, updated: updated };
  }
  return fail_('busy', 'Please try again in a moment.', true);
}

function adminRsvps_(b) {
  var cache = CacheService.getScriptCache();
  var failures = parseInt(cache.get('admin_failures'), 10) || 0;
  if (failures >= MAX_LOGIN_FAILURES) return fail_('locked', 'Too many attempts. Please try again in 15 minutes.');
  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected || digest_(String(b.password || '')) !== digest_(expected)) {
    cache.put('admin_failures', String(failures + 1), LOGIN_LOCK_SECONDS);
    return fail_('bad_password', 'That password is not correct.');
  }
  cache.remove('admin_failures');
  return { ok: true, rows: readRsvps_().rows };
}

/* ---------- Private GitHub storage ---------- */

function github_(method, payload) {
  var options = {
    method: method, muteHttpExceptions: true, contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'),
      Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
    },
  };
  if (payload) options.payload = JSON.stringify(payload);
  return UrlFetchApp.fetch('https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + RSVP_FILE, options);
}

function readRsvps_() {
  var res = github_('get');
  if (res.getResponseCode() !== 200) throw new Error('GitHub read failed: ' + res.getResponseCode());
  var file = JSON.parse(res.getContentText());
  var text = Utilities.newBlob(Utilities.base64Decode(String(file.content).replace(/\s/g, ''))).getDataAsString('UTF-8');
  return { rows: parseRsvpCsv_(text), sha: file.sha };
}

/** Returns false when another save got there first, so the caller can retry. */
function writeRsvps_(rows, sha) {
  var res = github_('put', {
    message: 'Update RSVPs', sha: sha,
    content: Utilities.base64Encode(rsvpCsv_(rows), Utilities.Charset.UTF_8),
  });
  var code = res.getResponseCode();
  if (code === 200 || code === 201) return true;
  if (code === 409) return false;
  throw new Error('GitHub write failed: ' + code);
}

/* ---------- CSV ---------- */

/** The leading byte-order mark lets Excel show Hindi and Bengali names correctly. */
function rsvpCsv_(rows) {
  var lines = [RSVP_COLUMNS.map(function (c) { return csvCell_(c[0]); }).join(',')];
  rows.forEach(function (r) {
    lines.push(RSVP_COLUMNS.map(function (c) {
      var value = c[1] === 'events' ? (r.events || []).join('; ') : r[c[1]];
      return csvCell_(value == null ? '' : String(value));
    }).join(','));
  });
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

/** Stops guest text from running as a formula when the file is opened in a spreadsheet. */
function csvCell_(value) {
  var text = /^'*[=+\-@\t\r]/.test(value) ? "'" + value : value;
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function parseCsvLines_(text) {
  var rows = [], row = [], cell = '', quoted = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    if (quoted) {
      if (ch === '"' && text.charAt(i + 1) === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

function parseRsvpCsv_(text) {
  var table = parseCsvLines_(String(text || '').replace(/^\uFEFF/, ''));
  if (table.length < 2) return [];
  var header = table[0];
  return table.slice(1).filter(function (cells) { return cells.join('') !== ''; }).map(function (cells) {
    var record = {};
    RSVP_COLUMNS.forEach(function (c) {
      var value = cells[header.indexOf(c[0])] || '';
      record[c[1]] = /^'+[=+\-@\t\r]/.test(value) ? value.slice(1) : value;
    });
    record.guests = parseInt(record.guests, 10) || 0;
    record.events = record.events ? record.events.split('; ') : [];
    return record;
  });
}

/* ---------- Photos ---------- */

function quota_(b) {
  var deviceId = cleanDevice_(b.deviceId);
  if (!deviceId) return fail_('invalid', 'Missing device ID.');
  var used = readUploads_().rows.filter(function (r) { return r.deviceId === deviceId; }).length;
  return { ok: true, used: used, limit: PHOTO_LIMIT };
}

function upload_(b) {
  var deviceId = cleanDevice_(b.deviceId);
  var uploadId = cleanDevice_(b.uploadId);
  var name = clean_(b.name, 60);
  var eventName = clean_(b.event, 80).replace(/[\/\\]/g, '-');
  if (!deviceId || !uploadId) return fail_('invalid', 'Missing upload details.');
  if (!name) return fail_('invalid', 'Please enter your name.');
  if (!eventName) return fail_('invalid', 'Please choose an event.');
  if (b.mimeType !== 'image/jpeg') return fail_('bad_type', 'Only images can be uploaded.');

  var data = String(b.data || '');
  if (data.length > Math.ceil(MAX_BYTES / 3) * 4) return fail_('too_large', 'This photo is larger than 10 MB.');
  var bytes;
  try { bytes = Utilities.base64Decode(data); } catch (err) { return fail_('bad_type', 'This file could not be read.'); }
  if (bytes.length > MAX_BYTES) return fail_('too_large', 'This photo is larger than 10 MB.');
  if (bytes.length < 3 || (bytes[0] & 255) !== 0xFF || (bytes[1] & 255) !== 0xD8 || (bytes[2] & 255) !== 0xFF) {
    return fail_('bad_type', 'Only images can be uploaded.');
  }

  // The lock makes the 5-photo count reliable when a guest double-submits.
  return withLock_(function () {
    var log = readUploads_();
    // A retry after a lost response must not save a duplicate or use up quota.
    var mine = log.rows.filter(function (r) { return r.deviceId === deviceId; });
    var previous = mine.filter(function (r) { return r.uploadId === uploadId; })[0];
    if (previous) return { ok: true, duplicate: true, used: mine.length, limit: PHOTO_LIMIT };
    if (mine.length >= PHOTO_LIMIT) {
      return { ok: false, code: 'limit', error: 'You have already shared ' + PHOTO_LIMIT + ' photos. Thank you!', used: mine.length, limit: PHOTO_LIMIT };
    }

    var folder = eventFolder_(eventName);
    var filename = uniqueFilename_(folder, name);
    var file = folder.createFile(Utilities.newBlob(bytes, 'image/jpeg', filename));
    log.rows.push({ time: new Date().toISOString(), name: name, deviceId: deviceId, event: eventName, fileUrl: file.getUrl(), uploadId: uploadId });
    writeUploads_(log);
    return { ok: true, used: mine.length + 1, limit: PHOTO_LIMIT };
  });
}

function readUploads_() {
  var found = DriveApp.getFolderById(DRIVE_FOLDER_ID).getFilesByName(UPLOAD_LOG);
  if (!found.hasNext()) return { file: null, rows: [] };
  var file = found.next();
  return { file: file, rows: JSON.parse(file.getBlob().getDataAsString('UTF-8') || '[]') };
}

function writeUploads_(log) {
  var text = JSON.stringify(log.rows);
  if (log.file) log.file.setContent(text);
  else DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(UPLOAD_LOG, text, 'application/json');
}

function eventFolder_(eventName) {
  var root = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  var existing = root.getFoldersByName(eventName);
  return existing.hasNext() ? existing.next() : root.createFolder(eventName);
}

/** Names a photo after the guest: "Riya Sharma.jpg", then "Riya Sharma 2.jpg". */
function uniqueFilename_(folder, guestName) {
  var base = String(guestName).replace(/[\/\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Guest';
  var filename = base + '.jpg';
  for (var n = 2; folder.getFilesByName(filename).hasNext(); n++) filename = base + ' ' + n + '.jpg';
  return filename;
}

/* ---------- Helpers ---------- */

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return fail_('busy', 'Many guests are sending at once. Retrying…', true);
  try { return fn(); } finally { lock.releaseLock(); }
}

function digest_(text) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8));
}

function normalisePhone_(value) {
  var digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.slice(2);
  if (digits.length === 11 && digits.charAt(0) === '0') digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : '';
}

function clean_(value, max) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001F\u007F]+/g, ' ').trim().slice(0, max);
}

function cleanDevice_(value) {
  var id = String(value || '');
  return /^[A-Za-z0-9-]{8,64}$/.test(id) ? id : '';
}

function dateText_(value) {
  var text = String(value || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function yesNo_(value) {
  return value === 'yes' || value === 'no' ? value : '';
}

function fail_(code, error, retryable) {
  return { ok: false, code: code, error: error, retryable: !!retryable };
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
