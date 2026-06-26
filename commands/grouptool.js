const fs = require('fs');
const path = require('path');
const state = require('../lib/state');

// Data file for group bans, warnings, etc.
const DATA_DIR = path.join(__dirname, '../data');
const GROUP_DATA_FILE = path.join(DATA_DIR, 'group_data.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadGroupData() {
  try { return JSON.parse(fs.readFileSync(GROUP_DATA_FILE, 'utf8')); } catch { return {}; }
}

function saveGroupData(data) {
  fs.writeFileSync(GROUP_DATA_FILE, JSON.stringify(data, null, 2));
}

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const commands = {};

// ─── TAGALL ───────────────────────────────────────────────────
commands.tagall = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const members = meta.participants;
    const mentions = members.map(m => m.id);
    let msg = ctx.q || '📢 Attention everyone!';
    msg += '\n\n' + members.map(m => '@' + m.id.split('@')[0]).join(' ');
    await ctx.sock.sendMessage(ctx.from, { text: msg, mentions }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Failed. I need admin rights.');
  }
};

commands.hidetag = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const members = meta.participants;
    const mentions = members.map(m => m.id);
    const msg = ctx.q || '📢 Hidden tag';
    await ctx.sock.sendMessage(ctx.from, { text: msg, mentions }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.tagadmins = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const admins = meta.participants.filter(p => p.admin);
    const mentions = admins.map(m => m.id);
    const msg = ctx.q || '👑 Admins:';
    await ctx.sock.sendMessage(ctx.from, { text: msg + '\n' + admins.map(m => '@' + m.id.split('@')[0]).join(' '), mentions }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.announce = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .announce <text>');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const members = meta.participants;
    const mentions = members.map(m => m.id);
    await ctx.sock.sendMessage(ctx.from, { text: '📢 *ANNOUNCEMENT*\n' + ctx.q, mentions }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.announcement = commands.announce;

commands.open = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    await ctx.sock.groupSettingUpdate(ctx.from, 'not_announcement');
    await reply(ctx, '🔓 Group opened. Everyone can send.');
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.close = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    await ctx.sock.groupSettingUpdate(ctx.from, 'announcement');
    await reply(ctx, '🔒 Group closed. Only admins can send.');
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.opentime = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.q) return reply(ctx, 'Usage: .opentime <HH:MM> (24h format)');
  global.groupOpenTime = ctx.from;
  global.openTime = ctx.q;
  await reply(ctx, '✅ Group will open at: ' + ctx.q + ' (simplified)');
};

commands.closetime = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.q) return reply(ctx, 'Usage: .closetime <HH:MM> (24h format)');
  global.groupCloseTime = ctx.from;
  global.closeTime = ctx.q;
  await reply(ctx, '✅ Group will close at: ' + ctx.q + ' (simplified)');
};

commands.getlink = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    const code = await ctx.sock.groupInviteCode(ctx.from);
    await reply(ctx, '🔗 Group link: https://chat.whatsapp.com/' + code);
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.revoke = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    await ctx.sock.groupRevokeInvite(ctx.from);
    const code = await ctx.sock.groupInviteCode(ctx.from);
    await reply(ctx, '✅ Link revoked. New link: https://chat.whatsapp.com/' + code);
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.gcinfo = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const admins = meta.participants.filter(p => p.admin);
    const msg = '👥 *Group Info*\nName: ' + meta.subject + '\nMembers: ' + meta.participants.length + '\nAdmins: ' + admins.length + '\nCreated: ' + new Date(meta.creation * 1000).toDateString();
    await reply(ctx, msg);
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.groupid = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  await reply(ctx, '🆔 Group ID: ' + ctx.from);
};

commands.listmembers = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const members = meta.participants.map(m => '@' + m.id.split('@')[0]);
    const chunks = [];
    let current = '';
    members.forEach((m, i) => {
      if (current.length + m.length > 2000) {
        chunks.push(current);
        current = '';
      }
      current += (i+1) + '. ' + m + '\n';
    });
    if (current) chunks.push(current);
    await ctx.sock.sendMessage(ctx.from, { text: '👥 *Members (' + members.length + ')*\n' + chunks[0] }, { quoted: ctx.msg });
    if (chunks.length > 1) {
      for (let i = 1; i < chunks.length; i++) {
        await ctx.sock.sendMessage(ctx.from, { text: chunks[i] }, { quoted: ctx.msg });
      }
    }
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.admins = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const admins = meta.participants.filter(p => p.admin);
    const list = admins.map((p, i) => (i+1) + '. @' + p.id.split('@')[0]).join('\n');
    const mentions = admins.map(p => p.id);
    await ctx.sock.sendMessage(ctx.from, { text: '👑 *Admins*\n' + list, mentions }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.pin = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    await ctx.sock.pinChat(ctx.from, true);
    await reply(ctx, '✅ Group pinned.');
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.unpin = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    await ctx.sock.pinChat(ctx.from, false);
    await reply(ctx, '✅ Group unpinned.');
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.poll = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.q) return reply(ctx, 'Usage: .poll <question> | <option1> | <option2>');
  const parts = ctx.q.split('|').map(s => s.trim());
  if (parts.length < 3) return reply(ctx, '❌ Need at least 2 options.');
  const question = parts[0];
  const options = parts.slice(1);
  let msg = '📊 *POLL*\n\n❓ ' + question + '\n\n';
  options.forEach((opt, i) => {
    msg += (i+1) + '. ' + opt + '\n';
  });
  msg += '\n_Vote by replying with the number!_';
  await reply(ctx, msg);
};

commands.creategc = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .creategc <group name>');
  try {
    const group = await ctx.sock.groupCreate(ctx.q, [ctx.sender + '@s.whatsapp.net']);
    await reply(ctx, '✅ Group created: ' + ctx.q + '\nID: ' + group.id);
  } catch {
    await reply(ctx, '❌ Failed to create group.');
  }
};

commands.left = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    await ctx.sock.groupLeave(ctx.from);
    await reply(ctx, '✅ Left the group.');
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.find = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.q) return reply(ctx, 'Usage: .find <name>');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const found = meta.participants.filter(p => p.id.includes(ctx.q) || p.id.split('@')[0].includes(ctx.q));
    if (!found.length) return reply(ctx, '❌ No users found.');
    const list = found.map(p => '@' + p.id.split('@')[0]).join(' ');
    await ctx.sock.sendMessage(ctx.from, { text: '🔍 Found:\n' + list, mentions: found.map(p => p.id) }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

// ─── KICK/ADD/PROMOTE/DEMOTE ──────────────────────────────────
commands.kick = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  const num = ctx.q?.replace(/[^0-9]/g, '');
  if (!mention && !num) return reply(ctx, '❌ Mention the user or provide number.');
  try {
    const jid = mention || num + '@s.whatsapp.net';
    await ctx.sock.groupParticipantsUpdate(ctx.from, [jid], 'remove');
    await reply(ctx, '✅ Kicked @' + jid.split('@')[0]);
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.add = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .add <number>');
  try {
    const num = ctx.q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    await ctx.sock.groupParticipantsUpdate(ctx.from, [num], 'add');
    await reply(ctx, '✅ Added ' + num);
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.promote = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user.');
  try {
    await ctx.sock.groupParticipantsUpdate(ctx.from, [mention], 'promote');
    await reply(ctx, '✅ Promoted @' + mention.split('@')[0]);
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.demote = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user.');
  try {
    await ctx.sock.groupParticipantsUpdate(ctx.from, [mention], 'demote');
    await reply(ctx, '✅ Demoted @' + mention.split('@')[0]);
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.promoteall = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const nonAdmins = meta.participants.filter(p => !p.admin);
    let count = 0;
    for (const p of nonAdmins) {
      try {
        await ctx.sock.groupParticipantsUpdate(ctx.from, [p.id], 'promote');
        count++;
        await new Promise(r => setTimeout(r, 500));
      } catch {}
    }
    await reply(ctx, '✅ Promoted ' + count + ' members.');
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.demoteall = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const admins = meta.participants.filter(p => p.admin);
    let count = 0;
    for (const p of admins) {
      try {
        await ctx.sock.groupParticipantsUpdate(ctx.from, [p.id], 'demote');
        count++;
        await new Promise(r => setTimeout(r, 500));
      } catch {}
    }
    await reply(ctx, '✅ Demoted ' + count + ' admins.');
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.demotealladmins = commands.demoteall;

commands.kickall = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const members = meta.participants.filter(p => !p.admin && !p.id.includes(ctx.sock.user.id));
    let count = 0;
    for (const p of members) {
      try {
        await ctx.sock.groupParticipantsUpdate(ctx.from, [p.id], 'remove');
        count++;
        await new Promise(r => setTimeout(r, 500));
      } catch {}
    }
    await reply(ctx, '✅ Kicked ' + count + ' members.');
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.findfriends = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const contacts = meta.participants.filter(p => p.id.includes('@s.whatsapp.net'));
    const list = contacts.map(p => '📱 @' + p.id.split('@')[0]).join('\n');
    const mentions = contacts.map(p => p.id);
    await ctx.sock.sendMessage(ctx.from, { text: '👥 *Contacts in group*\n' + list.slice(0, 1000), mentions }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

// ─── BAN / UNBAN / LISTBAN ────────────────────────────────────
commands.ban = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user.');
  const data = loadGroupData();
  if (!data[ctx.from]) data[ctx.from] = {};
  if (!data[ctx.from].bans) data[ctx.from].bans = [];
  if (!data[ctx.from].bans.includes(mention)) {
    data[ctx.from].bans.push(mention);
    saveGroupData(data);
  }
  try {
    await ctx.sock.groupParticipantsUpdate(ctx.from, [mention], 'remove');
    await ctx.sock.sendMessage(ctx.from, { text: '🚫 Banned @' + mention.split('@')[0], mentions: [mention] }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Failed to kick.');
  }
};

commands.unban = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user.');
  const data = loadGroupData();
  if (data[ctx.from] && data[ctx.from].bans) {
    data[ctx.from].bans = data[ctx.from].bans.filter(jid => jid !== mention);
    saveGroupData(data);
  }
  await ctx.sock.sendMessage(ctx.from, { text: '✅ Unbanned @' + mention.split('@')[0], mentions: [mention] }, { quoted: ctx.msg });
};

commands.listban = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  const data = loadGroupData();
  if (!data[ctx.from] || !data[ctx.from].bans || !data[ctx.from].bans.length) {
    return reply(ctx, '✅ No banned users in this group.');
  }
  const list = data[ctx.from].bans.map((jid, i) => (i+1) + '. @' + jid.split('@')[0]).join('\n');
  const mentions = data[ctx.from].bans;
  await ctx.sock.sendMessage(ctx.from, { text: '🚫 *Banned Users*\n' + list, mentions }, { quoted: ctx.msg });
};

// ─── WARN / UNWARN / LISTWARN / RESETWARNS ──────────────────
commands.warn = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user.');
  const data = loadGroupData();
  if (!data[ctx.from]) data[ctx.from] = {};
  if (!data[ctx.from].warns) data[ctx.from].warns = {};
  data[ctx.from].warns[mention] = (data[ctx.from].warns[mention] || 0) + 1;
  const count = data[ctx.from].warns[mention];
  saveGroupData(data);
  await ctx.sock.sendMessage(ctx.from, {
    text: '⚠️ *Warning ' + count + '/3*\n@' + mention.split('@')[0] + ' has been warned.',
    mentions: [mention]
  }, { quoted: ctx.msg });
  if (count >= 3) {
    try {
      await ctx.sock.groupParticipantsUpdate(ctx.from, [mention], 'remove');
      await reply(ctx, '🚨 User kicked for reaching 3 warnings.');
      data[ctx.from].warns[mention] = 0;
      saveGroupData(data);
    } catch {}
  }
};

commands.unwarn = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user.');
  const data = loadGroupData();
  if (data[ctx.from] && data[ctx.from].warns && data[ctx.from].warns[mention]) {
    delete data[ctx.from].warns[mention];
    saveGroupData(data);
    await ctx.sock.sendMessage(ctx.from, { text: '✅ Warnings removed for @' + mention.split('@')[0], mentions: [mention] }, { quoted: ctx.msg });
  } else {
    await reply(ctx, '❌ No warnings found.');
  }
};

commands.listwarn = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  const data = loadGroupData();
  if (!data[ctx.from] || !data[ctx.from].warns || !Object.keys(data[ctx.from].warns).length) {
    return reply(ctx, '✅ No warnings in this group.');
  }
  const list = Object.entries(data[ctx.from].warns).map(([jid, count]) => {
    return '@' + jid.split('@')[0] + ': ' + count + '/3';
  }).join('\n');
  const mentions = Object.keys(data[ctx.from].warns);
  await ctx.sock.sendMessage(ctx.from, { text: '⚠️ *Warnings*\n' + list, mentions }, { quoted: ctx.msg });
};

commands.resetwarns = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user.');
  const data = loadGroupData();
  if (data[ctx.from] && data[ctx.from].warns && data[ctx.from].warns[mention]) {
    delete data[ctx.from].warns[mention];
    saveGroupData(data);
    await ctx.sock.sendMessage(ctx.from, { text: '✅ Warnings reset for @' + mention.split('@')[0], mentions: [mention] }, { quoted: ctx.msg });
  } else {
    await reply(ctx, '❌ No warnings found.');
  }
};

// ─── MUTE / UNMUTE ────────────────────────────────────────────
commands.mute = commands.mute_gc = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    await ctx.sock.groupSettingUpdate(ctx.from, 'announcement');
    await reply(ctx, '🔇 Group muted. Only admins can send.');
  } catch {
    await reply(ctx, '❌ Failed. I need admin rights.');
  }
};

commands.unmute = commands.unmute_gc = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    await ctx.sock.groupSettingUpdate(ctx.from, 'not_announcement');
    await reply(ctx, '🔊 Group unmuted. Everyone can send.');
  } catch {
    await reply(ctx, '❌ Failed. I need admin rights.');
  }
};

// ─── AUTOLINK ──────────────────────────────────────────────────
commands.autolink = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const data = loadGroupData();
  if (!data[ctx.from]) data[ctx.from] = {};
  data[ctx.from].autoLink = !data[ctx.from].autoLink;
  saveGroupData(data);
  await reply(ctx, '✅ Auto-link: ' + (data[ctx.from].autoLink ? 'ON' : 'OFF'));
};

// ─── SETGCNAME ─────────────────────────────────────────────────
commands.setgcname = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .setgcname <name>');
  try {
    await ctx.sock.groupUpdateSubject(ctx.from, ctx.q);
    await reply(ctx, '✅ Group name updated to: ' + ctx.q);
  } catch {
    await reply(ctx, '❌ Failed. I need admin rights.');
  }
};

// ─── SETGCDESC ─────────────────────────────────────────────────
commands.setgcdesc = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .setgcdesc <description>');
  try {
    await ctx.sock.groupUpdateDescription(ctx.from, ctx.q);
    await reply(ctx, '✅ Group description updated.');
  } catch {
    await reply(ctx, '❌ Failed. I need admin rights.');
  }
};

// ─── SETGCPP / DELGCPP ──────────────────────────────────────
commands.setgcpp = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image.');
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    await ctx.sock.updateProfilePicture(ctx.from, media);
    await reply(ctx, '✅ Group profile picture updated.');
  } catch {
    await reply(ctx, '❌ Failed. I need admin rights.');
  }
};

commands.delgcpp = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    await ctx.sock.updateProfilePicture(ctx.from, null);
    await reply(ctx, '✅ Group profile picture deleted.');
  } catch {
    await reply(ctx, '❌ Failed. I need admin rights.');
  }
};

// ─── ACCEPTALL / REJECTALL ──────────────────────────────────
commands.acceptall = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    const requests = await ctx.sock.groupRequestParticipantsList(ctx.from);
    if (!requests || !requests.length) return reply(ctx, '✅ No pending join requests.');
    let accepted = 0;
    for (const req of requests) {
      try {
        await ctx.sock.groupRequestParticipantsUpdate(ctx.from, [req.jid], 'approve');
        accepted++;
        await new Promise(r => setTimeout(r, 500));
      } catch {}
    }
    await reply(ctx, '✅ Accepted ' + accepted + ' requests.');
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.rejectall = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    const requests = await ctx.sock.groupRequestParticipantsList(ctx.from);
    if (!requests || !requests.length) return reply(ctx, '✅ No pending join requests.');
    let rejected = 0;
    for (const req of requests) {
      try {
        await ctx.sock.groupRequestParticipantsUpdate(ctx.from, [req.jid], 'reject');
        rejected++;
        await new Promise(r => setTimeout(r, 500));
      } catch {}
    }
    await reply(ctx, '✅ Rejected ' + rejected + ' requests.');
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

// ─── REPORT ──────────────────────────────────────────────────
commands.report = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user to report.');
  await ctx.sock.sendMessage(ctx.from, {
    text: '📢 *REPORT*\n@' + mention.split('@')[0] + ' has been reported by @' + ctx.sender + '\nReason: ' + (ctx.q || 'Spam'),
    mentions: [mention, ctx.sender + '@s.whatsapp.net']
  }, { quoted: ctx.msg });
};

// ─── EVENT ──────────────────────────────────────────────────
commands.event = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Groups only.');
  if (!ctx.q) return reply(ctx, 'Usage: .event Title | DD/MM/YYYY | HH:MM');
  const parts = ctx.q.split('|').map(s => s.trim());
  if (parts.length < 3) return reply(ctx, '❌ Format: Title | DD/MM/YYYY | HH:MM');
  const [title, date, time] = parts;
  global.eventData = { title, date, time };
  await reply(ctx, '📅 *Event Created*\nTitle: ' + title + '\nDate: ' + date + '\nTime: ' + time);
};

commands.eventinfo = async function(ctx) {
  if (!global.eventData) return reply(ctx, '❌ No event set.');
  const { title, date, time } = global.eventData;
  await reply(ctx, '📅 *Event Info*\nTitle: ' + title + '\nDate: ' + date + '\nTime: ' + time);
};

// ─── ONLINE ──────────────────────────────────────────────────
commands.online = async function(ctx) {
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention a user.');
  // Check if user is online (simplified)
  await ctx.sock.sendMessage(ctx.from, {
    text: '🟢 @' + mention.split('@')[0] + ' is likely online (simplified check)',
    mentions: [mention]
  }, { quoted: ctx.msg });
};

// ─── CONTACT ──────────────────────────────────────────────────
commands.contact = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .contact <number> [name]');
  const parts = ctx.q.split(' ');
  const number = parts[0].replace(/[^0-9]/g, '');
  const name = parts.slice(1).join(' ') || 'Contact';
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:+${number}\nEND:VCARD`;
  await ctx.sock.sendMessage(ctx.from, {
    contacts: { displayName: name, contacts: [{ vcard }] }
  }, { quoted: ctx.msg });
};

module.exports = commands;
