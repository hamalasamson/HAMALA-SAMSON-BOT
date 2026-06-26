const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const connect = require('./connect');
const state = require('./state');
const logger = require('./logger');

const SESSIONS_DIR = connect.SESSIONS_DIR;
const METADATA_FILE = path.join(SESSIONS_DIR, 'sessions.json');

function loadMetadata() {
  try { return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8')); } catch { return {}; }
}
function saveMetadata(meta) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(meta, null, 2));
}

function listSessions() {
  const dirs = connect.getSessions();
  const meta = loadMetadata();
  return dirs.map(name => ({
    name,
    owner: meta[name]?.owner || null,
    started: !!state.sockets[name],
    credsExist: fs.existsSync(path.join(SESSIONS_DIR, name, 'creds.json'))
  }));
}

async function startSession(name) {
  if (state.sockets[name]) {
    logger.warn(`Session "${name}" already running`);
    return;
  }
  await connect.startBot(name);
}

function stopSession(name) {
  if (state.sockets[name]) {
    connect.stopBot(name);
    delete state.sockets[name];
    logger.info(`Stopped "${name}"`);
  } else {
    logger.warn(`Session "${name}" not running`);
  }
}

async function pairNewSession(name, phoneNumber) {
  const code = await connect.pairDevice(name, phoneNumber);
  if (!code) {
    throw new Error('Failed to get pairing code. Check your number and internet.');
  }
  const owner = phoneNumber.replace(/[^0-9]/g, '');
  const meta = loadMetadata();
  meta[name] = { owner };
  saveMetadata(meta);
  return code;
}

function getSessionOwner(name) {
  const meta = loadMetadata();
  return meta[name]?.owner || null;
}

// ─── Web server control ─────────────────────────────────────────
function startWebServer() {
  if (state.webServerProcess) {
    logger.warn('Web server already running');
    return false;
  }
  const proc = spawn('node', ['web.js'], {
    stdio: ['inherit', 'inherit', 'pipe'], // capture stderr
    detached: false
  });

  // Capture stderr to show errors
  proc.stderr.on('data', (data) => {
    const msg = data.toString();
    console.error('\x1b[31m[Web Server Error]\x1b[0m', msg);
    // Also store in logs
    if (global._webServerLogs) global._webServerLogs.push(msg);
    else global._webServerLogs = [msg];
  });

  state.webServerProcess = proc;
  proc.on('exit', (code) => {
    state.webServerProcess = null;
    if (code !== 0) {
      logger.error('Web server exited with code ' + code);
    } else {
      logger.info('Web server stopped');
    }
  });
  logger.success('Web server started on http://localhost:3000');
  console.log('🌐 Open http://localhost:3000 in your browser to pair.');
  return true;
}

function stopWebServer() {
  if (!state.webServerProcess) {
    logger.warn('Web server not running');
    return false;
  }
  state.webServerProcess.kill();
  state.webServerProcess = null;
  logger.info('Web server stopped');
  return true;
}

function webServerStatus() {
  return state.webServerProcess !== null;
}

module.exports = {
  loadMetadata,
  saveMetadata,
  listSessions,
  startSession,
  stopSession,
  pairNewSession,
  getSessionOwner,
  startWebServer,
  stopWebServer,
  webServerStatus,
  SESSIONS_DIR,
  METADATA_FILE
};
