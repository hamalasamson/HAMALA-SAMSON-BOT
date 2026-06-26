const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const logger = pino({ level: 'silent' });
const SESSIONS_DIR = path.join(process.env.HOME || '/data/data/com.termux/files/home', 'wabot', 'sessions');

if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

async function pairDevice(sessionName, phoneNumber) {
  const sessionPath = path.join(SESSIONS_DIR, sessionName);

  if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
  fs.mkdirSync(sessionPath, { recursive: true });

  const authState = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: authState.state.creds,
      keys: makeCacheableSignalKeyStore(authState.state.keys, logger)
    },
    printQRInTerminal: false,
    logger,
    keepAliveIntervalMs: 30000,
    retryRequestDelayMs: 2000
  });

  sock.ev.on('creds.update', authState.saveCreds);

  if (!sock.authState.creds.registered) {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.length < 7) {
      console.log('[!] Invalid phone number.');
      return;
    }

    let code;
    try {
      code = await sock.requestPairingCode(cleaned);
    } catch (e) {
      console.log('[!] Failed to get code:', e.message);
      return;
    }

    const formatted = code.match(/.{1,4}/g).join('-');
    console.log('\n\x1b[32m╔═══════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[32m║    🔑  PAIRING CODE READY             ║\x1b[0m');
    console.log('\x1b[32m╠═══════════════════════════════════════╣\x1b[0m');
    console.log('\x1b[33m║         ' + formatted + '              ║\x1b[0m');
    console.log('\x1b[32m╠═══════════════════════════════════════╣\x1b[0m');
    console.log('\x1b[32m║  1) Open WhatsApp on ANOTHER phone   ║\x1b[0m');
    console.log('\x1b[32m║  2) Tap ⋮ → Linked Devices           ║\x1b[0m');
    console.log('\x1b[32m║  3) Link with phone number           ║\x1b[0m');
    console.log('\x1b[32m║  4) Enter the code above ↑           ║\x1b[0m');
    console.log('\x1b[32m╚═══════════════════════════════════════╝\x1b[0m\n');
    console.log('\x1b[33m[!] Keep this terminal open while pairing.\x1b[0m');
  }

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log('\x1b[32m[✓] Linked! Bot is now active.\x1b[0m');
      process.exit(0);
    }

    if (connection === 'close') {
      const code = new Boom(lastDisconnect?.error).output.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log('\x1b[31m[!] Logged out. Please pair again.\x1b[0m');
        process.exit(1);
      } else {
        console.log('\x1b[33m[~] Reconnecting... (' + code + ')\x1b[0m');
      }
    }
  });

  return sock;
}

// ── RUN ───────────────────────────────────
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\x1b[35m╔═══════════════════════════════════════╗\x1b[0m');
console.log('\x1b[35m║   SONXX LITE MAIN DEV - Pair Test   ║\x1b[0m');
console.log('\x1b[35m╚═══════════════════════════════════════╝\x1b[0m\n');

rl.question('Session name (e.g., main): ', function(sessionName) {
  sessionName = sessionName.trim() || 'main';
  
  rl.question('Phone number (with country code, no +): ', function(phone) {
    rl.close();
    
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length < 7) {
      console.log('\x1b[31m[!] Invalid phone number.\x1b[0m');
      process.exit(1);
    }
    
    console.log('\n\x1b[36m[+] Starting pairing...\x1b[0m');
    console.log('\x1b[36m[+] Session: ' + sessionName + '\x1b[0m');
    console.log('\x1b[36m[+] Number: +' + cleaned + '\x1b[0m\n');
    
    pairDevice(sessionName, cleaned);
  });
});
