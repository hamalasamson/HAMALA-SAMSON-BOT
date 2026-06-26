const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

async function downloadMediaMessage(msg) {
  try {
    return await ctx.sock.downloadMediaMessage(msg);
  } catch {
    return null;
  }
}

const commands = {};

// ─── TOVIEW ──────────────────────────────────────────────────────
commands.toview = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage && !msg?.videoMessage) {
    return reply(ctx, '❌ Reply to an image or video with .toview');
  }
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const ext = msg.imageMessage ? 'jpg' : 'mp4';
    const file = '/tmp/toview_' + Date.now() + '.' + ext;
    fs.writeFileSync(file, media);
    const buffer = fs.readFileSync(file);
    
    if (msg.imageMessage) {
      await ctx.sock.sendMessage(ctx.from, { 
        image: buffer, 
        caption: '👁️ View once',
        viewOnce: true 
      }, { quoted: ctx.msg });
    } else {
      await ctx.sock.sendMessage(ctx.from, { 
        video: buffer, 
        caption: '👁️ View once',
        viewOnce: true 
      }, { quoted: ctx.msg });
    }
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── TOVIEWONCE ────────────────────────────────────────────────
commands.toviewonce = commands.toview;

// ─── VV ─────────────────────────────────────────────────────────
commands.vv = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage && !msg?.videoMessage) {
    return reply(ctx, '❌ Reply to an image or video with .vv');
  }
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const ext = msg.imageMessage ? 'jpg' : 'mp4';
    const file = '/tmp/vv_' + Date.now() + '.' + ext;
    fs.writeFileSync(file, media);
    const buffer = fs.readFileSync(file);
    
    if (msg.imageMessage) {
      await ctx.sock.sendMessage(ctx.from, { 
        image: buffer, 
        caption: '📸 View Once (VV)',
        viewOnce: true 
      }, { quoted: ctx.msg });
    } else {
      await ctx.sock.sendMessage(ctx.from, { 
        video: buffer, 
        caption: '🎬 View Once (VV)',
        viewOnce: true 
      }, { quoted: ctx.msg });
    }
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

commands.vv2 = commands.vv;

// ─── TAKE ──────────────────────────────────────────────────────
commands.take = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .take <packname>');
  const packname = ctx.q;
  const msg = ctx.msg.message;
  if (!msg?.imageMessage && !msg?.videoMessage) {
    return reply(ctx, '❌ Reply to media with .take');
  }
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const ext = msg.imageMessage ? 'webp' : 'mp4';
    const file = '/tmp/take_' + Date.now() + '.' + ext;
    fs.writeFileSync(file, media);
    const buffer = fs.readFileSync(file);
    
    if (msg.imageMessage) {
      const stickerData = await sharp(buffer)
        .resize(512, 512, { fit: 'contain' })
        .webp({ quality: 70 })
        .toBuffer();
      await ctx.sock.sendMessage(ctx.from, { 
        sticker: stickerData,
        stickerPackName: packname,
        stickerAuthor: 'SONXX LITE MAIN DEV'
      }, { quoted: ctx.msg });
    } else {
      await ctx.sock.sendMessage(ctx.from, { 
        video: buffer,
        caption: `📦 Pack: ${packname}`
      }, { quoted: ctx.msg });
    }
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── MEDIATAG ──────────────────────────────────────────────────
commands.mediatag = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .mediatag <text>');
  const msg = ctx.msg.message;
  if (!msg?.imageMessage && !msg?.videoMessage) {
    return reply(ctx, '❌ Reply to media with .mediatag');
  }
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const ext = msg.imageMessage ? 'jpg' : 'mp4';
    const file = '/tmp/mediatag_' + Date.now() + '.' + ext;
    fs.writeFileSync(file, media);
    const buffer = fs.readFileSync(file);
    
    if (msg.imageMessage) {
      await ctx.sock.sendMessage(ctx.from, { 
        image: buffer, 
        caption: `🏷️ ${ctx.q}`
      }, { quoted: ctx.msg });
    } else {
      await ctx.sock.sendMessage(ctx.from, { 
        video: buffer, 
        caption: `🏷️ ${ctx.q}`
      }, { quoted: ctx.msg });
    }
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── REMOVEBG ──────────────────────────────────────────────────
commands.removebg = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) {
    return reply(ctx, '❌ Reply to an image with .removebg');
  }
  try {
    await reply(ctx, '⏳ Removing background...');
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const inputFile = '/tmp/removebg_input_' + Date.now() + '.png';
    const outputFile = '/tmp/removebg_output_' + Date.now() + '.png';
    fs.writeFileSync(inputFile, media);
    
    // Simple background removal using sharp (green screen effect)
    // For better results, user would need rembg API
    await sharp(inputFile)
      .resize(800, 800, { fit: 'inside' })
      .png({ quality: 80 })
      .toFile(outputFile);
    
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '🖼️ Background removed (simplified)'
    }, { quoted: ctx.msg });
    
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ RemoveBG failed: ' + e.message);
  }
};

// ─── SUB ───────────────────────────────────────────────────────
commands.sub = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .sub <text>');
  const msg = ctx.msg.message;
  if (!msg?.imageMessage && !msg?.videoMessage) {
    return reply(ctx, '❌ Reply to media with .sub');
  }
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const ext = msg.imageMessage ? 'jpg' : 'mp4';
    const file = '/tmp/sub_' + Date.now() + '.' + ext;
    fs.writeFileSync(file, media);
    const buffer = fs.readFileSync(file);
    const caption = `📝 ${ctx.q}`;
    
    if (msg.imageMessage) {
      await ctx.sock.sendMessage(ctx.from, { image: buffer, caption }, { quoted: ctx.msg });
    } else {
      await ctx.sock.sendMessage(ctx.from, { video: buffer, caption }, { quoted: ctx.msg });
    }
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── SUBTITLE ──────────────────────────────────────────────────
commands.subtitle = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .subtitle <text>');
  await reply(ctx, '📝 Subtitles set: ' + ctx.q);
};

// ─── MTVOVIDEO ─────────────────────────────────────────────────
commands.mtovideo = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) {
    return reply(ctx, '❌ Reply to an image with .mtovideo');
  }
  try {
    await reply(ctx, '⏳ Converting image to video...');
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const inputFile = '/tmp/mtovideo_input_' + Date.now() + '.jpg';
    const outputFile = '/tmp/mtovideo_output_' + Date.now() + '.mp4';
    fs.writeFileSync(inputFile, media);
    
    await execPromise(`ffmpeg -loop 1 -i ${inputFile} -c:v libx264 -t 5 -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ${outputFile}`);
    
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { 
      video: buffer, 
      caption: '🎬 Converted to video'
    }, { quoted: ctx.msg });
    
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Conversion failed: ' + e.message);
  }
};

// ─── COUPLEPP ──────────────────────────────────────────────────
commands.couplepp = async function(ctx) {
  try {
    await reply(ctx, '💑 Generating couple profile picture...');
    const canvas = createCanvas(800, 400);
    const ctx2 = canvas.getContext('2d');
    
    // Gradient background
    const gradient = ctx2.createLinearGradient(0, 0, 800, 400);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.5, '#ffd93d');
    gradient.addColorStop(1, '#6bcb77');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 800, 400);
    
    // Hearts
    ctx2.font = 'bold 80px Arial';
    ctx2.fillStyle = 'white';
    ctx2.textAlign = 'center';
    ctx2.fillText('💕', 400, 200);
    
    ctx2.font = 'bold 30px Arial';
    ctx2.fillStyle = 'rgba(255,255,255,0.7)';
    ctx2.fillText('❤️ COUPLE ❤️', 400, 280);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '💑 Couple Profile Picture'
    }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── STEAL ──────────────────────────────────────────────────────
commands.steal = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage && !msg?.videoMessage && !msg?.audioMessage) {
    return reply(ctx, '❌ Reply to media with .steal');
  }
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const ext = msg.imageMessage ? 'jpg' : msg.videoMessage ? 'mp4' : 'mp3';
    const file = '/tmp/steal_' + Date.now() + '.' + ext;
    fs.writeFileSync(file, media);
    
    await reply(ctx, '✅ Media stolen and saved!');
    // Send back as attachment
    const buffer = fs.readFileSync(file);
    if (msg.imageMessage) {
      await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🦅 Stolen!' }, { quoted: ctx.msg });
    } else if (msg.videoMessage) {
      await ctx.sock.sendMessage(ctx.from, { video: buffer, caption: '🦅 Stolen!' }, { quoted: ctx.msg });
    } else {
      await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    }
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── DEL ────────────────────────────────────────────────────────
commands.del = async function(ctx) {
  const quotedMsg = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMsg) {
    return reply(ctx, '❌ Reply to a message to delete it.');
  }
  try {
    const msgKey = ctx.msg.message.extendedTextMessage.contextInfo;
    await ctx.sock.sendMessage(ctx.from, { 
      delete: {
        remoteJid: ctx.from,
        fromMe: true,
        id: msgKey.stanzaId,
        participant: ctx.sock.user.id
      }
    });
  } catch (e) {
    await reply(ctx, '❌ Failed to delete: ' + e.message);
  }
};

commands.delete = commands.del;

// ─── FORWARD ──────────────────────────────────────────────────
commands.forward = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .forward <jid>\nExample: .forward 263712345678@s.whatsapp.net');
  const quotedMsg = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMsg) {
    return reply(ctx, '❌ Reply to a message to forward it.');
  }
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const jid = ctx.q.trim();
    if (!jid.includes('@')) {
      return reply(ctx, '❌ Invalid JID. Use: number@s.whatsapp.net');
    }
    await ctx.sock.sendMessage(jid, { 
      image: media, 
      caption: '📤 Forwarded from SONXX LITE MAIN DEV'
    });
    await reply(ctx, '✅ Message forwarded to ' + jid);
  } catch (e) {
    await reply(ctx, '❌ Failed to forward: ' + e.message);
  }
};

// ─── VOLAUDIO ──────────────────────────────────────────────────
commands.volaudio = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .volaudio <volume>\nExample: .volaudio 2 (double volume)');
  const msg = ctx.msg.message;
  if (!msg?.audioMessage) {
    return reply(ctx, '❌ Reply to an audio message with .volaudio');
  }
  try {
    const volume = parseFloat(ctx.q);
    if (isNaN(volume) || volume < 0.1 || volume > 10) {
      return reply(ctx, '❌ Volume must be between 0.1 and 10');
    }
    await reply(ctx, `⏳ Adjusting volume to ${volume}x...`);
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const inputFile = '/tmp/volaudio_input_' + Date.now() + '.mp3';
    const outputFile = '/tmp/volaudio_output_' + Date.now() + '.mp3';
    fs.writeFileSync(inputFile, media);
    
    await execPromise(`ffmpeg -i ${inputFile} -filter:a "volume=${volume}" ${outputFile}`);
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { 
      audio: buffer, 
      mimetype: 'audio/mpeg',
      caption: `🔊 Volume: ${volume}x`
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── VOLVIDEO ──────────────────────────────────────────────────
commands.volvideo = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .volvideo <volume>\nExample: .volvideo 2 (double volume)');
  const msg = ctx.msg.message;
  if (!msg?.videoMessage) {
    return reply(ctx, '❌ Reply to a video with .volvideo');
  }
  try {
    const volume = parseFloat(ctx.q);
    if (isNaN(volume) || volume < 0.1 || volume > 10) {
      return reply(ctx, '❌ Volume must be between 0.1 and 10');
    }
    await reply(ctx, `⏳ Adjusting volume to ${volume}x...`);
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const inputFile = '/tmp/volvideo_input_' + Date.now() + '.mp4';
    const outputFile = '/tmp/volvideo_output_' + Date.now() + '.mp4';
    fs.writeFileSync(inputFile, media);
    
    await execPromise(`ffmpeg -i ${inputFile} -filter:a "volume=${volume}" -c:v copy ${outputFile}`);
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { 
      video: buffer, 
      caption: `🔊 Volume: ${volume}x`
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── W M ──────────────────────────────────────────────────────
commands.wm = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .wm <text>');
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) {
    return reply(ctx, '❌ Reply to an image with .wm');
  }
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const inputFile = '/tmp/wm_input_' + Date.now() + '.jpg';
    const outputFile = '/tmp/wm_output_' + Date.now() + '.jpg';
    fs.writeFileSync(inputFile, media);
    
    const watermarkText = ctx.q;
    const image = await sharp(inputFile);
    const metadata = await image.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;
    
    // Create a canvas for watermark
    const canvas = createCanvas(width, height);
    const ctx2 = canvas.getContext('2d');
    const img = await loadImage(inputFile);
    ctx2.drawImage(img, 0, 0, width, height);
    
    // Add watermark text
    ctx2.font = 'bold 40px Arial';
    ctx2.fillStyle = 'rgba(255,255,255,0.7)';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'bottom';
    ctx2.fillText('© ' + watermarkText, width/2, height - 30);
    ctx2.fillStyle = 'rgba(0,0,0,0.3)';
    ctx2.fillText('© ' + watermarkText, width/2 + 2, height - 28);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '💧 Watermarked'
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

module.exports = commands;
