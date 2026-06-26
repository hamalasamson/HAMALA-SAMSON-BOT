const readline = require('readline');
const fs = require('fs');
const path = require('path');
const cfg = require('../config');
const sessionManager = require('./sessionManager');
const connect = require('./connect');
const logger = require('./logger');

// Store logs in memory (silent)
const logs = [];

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  logs.push('[' + timestamp + '] ' + message);
  if (logs.length > 100) logs.shift();
}

function makeRL() { return readline.createInterface({ input: process.stdin, output: process.stdout }); }
function ask(rl, q) { return new Promise(r => rl.question(q, r)); }

async function showMenu() {
  console.clear();
  console.log('\x1b[35m');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log(`  ║   ✪  ${cfg.BOT_NAME}  ✪   ║`);
  console.log(`  ║           v${cfg.VERSION}                           ║`);
  console.log('  ╠═══════════════════════════════════════════╣');
  console.log('  ║  [1]  🔗  Pair new device (new session)  ║');
  console.log('  ║  [2]  📂  List / start sessions          ║');
  console.log('  ║  [3]  🛑  Stop a session                ║');
  console.log('  ║  [4]  🗑️   Delete a session              ║');
  console.log('  ║  [5]  💾  Restore from backup            ║');
  console.log('  ║  [6]  🔄  Restart all sessions           ║');
  console.log('  ║  [7]  🌐  Toggle web server              ║');
  console.log('  ║  [8]  📋  View logs                     ║');
  console.log('  ║  [9]  ❌  Exit                          ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('\x1b[0m');

  const sessions = sessionManager.listSessions();
  if (sessions.length > 0) {
    console.log('\x1b[33m  Current sessions:\x1b[0m');
    sessions.forEach((s, i) => {
      const status = s.started ? '\x1b[32m● ONLINE\x1b[0m' : '\x1b[31m○ OFFLINE\x1b[0m';
      console.log(`   [${i}] ${s.name}  ${status}  Owner: ${s.owner || 'none'}`);
    });
    console.log('');
  } else {
    console.log('\x1b[33m  No sessions yet. Pair a new device!\x1b[0m\n');
  }

  const webStatus = sessionManager.webServerStatus() ? '\x1b[32mRUNNING\x1b[0m' : '\x1b[31mSTOPPED\x1b[0m';
  console.log(`  🌐 Web Server: ${webStatus}\n`);

  const rl = makeRL();
  const choice = (await ask(rl, '  \x1b[36mChoose [1-9]: \x1b[0m')).trim();
  rl.close();

  if (choice === '1') {
    const rl2 = makeRL();
    const name = (await ask(rl2, '  Session name (e.g., main): ')).trim() || 'main';
    const number = (await ask(rl2, '  Phone number (with country code, no +): ')).trim();
    rl2.close();
    if (!number) { 
      addLog('❌ Number required.');
      console.log('\x1b[31m  Number required.\x1b[0m'); 
      return setTimeout(showMenu, 1500); 
    }
    addLog('🔗 Pairing session "' + name + '" with number +' + number);
    console.log('\x1b[32m  Pairing...\x1b[0m');
    try {
      const code = await sessionManager.pairNewSession(name, number);
      addLog('✅ Session "' + name + '" created with owner ' + number + ' (Code: ' + code + ')');
      console.log(`\x1b[33m  Pairing code: ${code}\x1b[0m`);
      console.log('  Open WhatsApp → Linked Devices → Link with phone number and enter the code.');
    } catch (e) {
      addLog('❌ Error: ' + e.message);
      console.log(`\x1b[31m  Error: ${e.message}\x1b[0m`);
    }
    setTimeout(showMenu, 3000);

  } else if (choice === '2') {
    if (sessions.length === 0) { 
      addLog('❌ No sessions to start.');
      console.log('\x1b[31m  No sessions.\x1b[0m'); 
      return setTimeout(showMenu, 1500); 
    }
    const rl3 = makeRL();
    const idx = (await ask(rl3, '  Session number to start: ')).trim();
    rl3.close();
    const sel = sessions[parseInt(idx)];
    if (!sel) { 
      addLog('❌ Invalid session number.');
      console.log('\x1b[31m  Invalid.\x1b[0m'); 
      return setTimeout(showMenu, 1500); 
    }
    if (sel.started) {
      addLog('⚠️ Session "' + sel.name + '" already running.');
      console.log('\x1b[33m  Already running.\x1b[0m');
    } else {
      addLog('▶️ Starting session "' + sel.name + '"...');
      console.log(`\x1b[32m  Starting ${sel.name}...\x1b[0m`);
      await sessionManager.startSession(sel.name);
    }
    setTimeout(showMenu, 1500);

  } else if (choice === '3') {
    if (sessions.length === 0) { 
      addLog('❌ No sessions to stop.');
      console.log('\x1b[31m  No sessions.\x1b[0m'); 
      return setTimeout(showMenu, 1500); 
    }
    const rl4 = makeRL();
    const idx2 = (await ask(rl4, '  Session number to stop: ')).trim();
    rl4.close();
    const sel2 = sessions[parseInt(idx2)];
    if (!sel2) { 
      addLog('❌ Invalid session number.');
      console.log('\x1b[31m  Invalid.\x1b[0m'); 
      return setTimeout(showMenu, 1500); 
    }
    if (!sel2.started) {
      addLog('⚠️ Session "' + sel2.name + '" already stopped.');
      console.log('\x1b[33m  Already stopped.\x1b[0m');
    } else {
      addLog('⏹️ Stopping session "' + sel2.name + '"...');
      sessionManager.stopSession(sel2.name);
      console.log(`\x1b[33m  ${sel2.name} stopped.\x1b[0m`);
    }
    setTimeout(showMenu, 1500);

  } else if (choice === '4') {
    if (sessions.length === 0) { 
      addLog('❌ No sessions to delete.');
      console.log('\x1b[31m  No sessions.\x1b[0m'); 
      return setTimeout(showMenu, 1500); 
    }
    const rl5 = makeRL();
    const idx3 = (await ask(rl5, '  Session number to delete: ')).trim();
    const confirm = (await ask(rl5, '  Type YES to confirm: ')).trim();
    rl5.close();
    if (confirm === 'YES') {
      const sel3 = sessions[parseInt(idx3)];
      if (sel3) {
        if (sel3.started) sessionManager.stopSession(sel3.name);
        fs.rmSync(path.join(connect.SESSIONS_DIR, sel3.name), { recursive: true, force: true });
        const meta = sessionManager.loadMetadata();
        delete meta[sel3.name];
        sessionManager.saveMetadata(meta);
        addLog('🗑️ Deleted session "' + sel3.name + '"');
        console.log(`\x1b[32m  Deleted ${sel3.name}.\x1b[0m`);
      }
    } else {
      addLog('⏭️ Delete cancelled.');
      console.log('\x1b[33m  Cancelled.\x1b[0m');
    }
    setTimeout(showMenu, 1000);

  } else if (choice === '5') {
    if (!fs.existsSync(connect.BACKUP_FILE)) {
      addLog('❌ No backup available.');
      console.log('\x1b[31m  No backup available.\x1b[0m');
      return setTimeout(showMenu, 1500);
    }
    const b = JSON.parse(fs.readFileSync(connect.BACKUP_FILE, 'utf8'));
    const ok = connect.restoreSession(b.name);
    if (ok) {
      addLog('💾 Restored session "' + b.name + '" from backup.');
      console.log(`\x1b[32m  Restored session "${b.name}".\x1b[0m`);
      const meta = sessionManager.loadMetadata();
      if (!meta[b.name]) meta[b.name] = { owner: null };
      sessionManager.saveMetadata(meta);
    } else {
      addLog('❌ Restore failed.');
      console.log('\x1b[31m  Restore failed.\x1b[0m');
    }
    setTimeout(showMenu, 2000);

  } else if (choice === '6') {
    addLog('🔄 Restarting all sessions...');
    console.log('\x1b[33m  Restarting all sessions...\x1b[0m');
    const list = sessionManager.listSessions();
    for (const s of list) {
      if (s.started) sessionManager.stopSession(s.name);
    }
    for (const s of list) {
      console.log(`  Starting ${s.name}...`);
      await sessionManager.startSession(s.name);
    }
    addLog('✅ All sessions restarted.');
    console.log('\x1b[32m  All sessions restarted.\x1b[0m');
    setTimeout(showMenu, 2000);

  } else if (choice === '7') {
    if (sessionManager.webServerStatus()) {
      addLog('🌐 Stopping web server...');
      sessionManager.stopWebServer();
      console.log('\x1b[33m  Web server stopped.\x1b[0m');
    } else {
      addLog('🌐 Starting web server...');
      sessionManager.startWebServer();
      console.log('\x1b[36m  Open http://localhost:3000 in your browser.\x1b[0m');
    }
    setTimeout(showMenu, 2000);

  } else if (choice === '8') {
    if (logs.length === 0) {
      console.log('\x1b[33m  No logs available.\x1b[0m');
    } else {
      console.log('\x1b[36m  ─── LOGS ───\x1b[0m');
      logs.slice(-30).forEach(log => {
        console.log('  ' + log);
      });
      console.log('\x1b[36m  ───────────\x1b[0m');
    }
    console.log('\x1b[33m  Press Enter to continue...\x1b[0m');
    const rl6 = makeRL();
    await ask(rl6, '');
    rl6.close();
    setTimeout(showMenu, 300);

  } else if (choice === '9') {
    addLog('👋 Goodbye!');
    console.log('\x1b[32m  Goodbye! 👋\x1b[0m');
    process.exit(0);
  } else {
    setTimeout(showMenu, 300);
  }
}

module.exports = { showMenu };
