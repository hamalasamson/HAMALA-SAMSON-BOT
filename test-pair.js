const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const phoneNumber = '256727476291'; // CHANGE THIS
const sessionName = 'test';

async function testPair() {
  const SESSIONS_DIR = path.join(process.env.HOME, 'wabot', 'sessions', sessionName);
  if (fs.existsSync(SESSIONS_DIR)) {
    fs.rmSync(SESSIONS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });

  const authState = await useMultiFileAuthState(SESSIONS_DIR);
  const ver = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version: ver.version,
    auth: {
      creds: authState.state.creds,
      keys: makeCacheableSignalKeyStore(authState.state.keys, pino({ level: 'silent' }))
    },
    printQRInTerminal: false,
    browser: ['SONXX LITE MAIN DEV', 'Chrome', '120.0.0.0'],
    logger: pino({ level: 'silent' }),
    keepAliveIntervalMs: 60000,
    retryRequestDelayMs: 5000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000
  });

  sock.ev.on('creds.update', authState.saveCreds);

  // Wait for connection to open
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Connection timeout')), 30000);
    sock.ev.on('connection.update', (update) => {
      if (update.connection === 'open') {
        clearTimeout(timeout);
        resolve();
      }
      if (update.connection === 'close') {
        clearTimeout(timeout);
        reject(new Error('Connection closed'));
      }
    });
  });

  // Request pairing code
  const code = await sock.requestPairingCode(phoneNumber);
  const formatted = code.match(/.{1,4}/g).join('-');
  console.log('\n\x1b[32m[✓] Pairing code: ' + formatted + '\x1b[0m');
  console.log('\x1b[33mEnter this code in WhatsApp → Linked Devices → Link with phone number\x1b[0m');
}

testPair().catch(console.error);
