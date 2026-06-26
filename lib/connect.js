var makeWASocket = require('@whiskeysockets/baileys').default;
var { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
var { Boom } = require('@hapi/boom');
var pino = require('pino');
var fs = require('fs');
var path = require('path');

var state = require('./state');
var logger = pino({ level: 'silent' });

var SESSIONS_DIR = path.join(process.env.HOME || '/data/data/com.termux/files/home', 'wabot', 'sessions');
var BACKUP_FILE = path.join(process.env.HOME || '/data/data/com.termux/files/home', 'wabot', 'data', 'session_backup.json');

if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(BACKUP_FILE))) fs.mkdirSync(path.dirname(BACKUP_FILE), { recursive: true });

function getSessions() {
  try {
    return fs.readdirSync(SESSIONS_DIR).filter(function(f) {
      var p = path.join(SESSIONS_DIR, f);
      return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'creds.json'));
    });
  } catch (e) { return []; }
}

function backupSession(name) {
  try {
    var cp = path.join(SESSIONS_DIR, name, 'creds.json');
    if (!fs.existsSync(cp)) return;
    var b = {
      name: name,
      creds: Buffer.from(fs.readFileSync(cp, 'utf8')).toString('base64'),
      saved: new Date().toISOString()
    };
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(b, null, 2));
  } catch (e) {}
}

function restoreSession(name) {
  try {
    if (!fs.existsSync(BACKUP_FILE)) return false;
    var b = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    var t = path.join(SESSIONS_DIR, name);
    if (!fs.existsSync(t)) fs.mkdirSync(t, { recursive: true });
    fs.writeFileSync(path.join(t, 'creds.json'), Buffer.from(b.creds, 'base64').toString('utf8'));
    return true;
  } catch (e) { return false; }
}

function deleteSession(name) {
  try {
    var sessionPath = path.join(SESSIONS_DIR, name);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
    if (state.sockets && state.sockets[name]) {
      delete state.sockets[name];
    }
    return true;
  } catch (e) { return false; }
}

function loadMetadata() {
  try {
    var file = path.join(SESSIONS_DIR, 'sessions.json');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return {}; }
}

function saveMetadata(meta) {
  try {
    var file = path.join(SESSIONS_DIR, 'sessions.json');
    fs.writeFileSync(file, JSON.stringify(meta, null, 2));
  } catch (e) {}
}

// ─── ATTACH HANDLER (exported) ──────────────────────────────────
function attachHandler(sock, sessionName, saveCreds) {
  var handler = require('./handler');
  sock.ev.on('creds.update', function() { saveCreds(); backupSession(sessionName); });
  sock.ev.on('call', async function(calls) { if (handler.handleCall) await handler.handleCall(sock, calls, sessionName); });
  sock.ev.on('connection.update', async function(update) {
    var connection = update.connection;
    var lastDisconnect = update.lastDisconnect;
    if (connection === 'close') {
      var code = lastDisconnect && lastDisconnect.error ? new Boom(lastDisconnect.error).output.statusCode : 500;
      if (code === DisconnectReason.loggedOut) {
        deleteSession(sessionName);
        var meta = loadMetadata();
        if (meta && meta[sessionName]) {
          delete meta[sessionName];
          saveMetadata(meta);
        }
      } else {
        setTimeout(function() { startBot(sessionName); }, 3000);
      }
    }
  });
  sock.ev.on('messages.upsert', async function(m) {
    if (m.type !== 'notify') return;
    for (var i = 0; i < m.messages.length; i++) {
      var msg = m.messages[i];
      if (msg.key.remoteJid === 'status@broadcast' && !msg.key.fromMe) {
        if (state.autoStatusView) { try { await sock.readMessages([msg.key]); } catch (e) {} }
        if (state.autoStatusLike) {
          try {
            var jidList = [msg.key.participant || msg.key.remoteJid];
            await sock.sendMessage('status@broadcast', { react: { text: '❤️', key: msg.key } }, { statusJidList: jidList });
          } catch (e) {}
        }
        continue;
      }
      await handler.handleMessage(sock, msg, sessionName);
    }
  });
}

async function startBot(sessionName) {
  var sessionPath = path.join(SESSIONS_DIR, sessionName);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });
  var authState = await useMultiFileAuthState(sessionPath);
  var ver = await fetchLatestBaileysVersion();
  var sock = makeWASocket({
    version: ver.version,
    auth: {
      creds: authState.state.creds,
      keys: makeCacheableSignalKeyStore(authState.state.keys, logger)
    },
    printQRInTerminal: false,
    browser: ['SONXX LITE MAIN DEV', 'Chrome', '120.0.0.0'],
    logger: logger,
    keepAliveIntervalMs: 60000,
    retryRequestDelayMs: 5000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000
  });
  attachHandler(sock, sessionName, authState.saveCreds);
  state.sockets[sessionName] = sock;
}

function stopBot(sessionName) {
  if (state.sockets[sessionName]) {
    state.sockets[sessionName].end();
    delete state.sockets[sessionName];
  }
}

async function pairDevice(sessionName, phoneNumber) {
  var sessionPath = path.join(SESSIONS_DIR, sessionName);
  if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
  fs.mkdirSync(sessionPath, { recursive: true });
  var authState = await useMultiFileAuthState(sessionPath);
  var ver = await fetchLatestBaileysVersion();
  var sock = makeWASocket({
    version: ver.version,
    auth: {
      creds: authState.state.creds,
      keys: makeCacheableSignalKeyStore(authState.state.keys, logger)
    },
    printQRInTerminal: false,
    browser: ['SONXX LITE MAIN DEV', 'Chrome', '120.0.0.0'],
    logger: logger,
    keepAliveIntervalMs: 60000,
    retryRequestDelayMs: 5000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000
  });
  sock.ev.on('creds.update', authState.saveCreds);
  var cleaned = phoneNumber.replace(/[^0-9]/g, '');
  if (cleaned.length < 7) return null;
  try {
    var pairCode = await sock.requestPairingCode(cleaned);
  } catch (e) { return null; }
  var formatted = pairCode.match(/.{1,4}/g).join('-');
  attachHandler(sock, sessionName, authState.saveCreds);
  state.sockets[sessionName] = sock;
  return formatted;
}

// ─── GENERATE QR (self‑contained) ──────────────────────────────
async function generateQR(sessionName) {
  var sessionPath = path.join(SESSIONS_DIR, sessionName);
  if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
  fs.mkdirSync(sessionPath, { recursive: true });

  var authState = await useMultiFileAuthState(sessionPath);
  var ver = await fetchLatestBaileysVersion();
  var sock = makeWASocket({
    version: ver.version,
    auth: {
      creds: authState.state.creds,
      keys: makeCacheableSignalKeyStore(authState.state.keys, logger)
    },
    printQRInTerminal: false,
    browser: ['SONXX LITE MAIN DEV', 'Chrome', '120.0.0.0'],
    logger: logger,
    keepAliveIntervalMs: 60000,
    retryRequestDelayMs: 5000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000
  });
  sock.ev.on('creds.update', authState.saveCreds);

  return new Promise(function(resolve, reject) {
    var timeout = setTimeout(function() {
      reject(new Error('QR generation timed out.'));
      sock.end();
    }, 60000);

    sock.ev.on('connection.update', function(update) {
      var qr = update.qr;
      var connection = update.connection;
      var lastDisconnect = update.lastDisconnect;

      if (qr) {
        clearTimeout(timeout);
        // Attach handler manually (copy of attachHandler logic)
        var handler = require('./handler');
        sock.ev.on('creds.update', function() { authState.saveCreds(); backupSession(sessionName); });
        sock.ev.on('call', async function(calls) { if (handler.handleCall) await handler.handleCall(sock, calls, sessionName); });
        sock.ev.on('connection.update', async function(upd) {
          if (upd.connection === 'close') {
            var code = upd.lastDisconnect && upd.lastDisconnect.error ? new Boom(upd.lastDisconnect.error).output.statusCode : 500;
            if (code === DisconnectReason.loggedOut) {
              deleteSession(sessionName);
              var meta = loadMetadata();
              if (meta && meta[sessionName]) {
                delete meta[sessionName];
                saveMetadata(meta);
              }
            } else {
              setTimeout(function() { startBot(sessionName); }, 3000);
            }
          }
        });
        sock.ev.on('messages.upsert', async function(m) {
          if (m.type !== 'notify') return;
          for (var i = 0; i < m.messages.length; i++) {
            var msg = m.messages[i];
            if (msg.key.remoteJid === 'status@broadcast' && !msg.key.fromMe) {
              if (state.autoStatusView) { try { await sock.readMessages([msg.key]); } catch (e) {} }
              if (state.autoStatusLike) {
                try {
                  var jidList = [msg.key.participant || msg.key.remoteJid];
                  await sock.sendMessage('status@broadcast', { react: { text: '❤️', key: msg.key } }, { statusJidList: jidList });
                } catch (e) {}
              }
              continue;
            }
            await handler.handleMessage(sock, msg, sessionName);
          }
        });
        state.sockets[sessionName] = sock;
        resolve(qr);
        return;
      }

      if (connection === 'close') {
        clearTimeout(timeout);
        var code = lastDisconnect && lastDisconnect.error ? new Boom(lastDisconnect.error).output.statusCode : 500;
        reject(new Error('Connection closed: ' + code));
        sock.end();
      }
    });
  });
}

module.exports = {
  startBot: startBot,
  stopBot: stopBot,
  pairDevice: pairDevice,
  generateQR: generateQR,
  getSessions: getSessions,
  backupSession: backupSession,
  restoreSession: restoreSession,
  deleteSession: deleteSession,
  attachHandler: attachHandler,
  SESSIONS_DIR: SESSIONS_DIR,
  BACKUP_FILE: BACKUP_FILE
};
