const connect = require('./lib/connect');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\x1b[35m╔═══════════════════════════════════════╗\x1b[0m');
console.log('\x1b[35m║   TEST: Using your working connect.js ║\x1b[0m');
console.log('\x1b[35m╚═══════════════════════════════════════╝\x1b[0m\n');

rl.question('Session name (e.g., main): ', function(sessionName) {
  sessionName = sessionName.trim() || 'main';
  
  rl.question('Phone number (with country code, no +): ', function(phone) {
    rl.close();
    
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length < 7) {
      console.log('\x1b[31m[!] Invalid number.\x1b[0m');
      process.exit(1);
    }
    
    console.log('\n\x1b[36m[+] Calling your connect.pairDevice...\x1b[0m');
    console.log('\x1b[36m[+] Session: ' + sessionName + '\x1b[0m');
    console.log('\x1b[36m[+] Number: +' + cleaned + '\x1b[0m\n');
    
    // ─── CREATE A WRAPPER FUNCTION ──────────────────────────────
    // Your connect.pairDevice expects to ask for the number via readline.
    // We'll create a new function that uses the number we already have.
    
    const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
    const pino = require('pino');
    const fs = require('fs');
    const path = require('path');
    const state = require('./lib/state');
    
    const SESSIONS_DIR = connect.SESSIONS_DIR;
    const sessionPath = path.join(SESSIONS_DIR, sessionName);
    
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log('\x1b[33m[!] Existing session removed.\x1b[0m');
    }
    fs.mkdirSync(sessionPath, { recursive: true });
    console.log('\x1b[32m[✓] Session directory created.\x1b[0m');
    
    (async function() {
      try {
        const authState = await useMultiFileAuthState(sessionPath);
        const ver = await fetchLatestBaileysVersion();
        const logger = pino({ level: 'silent' });
        
        // ─── EXACT SAME AS YOUR connect.js ──────────────────────
        const sock = makeWASocket({
          version: ver.version,
          auth: {
            creds: authState.state.creds,
            keys: makeCacheableSignalKeyStore(authState.state.keys, logger)
          },
          printQRInTerminal: false,
          logger: logger,
          keepAliveIntervalMs: 30000,
          retryRequestDelayMs: 2000
        });
        
        sock.ev.on('creds.update', authState.saveCreds);
        
        // ─── CHECK IF REGISTERED ──────────────────────────────────
        if (!sock.authState.creds.registered) {
          console.log('\x1b[36m[+] Requesting pairing code for: ' + cleaned + '\x1b[0m');
          
          let pairCode;
          try {
            pairCode = await sock.requestPairingCode(cleaned);
          } catch (e) {
            console.log('\x1b[31m[!] Failed to get code: ' + e.message + '\x1b[0m');
            process.exit(1);
          }
          
          const formatted = pairCode.match(/.{1,4}/g).join('-');
          
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
          
          console.log('\x1b[33m[!] Waiting... do NOT close Termux\x1b[0m\n');
        }
        
        // ─── CONNECTION HANDLER ──────────────────────────────────
        sock.ev.on('connection.update', async function(update) {
          var connection = update.connection;
          var lastDisconnect = update.lastDisconnect;
          
          if (connection === 'open') {
            console.log('\x1b[32m[✓] Linked! Bot is now active.\x1b[0m');
            process.exit(0);
          }
          
          if (connection === 'close') {
            var code = lastDisconnect && lastDisconnect.error
              ? new Boom(lastDisconnect.error).output.statusCode
              : 500;
            if (code === DisconnectReason.loggedOut) {
              console.log('\x1b[31m[!] Logged out.\x1b[0m');
              process.exit(1);
            } else {
              console.log('\x1b[33m[~] Reconnecting... (' + code + ')\x1b[0m');
            }
          }
        });
        
      } catch (e) {
        console.log('\x1b[31m[✗] Error:\x1b[0m', e.message);
        console.error(e);
        process.exit(1);
      }
    })();
    
  });
});
