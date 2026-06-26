const cfg = require('../config');
const state = require('./state');
const sessionManager = require('./sessionManager');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const GROUP_DATA_FILE = path.join(DATA_DIR, 'group_data.json');

function loadGroupData() {
  try { return JSON.parse(fs.readFileSync(GROUP_DATA_FILE, 'utf8')); } catch { return {}; }
}

const EMOJIS = ['🔥','💯','😂','❤️','😍','🎉','👀','💀','😭','🤣','✨','💪','🙏','😎','🤩','👏','🫡','💅','🥶','😤'];
const LINK_RE = /https?:\/\/[^\s]+|www\.[^\s]+|chat\.whatsapp\.com\/[^\s]+/i;
const BAD_WORDS = ['fuck', 'shit', 'damn', 'bitch', 'cunt', 'whore', 'slut', 'asshole', 'dick', 'pussy'];

function extractText(msg) {
  const m = msg.message;
  if (!m) return '';
  return m.conversation ||
         (m.extendedTextMessage && m.extendedTextMessage.text) ||
         (m.imageMessage && m.imageMessage.caption) ||
         (m.videoMessage && m.videoMessage.caption) ||
         '';
}

function isOwner(msg, sessionName) {
  if (msg.key.fromMe) return true;
  const sender = (msg.key.participant || msg.key.remoteJid || '').split('@')[0];
  const sessionOwner = sessionManager.getSessionOwner(sessionName);
  if (sessionOwner && sender === sessionOwner) return true;
  const cfgOwner = (cfg.OWNER || '').replace(/[^0-9]/g, '');
  return cfgOwner && sender === cfgOwner;
}

async function isGroupAdmin(sock, groupJid, userJid) {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const p = meta.participants.find(x => x.id === userJid);
    return p && (p.admin === 'admin' || p.admin === 'superadmin');
  } catch { return false; }
}

async function handleMessage(sock, msg, sessionName) {
  try {
    if (!msg.message) return;
    const from = msg.key.remoteJid;
    const text = extractText(msg).trim();
    const owner = isOwner(msg, sessionName);
    const isGroup = from.endsWith('@g.us');
    const sender = msg.key.fromMe ? 'OWNER' : (msg.key.participant || msg.key.remoteJid || '').split('@')[0];
    const prefix = cfg.PREFIX || '.';
    if (!text) return;

    const tag = isGroup ? '\x1b[35m[GRP]\x1b[0m' : '\x1b[34m[DM]\x1b[0m';
    const who = msg.key.fromMe ? '\x1b[33m[OWNER]\x1b[0m' : '\x1b[36m[' + sender + ']\x1b[0m';
    console.log(tag + ' ' + who + ': ' + text);

    if (!msg.key.fromMe && state.autoReact) {
      try { await sock.sendMessage(from, { react: { text: EMOJIS[Math.floor(Math.random() * EMOJIS.length)], key: msg.key } }); } catch {}
    }

    // ─── GROUP PROTECTION CHECKS ────────────────────────────────────
    if (isGroup && !owner && !msg.key.fromMe) {
      const data = loadGroupData();
      const groupSettings = data[from] || {};

      if (groupSettings.bans && groupSettings.bans.includes(sender + '@s.whatsapp.net')) {
        try {
          await sock.sendMessage(from, { delete: msg.key });
          await sock.sendMessage(from, {
            text: '🚫 @' + sender + ' is banned from this group.',
            mentions: [sender + '@s.whatsapp.net']
          });
        } catch {}
        return;
      }

      if (groupSettings.antilink && LINK_RE.test(text)) {
        const isAdmin = await isGroupAdmin(sock, from, sender + '@s.whatsapp.net');
        if (!isAdmin) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
          const action = groupSettings.antilinkAction || 'warn';
          if (action === 'kick') {
            await sock.groupParticipantsUpdate(from, [sender + '@s.whatsapp.net'], 'remove');
          } else {
            await sock.sendMessage(from, {
              text: '🔗 *Anti-Link*\n⚠️ @' + sender + ' links are not allowed!',
              mentions: [sender + '@s.whatsapp.net']
            });
          }
          return;
        }
      }

      if (groupSettings.antifwd && msg.message?.forwardedNewsletterMessageInfo) {
        try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
        const action = groupSettings.antifwdAction || 'warn';
        await sock.sendMessage(from, {
          text: '📤 *Anti-Forward*\n⚠️ @' + sender + ' forwarding is not allowed!',
          mentions: [sender + '@s.whatsapp.net']
        });
        if (action === 'kick') {
          await sock.groupParticipantsUpdate(from, [sender + '@s.whatsapp.net'], 'remove');
        }
        return;
      }

      if (groupSettings.antibot && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
        const action = groupSettings.antibotAction || 'warn';
        await sock.sendMessage(from, {
          text: '🤖 *Anti-Bot*\n⚠️ @' + sender + ' bot messages are not allowed!',
          mentions: [sender + '@s.whatsapp.net']
        });
        if (action === 'kick') {
          await sock.groupParticipantsUpdate(from, [sender + '@s.whatsapp.net'], 'remove');
        }
        return;
      }

      if (groupSettings.antitag && (text.includes('@everyone') || text.includes('@all'))) {
        try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
        const action = groupSettings.antitagAction || 'warn';
        await sock.sendMessage(from, {
          text: '🏷️ *Anti-Tag*\n⚠️ @' + sender + ' mass tagging is not allowed!',
          mentions: [sender + '@s.whatsapp.net']
        });
        if (action === 'kick') {
          await sock.groupParticipantsUpdate(from, [sender + '@s.whatsapp.net'], 'remove');
        }
        return;
      }

      if (groupSettings.antibadword) {
        const hasBadWord = BAD_WORDS.some(word => text.toLowerCase().includes(word));
        if (hasBadWord) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
          await sock.sendMessage(from, {
            text: '🔞 *Anti-Bad Word*\n⚠️ @' + sender + ' bad word detected!',
            mentions: [sender + '@s.whatsapp.net']
          });
          return;
        }
      }

      if (groupSettings.antipromote && text.toLowerCase().includes('promote')) {
        try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
        await sock.sendMessage(from, {
          text: '⛔ *Anti-Promote*\n⚠️ @' + sender + ' promoting is not allowed!',
          mentions: [sender + '@s.whatsapp.net']
        });
        return;
      }

      if (groupSettings.antidemote && text.toLowerCase().includes('demote')) {
        try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
        await sock.sendMessage(from, {
          text: '⛔ *Anti-Demote*\n⚠️ @' + sender + ' demoting is not allowed!',
          mentions: [sender + '@s.whatsapp.net']
        });
        return;
      }

      if (groupSettings.antigroupmention && msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
        const mentions = msg.message.extendedTextMessage.contextInfo.mentionedJid || [];
        if (mentions.length > 5) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
          await sock.sendMessage(from, {
            text: '📢 *Anti-Group Mention*\n⚠️ @' + sender + ' mass mentions are not allowed!',
            mentions: [sender + '@s.whatsapp.net']
          });
          return;
        }
      }

      if (groupSettings.antispam) {
        state.spam = state.spam || {};
        state.spam[from] = state.spam[from] || {};
        const now = Date.now();
        const userSpam = state.spam[from][sender] || [];
        const recent = userSpam.filter(t => now - t < 5000);
        if (recent.length > 3) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
          await sock.sendMessage(from, {
            text: '🚫 *Anti-Spam*\n⚠️ @' + sender + ' you are spamming!',
            mentions: [sender + '@s.whatsapp.net']
          });
          return;
        }
        recent.push(now);
        state.spam[from][sender] = recent;
      }

      if (groupSettings.flood) {
        state.flood = state.flood || {};
        state.flood[from] = state.flood[from] || {};
        const now = Date.now();
        const userFlood = state.flood[from][sender] || [];
        const recent = userFlood.filter(t => now - t < 3000);
        if (recent.length > 5) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
          await sock.sendMessage(from, {
            text: '🌊 *Flood Protection*\n⚠️ @' + sender + ' you are flooding!',
            mentions: [sender + '@s.whatsapp.net']
          });
          return;
        }
        recent.push(now);
        state.flood[from][sender] = recent;
      }
    }

    // ─── GREETINGS ──────────────────────────────────────────────────
    const lower = text.toLowerCase();
    if (!msg.key.fromMe && (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'hie')) {
      await sock.sendMessage(from, {
        text: '👋 *Hey ' + sender + '!*\n\nI\'m Ruva, Son\'s chatbot. 🤖\nType *' + prefix + 'menu* to see all commands!'
      }, { quoted: msg });
      return;
    }
    if (lower === 'ping') {
      await sock.sendMessage(from, { text: '🏓 Pong!' }, { quoted: msg });
      return;
    }

    if (!text.startsWith(prefix)) return;

    const body = text.slice(prefix.length).trim();
    const parts = body.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const q = args.join(' ');

    console.log('\x1b[32m[CMD] ' + prefix + command + (q ? ' ' + q : '') + '\x1b[0m');

    const ctx = { sock, msg, from, args, q, sender, owner, prefix, isGroup, cfg, sessionName };

    // ─── LOAD ALL COMMAND MODULES ──────────────────────────────────
    let general, grouptool, download, ai, fun, tools, ownerCmd, search, games, economy, anime, sports, funfacts, media, image, audio, sticker, ephoto;
    try { general = require('../commands/general'); } catch {}
    try { grouptool = require('../commands/grouptool'); } catch {}
    try { download = require('../commands/download'); } catch {}
    try { ai = require('../commands/ai'); } catch {}
    try { fun = require('../commands/fun'); } catch {}
    try { tools = require('../commands/tools'); } catch {}
    try { ownerCmd = require('../commands/owner'); } catch {}
    try { search = require('../commands/search'); } catch {}
    try { games = require('../commands/games'); } catch {}
    try { economy = require('../commands/economy'); } catch {}
    try { anime = require('../commands/anime'); } catch {}
    try { sports = require('../commands/sports'); } catch {}
    try { funfacts = require('../commands/funfacts'); } catch {}
    try { media = require('../commands/media'); } catch {}
    try { image = require('../commands/image'); } catch {}
    try { audio = require('../commands/audio'); } catch {}
    try { sticker = require('../commands/sticker'); } catch {}
    try { ephoto = require('../commands/ephoto'); } catch {}

    const modules = [general, grouptool, download, ai, fun, tools, ownerCmd, search, games, economy, anime, sports, funfacts, media, image, audio, sticker, ephoto];
    let executed = false;
    for (const mod of modules) {
      if (mod && typeof mod[command] === 'function') {
        await mod[command](ctx);
        executed = true;
        break;
      }
    }
    if (!executed) {
      await sock.sendMessage(from, {
        text: '❓ Unknown command. Use ' + prefix + 'menu.'
      }, { quoted: msg });
    }

  } catch (err) {
    console.log('\x1b[31m[ERR]\x1b[0m', err.message);
  }
}

async function handleCall(sock, calls, sessionName) {
  if (!state.antiCall) return;
  for (const call of calls) {
    if (call.status === 'offer') {
      try {
        await sock.rejectCall(call.id, call.from);
        await sock.sendMessage(call.from, {
          text: '📞 Calls are disabled, text me instead 😌'
        });
      } catch {}
    }
  }
}

module.exports = { handleMessage, handleCall };
