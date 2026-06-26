const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const sharp = require('sharp');
const axios = require('axios');

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

const commands = {};

// ─── STICKERINFO ──────────────────────────────────────────────
commands.stickerinfo = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.stickerMessage) {
    return reply(ctx, '❌ Reply to a sticker with .stickerinfo');
  }
  try {
    const sticker = msg.stickerMessage;
    const info = `
📦 *Sticker Info*
📏 Width: ${sticker.width || 'Unknown'}
📏 Height: ${sticker.height || 'Unknown'}
📁 MIME Type: ${sticker.mimetype || 'Unknown'}
🆔 ID: ${sticker.stickerId || 'Unknown'}
📦 Pack: ${sticker.packId || 'Unknown'}
👤 Author: ${sticker.stickerAuthor || 'Unknown'}
`;
    await reply(ctx, info);
  } catch (e) {
    await reply(ctx, '❌ Failed to get sticker info: ' + e.message);
  }
};

// ─── TXTSTICKER ──────────────────────────────────────────────
commands.txtsticker = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .txtsticker <text>\nExample: .txtsticker Hello World!');
  try {
    await reply(ctx, '⏳ Creating text sticker...');
    const text = ctx.q;
    const canvas = require('canvas');
    const c = canvas.createCanvas(512, 512);
    const ctx2 = c.getContext('2d');
    
    // Background
    const gradient = ctx2.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.5, '#ffd93d');
    gradient.addColorStop(1, '#6bcb77');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 512, 512);
    
    // Text
    ctx2.font = 'bold 60px Arial';
    ctx2.fillStyle = 'white';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.shadowColor = 'black';
    ctx2.shadowBlur = 10;
    const lines = text.match(/.{1,10}/g) || [text];
    lines.forEach((line, i) => {
      ctx2.fillText(line, 256, 256 - (lines.length-1)*30 + i*60);
    });
    
    const buffer = c.toBuffer('image/png');
    // Convert to webp sticker
    const stickerBuffer = await sharp(buffer)
      .resize(512, 512, { fit: 'contain' })
      .webp({ quality: 70 })
      .toBuffer();
    
    await ctx.sock.sendMessage(ctx.from, { sticker: stickerBuffer }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Text sticker failed: ' + e.message);
  }
};

// ─── TGSTICKER ──────────────────────────────────────────────
commands.tgsticker = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .tgsticker <telegram_sticker_link>\nExample: .tgsticker https://t.me/addstickers/ExamplePack');
  try {
    await reply(ctx, '⏳ Fetching Telegram sticker...');
    const link = ctx.q;
    const match = link.match(/addstickers\/([a-zA-Z0-9_]+)/);
    if (!match) return reply(ctx, '❌ Invalid Telegram sticker link.');
    const packName = match[1];
    
    // Use public Telegram sticker API
    const response = await axios.get(`https://api.telegram.org/bot/getStickerSet?name=${packName}`);
    if (!response.data || !response.data.ok) {
      return reply(ctx, '❌ Sticker pack not found.');
    }
    
    const stickers = response.data.result.stickers || [];
    if (stickers.length === 0) return reply(ctx, '❌ No stickers in this pack.');
    
    const sticker = stickers[0];
    const fileId = sticker.file_id;
    const fileUrl = `https://api.telegram.org/file/bot/getFile?file_id=${fileId}`;
    
    const fileResp = await axios.get(fileUrl);
    if (!fileResp.data || !fileResp.data.ok) return reply(ctx, '❌ Failed to get sticker file.');
    
    const filePath = fileResp.data.result.file_path;
    const stickerUrl = `https://api.telegram.org/file/bot/${filePath}`;
    const stickerData = await axios.get(stickerUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(stickerData.data);
    
    await ctx.sock.sendMessage(ctx.from, { sticker: buffer }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed to get Telegram sticker: ' + e.message);
  }
};

// ─── ALBUM ────────────────────────────────────────────────────
commands.album = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .album <title>\nExample: .album My Sticker Pack');
  try {
    const title = ctx.q;
    await reply(ctx, `⏳ Creating sticker album "${title}"...`);
    
    // Store album info
    global._stickerAlbum = global._stickerAlbum || {};
    global._stickerAlbum[ctx.from] = {
      title: title,
      stickers: [],
      created: Date.now(),
      user: ctx.sender
    };
    
    await reply(ctx, `📦 Sticker album "${title}" created!\n\nReply to stickers with .addsticker to add to the album.\nType .finalize to finish and send the album.`);
  } catch (e) {
    await reply(ctx, '❌ Failed to create album: ' + e.message);
  }
};

// ─── ADDSTICKER ──────────────────────────────────────────────
commands.addsticker = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.stickerMessage) {
    return reply(ctx, '❌ Reply to a sticker with .addsticker');
  }
  if (!global._stickerAlbum || !global._stickerAlbum[ctx.from]) {
    return reply(ctx, '❌ No active album. Use .album <title> first.');
  }
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    global._stickerAlbum[ctx.from].stickers.push(media);
    await reply(ctx, `✅ Sticker added! (${global._stickerAlbum[ctx.from].stickers.length} total)`);
  } catch (e) {
    await reply(ctx, '❌ Failed to add sticker: ' + e.message);
  }
};

// ─── FINALIZE ────────────────────────────────────────────────
commands.finalize = async function(ctx) {
  if (!global._stickerAlbum || !global._stickerAlbum[ctx.from]) {
    return reply(ctx, '❌ No active album.');
  }
  try {
    const album = global._stickerAlbum[ctx.from];
    if (album.stickers.length === 0) {
      return reply(ctx, '❌ No stickers in album. Add some with .addsticker');
    }
    await reply(ctx, `📦 Sending album "${album.title}" (${album.stickers.length} stickers)...`);
    
    // Send all stickers in the album
    for (const sticker of album.stickers) {
      await ctx.sock.sendMessage(ctx.from, { sticker: sticker }, { quoted: ctx.msg });
      await new Promise(r => setTimeout(r, 500));
    }
    
    await reply(ctx, `✅ Album "${album.title}" sent! (${album.stickers.length} stickers)`);
    delete global._stickerAlbum[ctx.from];
  } catch (e) {
    await reply(ctx, '❌ Failed to finalize album: ' + e.message);
  }
};

module.exports = commands;
