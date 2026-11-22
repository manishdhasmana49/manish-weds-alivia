/**
 * Manish & Alivia wedding backend (Google Apps Script).
 * Run setup() once, then deploy as a web app. See SETUP.md.
 * This file is public on GitHub, so secrets live in Script Properties.
 */
var DRIVE_FOLDER_ID = '1_hC7qifCuOezrvwijxSnAvIkNGzyK5HO';
var RSVP_SHEET = 'RSVP';
var UPLOADS_SHEET = 'Uploads';
var PHOTO_LIMIT = 5;
var MAX_BYTES = 10 * 1024 * 1024;

var RSVP_HEADERS = ['Timestamp', 'Full Name', 'Phone', 'Side', 'Attending', 'Guests', 'Events',
  'Arrival', 'Departure', 'Travelling With Group', 'Accommodation Needed', 'Food', 'Message'];
var UPLOAD_HEADERS = ['Time', 'Name', 'Device ID', 'Event', 'File URL', 'Upload ID'];

/** Run once from the editor. Safe to run again: it keeps the existing token. */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!props.getProperty('SHEET_ID')) {
    if (!active) throw new Error('Open Apps Script from the Sheet (Extensions > Apps Script), or set SHEET_ID.');
    props.setProperty('SHEET_ID', active.getId());
  }
  // Fails here, not on the wedding day, if this account can't add files to the folder.
  var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  folder.createFile('setup-check.txt', 'Safe to delete.').setTrashed(true);
  props.setProperty('ROOT_FOLDER_ID', DRIVE_FOLDER_ID);
  if (!props.getProperty('TOKEN')) {
    props.setProperty('TOKEN', Utilities.getUuid().replace(/-/g, ''));
  }
  getSheet_(RSVP_SHEET, RSVP_HEADERS);
  getSheet_(UPLOADS_SHEET, UPLOAD_HEADERS);
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
  var events = yes && Array.isArray(b.events) ? b.events.slice(0, 20).map(function (x) { return clean_(x, 80); }).join(', ') : '';

  var row = [new Date(), safe_(name), phone, side, attending, guests, safe_(events),
    yes ? dateText_(b.arrival) : '', yes ? dateText_(b.departure) : '',
    yes && side === 'groom' ? yesNo_(b.withGroup) : '', yes ? yesNo_(b.accommodation) : '',
    yes ? safe_(clean_(b.food, 30)) : '', safe_(clean_(b.message, 1000))];

  var sheet = getSheet_(RSVP_SHEET, RSVP_HEADERS);
  var last = sheet.getLastRow();
  var rowNumber = -1;
  if (last > 1) {
    var phones = sheet.getRange(2, 3, last - 1, 1).getDisplayValues();
    for (var i = 0; i < phones.length; i++) {
      if (String(phones[i][0]).replace(/\D/g, '').slice(-10) === phone) { rowNumber = i + 2; break; }
    }
  }
  var updated = rowNumber > 0;
  if (!updated) rowNumber = last + 1;
  sheet.getRange(rowNumber, 3).setNumberFormat('@');
  sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
  return { ok: true, updated: updated };
}

/* ---------- Photos ---------- */

function quota_(b) {
  var deviceId = cleanDevice_(b.deviceId);
  if (!deviceId) return fail_('invalid', 'Missing device ID.');
  var used = readUploads_().filter(function (r) { return r[2] === deviceId; }).length;
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
    var rows = readUploads_();
    // A retry after a lost response must not save a duplicate or use up quota.
    var mine = rows.filter(function (r) { return r[2] === deviceId; });
    var previous = mine.filter(function (r) { return r[5] === uploadId; })[0];
    if (previous) return { ok: true, duplicate: true, used: mine.length, limit: PHOTO_LIMIT };
    if (mine.length >= PHOTO_LIMIT) {
      return { ok: false, code: 'limit', error: 'You have already shared ' + PHOTO_LIMIT + ' photos. Thank you!', used: mine.length, limit: PHOTO_LIMIT };
    }

    var now = new Date();
    var folder = eventFolder_(eventName);
    var filename = uniqueFilename_(folder, name);
    var file = folder.createFile(Utilities.newBlob(bytes, 'image/jpeg', filename));
    getSheet_(UPLOADS_SHEET, UPLOAD_HEADERS).appendRow([now, safe_(name), deviceId, safe_(eventName), file.getUrl(), uploadId]);
    return { ok: true, used: mine.length + 1, limit: PHOTO_LIMIT };
  });
}

function readUploads_() {
  var sheet = getSheet_(UPLOADS_SHEET, UPLOAD_HEADERS);
  var last = sheet.getLastRow();
  return last > 1 ? sheet.getRange(2, 1, last - 1, UPLOAD_HEADERS.length).getDisplayValues() : [];
}

function eventFolder_(eventName) {
  var id = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
  if (!id) throw new Error('Run setup() first.');
  var root = DriveApp.getFolderById(id);
  var existing = root.getFoldersByName(eventName);
  return existing.hasNext() ? existing.next() : root.createFolder(eventName);
}

/* ---------- Helpers ---------- */

function getSheet_(name, headers) {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Run setup() first.');
  var book = SpreadsheetApp.openById(id);
  var sheet = book.getSheetByName(name) || book.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return fail_('busy', 'Many guests are sending at once. Retrying…', true);
  try { return fn(); } finally { lock.releaseLock(); }
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

/** Stops guest text from running as a spreadsheet formula. */
function safe_(text) {
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function cleanDevice_(value) {
  var id = String(value || '');
  return /^[A-Za-z0-9-]{8,64}$/.test(id) ? id : '';
}

function dateText_(value) {
  var text = String(value || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? "'" + text : '';
}

function yesNo_(value) {
  return value === 'yes' || value === 'no' ? value : '';
}

/** Names a photo after the guest: "Riya Sharma.jpg", then "Riya Sharma 2.jpg". */
function uniqueFilename_(folder, guestName) {
  var base = String(guestName).replace(/[\/\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Guest';
  var filename = base + '.jpg';
  for (var n = 2; folder.getFilesByName(filename).hasNext(); n++) filename = base + ' ' + n + '.jpg';
  return filename;
}

function fail_(code, error, retryable) {
  return { ok: false, code: code, error: error, retryable: !!retryable };
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
