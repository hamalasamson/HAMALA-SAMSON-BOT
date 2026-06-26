const express = require('express');
const QRCode = require('qrcode');
const connect = require('./lib/connect');
const sessionManager = require('./lib/sessionManager');
const state = require('./lib/state');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── PAGE ──────────────────────────────────────────────────────
app.get('/', function(req, res) {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SONXX LITE - Pair Device</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f5f5; text-align: center; }
    .box { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .tabs { display: flex; gap: 0; margin-bottom: 20px; }
    .tab-btn { flex: 1; padding: 12px; border: none; cursor: pointer; background: #ddd; font-size: 16px; }
    .tab-btn.active { background: #25D366; color: white; }
    .tab-content { display: none; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
    .tab-content.active { display: block; }
    input, button { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ccc; border-radius: 5px; }
    button { background: #25D366; color: white; font-weight: bold; border: none; cursor: pointer; }
    button:hover { background: #1da851; }
    #qr-container { margin: 20px 0; display: none; }
    #qr-container img { max-width: 250px; border: 1px solid #ddd; border-radius: 5px; }
    .status { margin-top: 20px; padding: 15px; border-radius: 5px; display: none; }
    .success { background: #d4edda; color: #155724; display: block; }
    .error { background: #f8d7da; color: #721c24; display: block; }
    .info { background: #d1ecf1; color: #0c5460; display: block; }
    #code-display { font-size: 36px; font-weight: bold; color: #25D366; letter-spacing: 8px; margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 8px; }
    .hidden { display: none; }
    .code-box { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="box">
    <h2>🔗 Pair WhatsApp Device</h2>
    <p>Enter a session name and choose pairing method.</p>
    
    <div class="tabs">
      <button class="tab-btn active" data-tab="qr">📱 QR Code</button>
      <button class="tab-btn" data-tab="code">🔢 8-Digit Code</button>
    </div>

    <form id="pairForm">
      <label>Session Name:</label>
      <input type="text" id="sessionName" value="main" required>
      
      <div id="qr-tab" class="tab-content active">
        <button type="button" id="qrBtn">Generate QR</button>
        <div id="qr-container" class="hidden">
          <h3>Scan this QR with WhatsApp</h3>
          <div id="qr-image"></div>
          <p style="color: #666;">Open WhatsApp → Linked Devices → Link with QR code</p>
          <p id="qr-status" style="color: #ff6b6b;">⏳ Waiting for scan...</p>
        </div>
      </div>
      
      <div id="code-tab" class="tab-content">
        <label>Phone Number (with country code, no +):</label>
        <input type="text" id="phoneNumber" placeholder="e.g. 263712345678" value="256748800194">
        <button type="button" id="codeBtn">Get 8-Digit Code</button>
        <div id="code-container" class="hidden">
          <h3>Enter this code in WhatsApp</h3>
          <div class="code-box">
            <div id="code-display">XXXX-XXXX</div>
          </div>
          <p style="color: #666;">Open WhatsApp → Linked Devices → Link with phone number</p>
          <p style="color: #ff6b6b; font-size: 14px;">⚠️ Keep this page open while pairing!</p>
          <p id="code-status" style="color: #ff6b6b;">⏳ Waiting for pairing...</p>
        </div>
      </div>
    </form>

    <div id="status" class="status hidden"></div>
    <hr>
    <p><a href="/sessions">📂 View sessions</a></p>
  </div>

  <script>
    var tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = this.getAttribute('data-tab');
        tabs.forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
        document.getElementById(target + '-tab').classList.add('active');
        document.getElementById('status').classList.add('hidden');
        document.getElementById('qr-container').classList.add('hidden');
        document.getElementById('code-container').classList.add('hidden');
      });
    });

    function setStatus(text, type) {
      var status = document.getElementById('status');
      status.textContent = text;
      status.className = 'status ' + type;
      status.classList.remove('hidden');
    }

    document.getElementById('qrBtn').addEventListener('click', function() {
      var name = document.getElementById('sessionName').value;
      if (!name) { setStatus('❌ Please enter a session name.', 'error'); return; }
      generateQR(name);
    });

    async function generateQR(name) {
      var qrContainer = document.getElementById('qr-container');
      var qrImage = document.getElementById('qr-image');
      var qrStatus = document.getElementById('qr-status');

      qrContainer.classList.add('hidden');
      qrImage.innerHTML = '';
      qrStatus.textContent = '⏳ Waiting for scan...';
      qrStatus.style.color = '#ff6b6b';
      setStatus('⏳ Generating QR...', 'info');

      try {
        var res = await fetch('/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, method: 'qr' })
        });
        var data = await res.json();
        if (data.success) {
          qrContainer.classList.remove('hidden');
          qrImage.innerHTML = '<img src="' + data.qr + '" alt="QR Code">';
          setStatus('✅ QR ready! Scan it with WhatsApp.', 'success');
          
          var count = 0;
          var interval = setInterval(async function() {
            try {
              var check = await fetch('/status/' + name);
              var statusData = await check.json();
              if (statusData.connected) {
                clearInterval(interval);
                qrStatus.textContent = '✅ Connected successfully!';
                qrStatus.style.color = '#2ecc71';
                setStatus('✅ Device paired successfully!', 'success');
              }
              count++;
              if (count > 60) {
                clearInterval(interval);
                if (!statusData.connected) {
                  qrStatus.textContent = '⏰ Timeout. Please try again.';
                  qrStatus.style.color = '#e74c3c';
                }
              }
            } catch (e) {}
          }, 2000);
        } else {
          setStatus('❌ Error: ' + data.error, 'error');
        }
      } catch (err) {
        setStatus('❌ Server error: ' + err.message, 'error');
      }
    }

    document.getElementById('codeBtn').addEventListener('click', function() {
      var name = document.getElementById('sessionName').value;
      var phone = document.getElementById('phoneNumber').value;
      if (!name) { setStatus('❌ Please enter a session name.', 'error'); return; }
      if (!phone) { setStatus('❌ Please enter your phone number.', 'error'); return; }
      generateCode(name, phone);
    });

    async function generateCode(name, phone) {
      var codeContainer = document.getElementById('code-container');
      var codeDisplay = document.getElementById('code-display');
      var codeStatus = document.getElementById('code-status');

      codeContainer.classList.add('hidden');
      codeStatus.textContent = '⏳ Generating code...';
      codeStatus.style.color = '#ff6b6b';
      setStatus('⏳ Generating 8-digit code...', 'info');

      try {
        var res = await fetch('/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, method: 'code', phone: phone })
        });
        var data = await res.json();
        if (data.success) {
          codeContainer.classList.remove('hidden');
          codeDisplay.textContent = data.code;
          setStatus('✅ Code generated! Enter it in WhatsApp.', 'success');
          codeStatus.textContent = '⏳ Waiting for pairing...';
          codeStatus.style.color = '#ff6b6b';

          console.log('\x1b[32m[WEB] Pairing code for ' + name + ': ' + data.code + '\x1b[0m');

          var count = 0;
          var interval = setInterval(async function() {
            try {
              var check = await fetch('/status/' + name);
              var statusData = await check.json();
              if (statusData.connected) {
                clearInterval(interval);
                codeStatus.textContent = '✅ Connected successfully!';
                codeStatus.style.color = '#2ecc71';
                setStatus('✅ Device paired successfully!', 'success');
                console.log('\x1b[32m[WEB] Device paired successfully for ' + name + '!\x1b[0m');
              }
              count++;
              if (count > 120) {
                clearInterval(interval);
                if (!statusData.connected) {
                  codeStatus.textContent = '⏰ Timeout. Please try again.';
                  codeStatus.style.color = '#e74c3c';
                }
              }
            } catch (e) {}
          }, 2000);
        } else {
          setStatus('❌ Error: ' + data.error, 'error');
        }
      } catch (err) {
        setStatus('❌ Server error: ' + err.message, 'error');
      }
    }
  </script>
</body>
</html>`);
});

// ─── PAIR ENDPOINT ──────────────────────────────────────────────
app.post('/pair', async function(req, res) {
  var name = req.body.name;
  var method = req.body.method;
  var phone = req.body.phone;

  console.log('\n\x1b[36m[PAIR] Request:\x1b[0m', { name, method, phone });

  if (!name) {
    return res.json({ success: false, error: 'Missing session name' });
  }

  try {
    // ─── USE YOUR WORKING connect.js pairDevice ────────────────
    // But we need to capture the code instead of just printing it
    // Let's use a modified version of your working logic

    var sessionPath = path.join(connect.SESSIONS_DIR, name);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
    fs.mkdirSync(sessionPath, { recursive: true });

    var authState = await useMultiFileAuthState(sessionPath);
    var ver = await fetchLatestBaileysVersion();

    // ─── EXACT SAME AS YOUR WORKING connect.js ────────────────
    var logger = pino({ level: 'silent' });
    var sock = makeWASocket({
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

    // ─── QR METHOD ──────────────────────────────────────────────
    if (method === 'qr') {
      var qrData = await new Promise(function(resolve, reject) {
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
            attachHandlers(sock, name, sessionPath, authState);
            state.sockets[name] = sock;
            resolve(qr);
            return;
          }

          if (connection === 'close') {
            clearTimeout(timeout);
            var code = lastDisconnect?.error ? new Boom(lastDisconnect.error).output.statusCode : 500;
            reject(new Error('Connection closed: ' + code));
            sock.end();
          }
        });

        sock.ev.on('qr', function(qr) {
          clearTimeout(timeout);
          attachHandlers(sock, name, sessionPath, authState);
          state.sockets[name] = sock;
          resolve(qr);
        });
      });

      var qrImage = await QRCode.toDataURL(qrData);
      return res.json({ success: true, qr: qrImage });
    }

    // ─── 8-DIGIT CODE METHOD ──────────────────────────────────
    if (method === 'code') {
      if (!phone) {
        return res.json({ success: false, error: 'Phone number required' });
      }

      var cleaned = phone.replace(/[^0-9]/g, '');
      if (cleaned.length < 7) {
        return res.json({ success: false, error: 'Invalid phone number' });
      }

      console.log('\x1b[36m[CODE] Getting code for:\x1b[0m', cleaned);

      // ─── EXACT SAME AS YOUR WORKING pairDevice ──────────────
      // The working code does: pairCode = await sock.requestPairingCode(phoneNumber)
      // It does NOT wait for connection.open
      try {
        var pairCode = await sock.requestPairingCode(cleaned);
        var formatted = pairCode.match(/.{1,4}/g).join('-');
        console.log('\x1b[32m[CODE] Code generated:\x1b[0m', formatted);

        // Attach handlers AFTER code is generated
        attachHandlers(sock, name, sessionPath, authState);
        state.sockets[name] = sock;

        return res.json({ success: true, code: formatted });
      } catch (e) {
        console.log('\x1b[31m[CODE] Failed to get code: ' + e.message + '\x1b[0m');
        return res.json({ success: false, error: 'Failed to get code: ' + e.message });
      }
    }

    res.json({ success: false, error: 'Invalid method' });

  } catch (e) {
    console.log('\x1b[31m[PAIR] Error:\x1b[0m', e.message);
    console.error(e);
    res.json({ success: false, error: e.message });
  }
});

// ─── ATTACH HANDLERS ──────────────────────────────────────────
function attachHandlers(sock, name, sessionPath, authState) {
  var handler = require('./lib/handler');
  var sessionManager = require('./lib/sessionManager');
  var state = require('./lib/state');
  var fs = require('fs');
  var path = require('path');

  sock.ev.removeAllListeners('messages.upsert');

  sock.ev.on('messages.upsert', async function(m) {
    if (m.type !== 'notify') return;
    for (var i = 0; i < m.messages.length; i++) {
      var msg = m.messages[i];
      try {
        await handler.handleMessage(sock, msg, name);
      } catch (e) {
        console.log('\x1b[31m[ATTACH] Handler error:\x1b[0m', e);
      }
    }
  });

  sock.ev.on('connection.update', function(upd) {
    var connection = upd.connection;
    var lastDisconnect = upd.lastDisconnect;

    if (connection === 'open') {
      console.log('\x1b[32m[✓] Session "' + name + '" paired!\x1b[0m');
      var meta = sessionManager.loadMetadata();
      if (!meta[name]) meta[name] = { owner: null };
      sessionManager.saveMetadata(meta);
      state.sockets[name] = sock;
    }

    if (connection === 'close') {
      var code = lastDisconnect?.error ? new Boom(lastDisconnect.error).output.statusCode : 500;
      if (code === DisconnectReason.loggedOut) {
        console.log('\x1b[31m[!] Session "' + name + '" logged out.\x1b[0m');
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        }
        var meta = sessionManager.loadMetadata();
        if (meta && meta[name]) {
          delete meta[name];
          sessionManager.saveMetadata(meta);
        }
        if (state.sockets && state.sockets[name]) {
          delete state.sockets[name];
        }
      } else {
        console.log('\x1b[33m[~] Session "' + name + '" reconnecting...\x1b[0m');
      }
    }
  });
}

// ─── STATUS ──────────────────────────────────────────────────────
app.get('/status/:name', function(req, res) {
  var name = req.params.name;
  var connected = (state.sockets && state.sockets[name]) ? true : false;
  res.json({ connected: connected });
});

// ─── SESSIONS ──────────────────────────────────────────────────
app.get('/sessions', function(req, res) {
  var sessions = sessionManager.listSessions();
  res.json(sessions);
});

// ─── START ──────────────────────────────────────────────────────
const path = require('path');
const fs = require('fs');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');

var PORT = process.env.PORT || 3001;
app.listen(PORT, function() {
  console.log('\x1b[32m[✓] Web server running on http://localhost:' + PORT + '\x1b[0m');
  console.log('\x1b[36m🌐 Open http://localhost:' + PORT + ' in your browser to pair.\x1b[0m');
});
