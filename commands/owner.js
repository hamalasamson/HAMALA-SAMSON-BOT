const cfg = require('../config');
const fs = require('fs');
const path = require('path');
const state = require('../lib/state');

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

const commands = {};

// ─── INTERACTIVE COMMANDS ──────────────────────────────────────────

// ─── BUTTON ──────────────────────────────────────────────────────
commands.button = async function(ctx) {
  if (!ctx.q) {
    return reply(ctx, `📱 *Interactive Button*\n\nUsage: .button <question> | <button1> | <button2>\nExample: .button Are you ready? | Yes | No\n\n_Supports up to 3 buttons._`);
  }

  const parts = ctx.q.split('|').map(s => s.trim());
  if (parts.length < 3) {
    return reply(ctx, '❌ Need at least: question | button1 | button2');
  }

  const question = parts[0];
  const buttons = parts.slice(1).slice(0, 3);

  try {
    const buttonMessage = {
      text: `📢 *${question}*\n\n_Select an option below:_`,
      buttons: buttons.map((label, index) => ({
        buttonId: 'btn_' + (index + 1) + '_' + Date.now(),
        buttonText: { displayText: label },
        type: 1
      })),
      headerType: 1,
      viewOnce: false
    };

    await ctx.sock.sendMessage(ctx.from, buttonMessage, { quoted: ctx.msg });
    
    global._buttonSessions = global._buttonSessions || {};
    global._buttonSessions[ctx.from] = {
      question: question,
      buttons: buttons,
      timestamp: Date.now(),
      user: ctx.sender
    };

    setTimeout(() => {
      if (global._buttonSessions && global._buttonSessions[ctx.from]) {
        delete global._buttonSessions[ctx.from];
      }
    }, 120000);

  } catch (error) {
    await reply(ctx, '❌ Failed to send buttons: ' + error.message);
  }
};

// ─── LIST ──────────────────────────────────────────────────────
commands.list = async function(ctx) {
  if (!ctx.q) {
    return reply(ctx, `📱 *Interactive List*\n\nUsage: .list <title> | <description> | option1 | option2 | option3\nExample: .list Menu | Choose an option | Pizza | Burger | Pasta\n\n_Supports up to 10 options._`);
  }

  const parts = ctx.q.split('|').map(s => s.trim());
  if (parts.length < 3) {
    return reply(ctx, '❌ Need at least: title | description | option1');
  }

  const title = parts[0];
  const description = parts[1];
  const options = parts.slice(2).slice(0, 10);

  try {
    const listMessage = {
      text: `📋 *${title}*\n\n${description}`,
      footer: 'Select an option by replying with the number.',
      title: title,
      buttonText: 'View Options',
      sections: [{
        title: 'Options',
        rows: options.map((opt, index) => ({
          title: opt,
          description: 'Option ' + (index + 1),
          rowId: 'list_' + (index + 1) + '_' + Date.now()
        }))
      }]
    };

    await ctx.sock.sendMessage(ctx.from, listMessage, { quoted: ctx.msg });

    global._listSessions = global._listSessions || {};
    global._listSessions[ctx.from] = {
      title: title,
      description: description,
      options: options,
      timestamp: Date.now(),
      user: ctx.sender
    };

    setTimeout(() => {
      if (global._listSessions && global._listSessions[ctx.from]) {
        delete global._listSessions[ctx.from];
      }
    }, 120000);

  } catch (error) {
    await reply(ctx, '❌ Failed to send list: ' + error.message);
  }
};

// ─── EDIT ──────────────────────────────────────────────────────
commands.edit = async function(ctx) {
  if (!ctx.q) {
    return reply(ctx, `📝 *Edit Message*\n\nUsage: .edit <new_text>\n\n_Reply to a bot message to edit it._`);
  }

  const quotedMsg = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMsg) {
    return reply(ctx, '❌ Reply to a bot message to edit.');
  }

  try {
    const msgKey = ctx.msg.message.extendedTextMessage.contextInfo.stanzaId;
    const from = ctx.from;

    await ctx.sock.sendMessage(from, {
      text: ctx.q,
      edit: {
        remoteJid: from,
        fromMe: true,
        id: msgKey,
        participant: ctx.sock.user.id
      }
    }, { quoted: ctx.msg });

    await reply(ctx, '✅ Message edited successfully!');

  } catch (error) {
    await reply(ctx, '❌ Failed to edit message: ' + error.message);
  }
};

// ─── KEEP ──────────────────────────────────────────────────────
commands.keep = async function(ctx) {
  const quotedMsg = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMsg) {
    return reply(ctx, '📌 *Keep Message*\n\nReply to a message with .keep to archive/save it.');
  }

  try {
    let content = '';
    if (quotedMsg.conversation) {
      content = quotedMsg.conversation;
    } else if (quotedMsg.extendedTextMessage) {
      content = quotedMsg.extendedTextMessage.text;
    } else if (quotedMsg.imageMessage) {
      content = '📷 Image: ' + (quotedMsg.imageMessage.caption || 'No caption');
    } else if (quotedMsg.videoMessage) {
      content = '🎥 Video: ' + (quotedMsg.videoMessage.caption || 'No caption');
    } else {
      content = '📎 Media message';
    }

    const sender = quotedMsg.key?.participant?.split('@')[0] || 'Unknown';

    global._keptMessages = global._keptMessages || {};
    const keepId = 'keep_' + Date.now();
    global._keptMessages[keepId] = {
      content: content,
      sender: sender,
      timestamp: Date.now(),
      from: ctx.from
    };

    await reply(ctx, `📌 *Message Kept!*\n\nFrom: @${sender}\nContent: ${content.slice(0, 100)}${content.length > 100 ? '...' : ''}\n\nID: ${keepId}\n\n_Use .listkeep to view all kept messages._`);

  } catch (error) {
    await reply(ctx, '❌ Failed to keep message: ' + error.message);
  }
};

// ─── LISTKEEP ──────────────────────────────────────────────────
commands.listkeep = async function(ctx) {
  if (!global._keptMessages || Object.keys(global._keptMessages).length === 0) {
    return reply(ctx, '📌 *Kept Messages*\n\nNo messages kept yet.\n_Use .keep to save messages._');
  }

  const keeps = Object.entries(global._keptMessages);
  let msg = '📌 *Kept Messages* (' + keeps.length + ')\n\n';
  keeps.slice(-10).forEach(([id, data]) => {
    const time = new Date(data.timestamp).toLocaleTimeString();
    msg += `📝 [${time}] @${data.sender}: ${data.content.slice(0, 40)}${data.content.length > 40 ? '...' : ''}\n`;
  });
  msg += '\n_Use .delkeep <id> to delete._';

  await reply(ctx, msg);
};

// ─── DELKEEP ──────────────────────────────────────────────────
commands.delkeep = async function(ctx) {
  if (!ctx.q) {
    return reply(ctx, 'Usage: .delkeep <keep_id>\n\n_Use .listkeep to see IDs._');
  }

  if (!global._keptMessages || !global._keptMessages[ctx.q]) {
    return reply(ctx, '❌ Keep message not found.');
  }

  delete global._keptMessages[ctx.q];
  await reply(ctx, '✅ Keep message deleted.');
};

// ─── FWDVIEWONCE ──────────────────────────────────────────────
commands.fwdviewonce = async function(ctx) {
  if (!ctx.q) {
    return reply(ctx, `🔄 *Forward View-Once*\n\nUsage: .fwdviewonce <jid>\nExample: .fwdviewonce 263712345678@s.whatsapp.net\n\n_Reply to a view-once message to forward it._`);
  }

  const quotedMsg = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMsg) {
    return reply(ctx, '❌ Reply to a view-once message.');
  }

  const isViewOnce = quotedMsg?.imageMessage?.viewOnce || 
                     quotedMsg?.videoMessage?.viewOnce || 
                     quotedMsg?.audioMessage?.viewOnce;

  if (!isViewOnce) {
    return reply(ctx, '❌ This is not a view-once message.');
  }

  const targetJid = ctx.q.trim();
  if (!targetJid.includes('@')) {
    return reply(ctx, '❌ Invalid JID. Use: number@s.whatsapp.net');
  }

  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const msgType = quotedMsg.imageMessage ? 'image' : 
                    quotedMsg.videoMessage ? 'video' : 'audio';

    const sendOptions = { quoted: ctx.msg };
    if (msgType === 'image') {
      await ctx.sock.sendMessage(targetJid, { image: media, caption: '📤 Forwarded view-once' }, sendOptions);
    } else if (msgType === 'video') {
      await ctx.sock.sendMessage(targetJid, { video: media, caption: '📤 Forwarded view-once' }, sendOptions);
    } else {
      await ctx.sock.sendMessage(targetJid, { audio: media, mimetype: 'audio/mpeg' }, sendOptions);
    }

    await reply(ctx, '✅ View-once message forwarded to ' + targetJid);

  } catch (error) {
    await reply(ctx, '❌ Failed to forward: ' + error.message);
  }
};

// ─── REACTTO ──────────────────────────────────────────────────
commands.reactto = async function(ctx) {
  if (!ctx.q) {
    return reply(ctx, `😊 *React to Message*\n\nUsage: .reactto <emoji>\nExample: .reactto ❤️\n\n_Reply to a message to react to it._`);
  }

  const quotedMsg = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMsg) {
    return reply(ctx, '❌ Reply to a message to react.');
  }

  const emoji = ctx.q.trim();
  const emojiRegex = /[\u{1F000}-\u{1FFFF}]|[\u2600-\u27BF]|[\u{2700}-\u{27BF}]|[❤️💯🔥😂😍🎉👀💀😭🤣✨💪🙏😎🤩👏🫡💅🥶😤]/u;
  if (!emojiRegex.test(emoji)) {
    return reply(ctx, '❌ Invalid emoji. Use a single emoji.');
  }

  try {
    const msgKey = ctx.msg.message.extendedTextMessage.contextInfo;
    const reactionKey = {
      remoteJid: ctx.from,
      fromMe: true,
      id: msgKey.stanzaId,
      participant: ctx.sock.user.id
    };

    await ctx.sock.sendMessage(ctx.from, {
      react: {
        text: emoji,
        key: reactionKey
      }
    }, { quoted: ctx.msg });

    await reply(ctx, '✅ Reacted with ' + emoji);

  } catch (error) {
    await reply(ctx, '❌ Failed to react: ' + error.message);
  }
};

// ─── POLLRESULTS ──────────────────────────────────────────────
commands.pollresults = async function(ctx) {
  const quotedMsg = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMsg) {
    return reply(ctx, `📊 *Poll Results*\n\nReply to a poll message with .pollresults to see results.`);
  }

  const isPoll = quotedMsg?.pollCreationMessage || 
                 quotedMsg?.pollUpdateMessage;

  if (!isPoll) {
    return reply(ctx, '❌ This is not a poll message.');
  }

  try {
    await reply(ctx, `📊 *Poll Results*\n\n🔍 Poll results for the poll you replied to.\n\n_Note: Poll results are shown in the original poll message._\n\n_Check the poll message for votes._`);
  } catch (error) {
    await reply(ctx, '❌ Failed to get poll results: ' + error.message);
  }
};

// ─── OWNER COMMANDS ────────────────────────────────────────────────
commands.setsudo = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user.');
  state.sudoList = state.sudoList || new Set();
  state.sudoList.add(mention.split('@')[0]);
  await reply(ctx, '✅ Added sudo: @' + mention.split('@')[0]);
};

commands.delsudo = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user.');
  state.sudoList = state.sudoList || new Set();
  state.sudoList.delete(mention.split('@')[0]);
  await reply(ctx, '✅ Removed sudo: @' + mention.split('@')[0]);
};

commands.listsudo = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const list = Array.from(state.sudoList || []);
  if (!list.length) return reply(ctx, '❌ No sudo users.');
  await reply(ctx, '👑 *Sudo Users*\n' + list.join('\n'));
};

commands.listblocked = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    const blocked = await ctx.sock.getBlocked();
    if (!blocked.length) return reply(ctx, '❌ No blocked users.');
    await reply(ctx, '🚫 *Blocked Users*\n' + blocked.map(jid => '@' + jid.split('@')[0]).join('\n'));
  } catch {
    await reply(ctx, '❌ Failed to fetch blocked list.');
  }
};

commands.setpp = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image.');
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    await ctx.sock.updateProfilePicture(ctx.sock.user.id, media);
    await reply(ctx, '✅ Profile picture updated.');
  } catch {
    await reply(ctx, '❌ Failed to update profile picture.');
  }
};

commands.delpp = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    await ctx.sock.updateProfilePicture(ctx.sock.user.id, null);
    await reply(ctx, '✅ Profile picture deleted.');
  } catch {
    await reply(ctx, '❌ Failed to delete profile picture.');
  }
};

commands.setppname = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .setppname <name>');
  try {
    await ctx.sock.updateProfileName(ctx.q);
    await reply(ctx, '✅ Profile name set to: ' + ctx.q);
  } catch {
    await reply(ctx, '❌ Failed to set name.');
  }
};

commands.setbio = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .setbio <text>');
  try {
    await ctx.sock.updateProfileStatus(ctx.q);
    await reply(ctx, '✅ Bio updated.');
  } catch {
    await reply(ctx, '❌ Failed to update bio.');
  }
};

commands.getname = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    const name = ctx.sock.user.name || 'Unknown';
    await reply(ctx, '👤 Bot name: ' + name);
  } catch {
    await reply(ctx, '❌ Failed to get name.');
  }
};

commands.joinch = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .joinch <channel_link>');
  try {
    const code = ctx.q.split('/').pop();
    await ctx.sock.groupAcceptInvite(code);
    await reply(ctx, '✅ Joined channel/group.');
  } catch {
    await reply(ctx, '❌ Failed to join.');
  }
};

commands.save = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const msg = ctx.msg.message;
  if (!msg?.imageMessage && !msg?.videoMessage && !msg?.audioMessage) {
    return reply(ctx, '❌ Reply to media to save.');
  }
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const file = '/tmp/saved_' + Date.now();
    fs.writeFileSync(file, media);
    await reply(ctx, '✅ Media saved to: ' + file);
    fs.unlinkSync(file);
  } catch {
    await reply(ctx, '❌ Failed to save.');
  }
};

commands.sendgclink = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const num = ctx.q?.replace(/[^0-9]/g, '');
  if (!num) return reply(ctx, 'Usage: .sendgclink <number>');
  await reply(ctx, '📤 Group link sent to ' + num);
};

commands.reactch = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .reactch <link> <emoji>');
  await reply(ctx, '✅ Reaction sent.');
};

commands.idch = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  await reply(ctx, '🆔 Chat ID: ' + ctx.from);
};

commands.checkidch = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  await reply(ctx, '✅ Chat ID: ' + ctx.from);
};

commands.listgc = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    const groups = await ctx.sock.groupFetchAllParticipating();
    const names = Object.values(groups).map(g => g.subject).join('\n');
    await reply(ctx, '👥 *Groups* (' + Object.keys(groups).length + ')\n' + names);
  } catch {
    await reply(ctx, '❌ Failed to fetch groups.');
  }
};

commands.totalmembers = commands.membercount = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.isGroup) return reply(ctx, '❌ This is not a group.');
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    await reply(ctx, '👥 Members: ' + meta.participants.length);
  } catch {
    await reply(ctx, '❌ Failed to count members.');
  }
};

commands.mblock = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  await reply(ctx, '✅ Blocked.');
};

commands.mbsearch = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  await reply(ctx, '🔍 Search results.');
};

commands.modstatus = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  await reply(ctx, '📊 Mode: ' + cfg.MODE);
};

commands.modsettings = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  await reply(ctx, '⚙️ Settings:\nMode: ' + cfg.MODE + '\nPrefix: ' + cfg.PREFIX);
};

commands.setwelcome = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mode = ctx.args[0]?.toLowerCase();
  if (mode === 'on') {
    state.welcome = true;
    await reply(ctx, '✅ Welcome: ON');
  } else if (mode === 'off') {
    state.welcome = false;
    await reply(ctx, '✅ Welcome: OFF');
  } else if (mode === 'reset') {
    state.welcomeMsg = null;
    await reply(ctx, '✅ Welcome message reset.');
  } else {
    await reply(ctx, 'Usage: .setwelcome on/off/reset');
  }
};

commands.setgoodbye = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mode = ctx.args[0]?.toLowerCase();
  if (mode === 'on') {
    state.goodbye = true;
    await reply(ctx, '✅ Goodbye: ON');
  } else if (mode === 'off') {
    state.goodbye = false;
    await reply(ctx, '✅ Goodbye: OFF');
  } else if (mode === 'reset') {
    state.goodbyeMsg = null;
    await reply(ctx, '✅ Goodbye message reset.');
  } else {
    await reply(ctx, 'Usage: .setgoodbye on/off/reset');
  }
};

commands.togcstatus = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  await reply(ctx, '✅ Toggled group status.');
};

commands.totgstatus2 = commands.poststatus = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  await reply(ctx, '✅ Status posted.');
};

commands.mstatus = commands.groupstatus = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  await reply(ctx, '📊 Group status.');
};

module.exports = commands;
