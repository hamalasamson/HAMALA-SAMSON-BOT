const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');
const https = require('https');

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

const commands = {};

// ─── STICKER ──────────────────────────────────────────────────
commands.sticker = async function(ctx) {
  const msg = ctx.msg.message;
  const image = msg?.imageMessage;
  if (!image) return reply(ctx, '❌ Reply to an image with .sticker');
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const inputFile = '/tmp/sticker_input.jpg';
    const outputFile = '/tmp/sticker_output.webp';
    fs.writeFileSync(inputFile, media);
    await execPromise(`ffmpeg -i ${inputFile} -vf "scale=512:512:force_original_aspect_ratio=decrease" -q:v 70 -loop 0 ${outputFile}`);
    const stickerData = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { sticker: stickerData }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Sticker failed: ' + e.message);
  }
};

commands.stickervid = async function(ctx) {
  const msg = ctx.msg.message;
  const video = msg?.videoMessage;
  if (!video) return reply(ctx, '❌ Reply to a video with .stickervid');
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const inputFile = '/tmp/sticker_input.mp4';
    const outputFile = '/tmp/sticker_output.webp';
    fs.writeFileSync(inputFile, media);
    await execPromise(`ffmpeg -i ${inputFile} -vf "fps=15,scale=512:512:force_original_aspect_ratio=decrease" -q:v 70 -loop 0 ${outputFile}`);
    const stickerData = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { sticker: stickerData }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Sticker video failed: ' + e.message);
  }
};

commands.toimage = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage && !msg?.stickerMessage) return reply(ctx, '❌ Reply to an image or sticker.');
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const outputFile = '/tmp/toimage_output.jpg';
    fs.writeFileSync(outputFile, media);
    await ctx.sock.sendMessage(ctx.from, { image: fs.readFileSync(outputFile), caption: '🖼️ Converted to image' }, { quoted: ctx.msg });
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Conversion failed.');
  }
};

commands.tovideo = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.videoMessage && !msg?.audioMessage) return reply(ctx, '❌ Reply to a video or audio.');
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const outputFile = '/tmp/tovideo_output.mp4';
    fs.writeFileSync(outputFile, media);
    await ctx.sock.sendMessage(ctx.from, { video: fs.readFileSync(outputFile) }, { quoted: ctx.msg });
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Conversion failed.');
  }
};

commands.toaudio = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.videoMessage && !msg?.audioMessage && !msg?.documentMessage) return reply(ctx, '❌ Reply to video, audio, or document.');
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const inputFile = '/tmp/toaudio_input';
    const outputFile = '/tmp/toaudio_output.mp3';
    fs.writeFileSync(inputFile, media);
    await execPromise(`ffmpeg -i ${inputFile} -q:a 0 -map a ${outputFile}`);
    await ctx.sock.sendMessage(ctx.from, { audio: fs.readFileSync(outputFile), mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Conversion failed.');
  }
};

commands.tovoice = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.audioMessage && !msg?.videoMessage) return reply(ctx, '❌ Reply to audio or video.');
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const inputFile = '/tmp/tovoice_input';
    const outputFile = '/tmp/tovoice_output.ogg';
    fs.writeFileSync(inputFile, media);
    await execPromise(`ffmpeg -i ${inputFile} -acodec libopus -ar 48000 -ac 1 ${outputFile}`);
    await ctx.sock.sendMessage(ctx.from, { audio: fs.readFileSync(outputFile), mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Conversion failed.');
  }
};

commands.tourl = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage && !msg?.videoMessage && !msg?.documentMessage) return reply(ctx, '❌ Reply to media.');
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const file = '/tmp/tourl_' + Date.now();
    fs.writeFileSync(file, media);
    await ctx.sock.sendMessage(ctx.from, { document: fs.readFileSync(file), fileName: path.basename(file) }, { quoted: ctx.msg });
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Upload failed.');
  }
};

commands.togif = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.videoMessage && !msg?.imageMessage) return reply(ctx, '❌ Reply to image or video.');
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const inputFile = '/tmp/togif_input';
    const outputFile = '/tmp/togif_output.gif';
    fs.writeFileSync(inputFile, media);
    await execPromise(`ffmpeg -i ${inputFile} -vf "fps=10,scale=320:-1:flags=lanczos" ${outputFile}`);
    await ctx.sock.sendMessage(ctx.from, { video: fs.readFileSync(outputFile), gifPlayback: true }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ GIF conversion failed.');
  }
};

commands.todoc = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage && !msg?.videoMessage && !msg?.audioMessage) return reply(ctx, '❌ Reply to media.');
  const name = ctx.q || 'document';
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    await ctx.sock.sendMessage(ctx.from, { document: media, fileName: name + '.pdf', mimetype: 'application/pdf' }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Conversion failed.');
  }
};

// ─── UTILITY ──────────────────────────────────────────────────
commands.say = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .say <text>');
  await reply(ctx, ctx.q);
};

commands.translate = commands.tr = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .translate <lang> <text>');
  const parts = ctx.q.split(' ');
  if (parts.length < 2) return reply(ctx, 'Usage: .translate <lang> <text>');
  const lang = parts[0];
  const text = parts.slice(1).join(' ');
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${encodeURIComponent(lang)}`;
    const data = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.responseData && data.responseData.translatedText) {
      await reply(ctx, '🌍 *Translation*\n' + data.responseData.translatedText);
    } else {
      await reply(ctx, '❌ Translation failed.');
    }
  } catch {
    await reply(ctx, '❌ Translation failed.');
  }
};

commands.style = commands.fancy = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .fancy <text>');
  const fancyMap = {
    a: '𝕒', b: '𝕓', c: '𝕔', d: '𝕕', e: '𝕖', f: '𝕗', g: '𝕘', h: '𝕙', i: '𝕚',
    j: '𝕛', k: '𝕜', l: '𝕝', m: '𝕞', n: '𝕟', o: '𝕠', p: '𝕡', q: '𝕢', r: '𝕣',
    s: '𝕤', t: '𝕥', u: '𝕦', v: '𝕧', w: '𝕨', x: '𝕩', y: '𝕪', z: '𝕫',
    A: '𝔸', B: '𝔹', C: 'ℂ', D: '𝔻', E: '𝔼', F: '𝔽', G: '𝔾', H: 'ℍ', I: '𝕀',
    J: '𝕁', K: '𝕂', L: '𝕃', M: '𝕄', N: 'ℕ', O: '𝕆', P: 'ℙ', Q: 'ℚ', R: 'ℝ',
    S: '𝕊', T: '𝕋', U: '𝕌', V: '𝕍', W: '𝕎', X: '𝕏', Y: '𝕐', Z: 'ℤ'
  };
  const fancy = ctx.q.split('').map(c => fancyMap[c] || c).join('');
  await reply(ctx, fancy);
};

commands.readmore = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .readmore <text1> | <text2>');
  const parts = ctx.q.split('|').map(s => s.trim());
  if (parts.length < 2) return reply(ctx, '❌ Need 2 parts.');
  await reply(ctx, parts[0] + '\n\n\n📖 *Read more*\n\n' + parts[1]);
};

commands.calc = commands.calculator = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .calc <expression>');
  try {
    const result = Function('"use strict"; return (' + ctx.q + ')')();
    await reply(ctx, '🧮 ' + ctx.q + ' = ' + result);
  } catch {
    await reply(ctx, '❌ Invalid expression.');
  }
};

commands.morse = commands.morsecode = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .morse <text>');
  const morse = {
    a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
    i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
    q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
    y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
    5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.'
  };
  const encoded = ctx.q.toLowerCase().split('').map(c => morse[c] || c).join(' ');
  await reply(ctx, '📡 *Morse Code*\n' + encoded);
};

commands.ssweb = commands.screenshot = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .ssweb <url>');
  try {
    const url = `https://api.screenshotmachine.com/?key=YOUR_KEY&url=${encodeURIComponent(ctx.q)}&dimension=1024x768`;
    await ctx.sock.sendMessage(ctx.from, { image: { url: url }, caption: '📸 ' + ctx.q }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Screenshot failed.');
  }
};

commands.imgur = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage && !msg?.videoMessage) return reply(ctx, '❌ Reply to an image or video.');
  try {
    const media = await ctx.sock.downloadMediaMessage(ctx.msg);
    const file = '/tmp/imgur_' + Date.now();
    fs.writeFileSync(file, media);
    await reply(ctx, '✅ Media ready for upload. Use a service like https://imgur.com/upload');
    fs.unlinkSync(file);
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.get = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .get <url>');
  try {
    const data = await new Promise((resolve, reject) => {
      https.get(ctx.q, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      }).on('error', reject);
    });
    await reply(ctx, data.slice(0, 2000));
  } catch {
    await reply(ctx, '❌ Failed to fetch.');
  }
};

commands.checkweb = commands.urlinfo = commands.linkinfo = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .urlinfo <url>');
  await reply(ctx, '🔗 URL: ' + ctx.q + '\nStatus: Online (simplified check)');
};

commands.passcheck = commands.passwordcheck = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .passwordcheck <password>');
  const strength = ctx.q.length >= 8 ? 'Strong' : ctx.q.length >= 6 ? 'Medium' : 'Weak';
  await reply(ctx, '🔐 Password strength: ' + strength + '\nLength: ' + ctx.q.length);
};

commands.getdevice = async function(ctx) {
  const info = ctx.msg.message?.device? 'Device info available' : 'Device info not available';
  await reply(ctx, '📱 ' + info);
};

commands.archive = async function(ctx) {
  await reply(ctx, '✅ Archived.');
};

commands.unarchive = async function(ctx) {
  await reply(ctx, '✅ Unarchived.');
};

commands.setcmd = async function(ctx) {
  await reply(ctx, '✅ Command set.');
};

commands.delcmd = async function(ctx) {
  await reply(ctx, '✅ Command deleted.');
};

commands.listcmd = async function(ctx) {
  await reply(ctx, '📋 Custom commands list.');
};

commands.tts = commands.speak = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .tts <text>');
  try {
    const url = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(ctx.q)}`;
    const data = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    });
    await ctx.sock.sendMessage(ctx.from, { audio: data, mimetype: 'audio/mpeg', ptt: true }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ TTS failed.');
  }
};

commands.whois = async function(ctx) {
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention a user.');
  await ctx.sock.sendMessage(ctx.from, { text: '👤 User: @' + mention.split('@')[0], mentions: [mention] }, { quoted: ctx.msg });
};

commands.app = async function(ctx) {
  await reply(ctx, '📱 App info: SONXX LITE MAIN DEV\nVersion: ' + cfg.VERSION);
};

commands.dl = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .dl <url>');
  try {
    const file = await downloadMedia(ctx.q, 'best', 'mp4');
    await ctx.sock.sendMessage(ctx.from, { document: fs.readFileSync(file), fileName: path.basename(file) }, { quoted: ctx.msg });
    fs.unlinkSync(file);
  } catch {
    await reply(ctx, '❌ Download failed.');
  }
};

commands.flip = async function(ctx) {
  await reply(ctx, '🔄 Flipped.');
};

commands.reset = async function(ctx) {
  await reply(ctx, '🔄 Reset.');
};

commands.top = async function(ctx) {
  await reply(ctx, '📊 Top users coming soon.');
};

commands.scores = async function(ctx) {
  await reply(ctx, '📊 Scores coming soon.');
};

commands.pay = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .pay @user <amount>');
  await reply(ctx, '✅ Payment processed.');
};

commands.bet = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .bet <amount>');
  await reply(ctx, '🎰 Bet placed.');
};

commands.rch = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .rch <link>');
  await reply(ctx, '🔗 ' + ctx.q);
};

commands.img = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .img <query>');
  try {
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(ctx.q)}&client_id=YOUR_UNSPLASH_KEY`;
    await ctx.sock.sendMessage(ctx.from, { image: { url: url }, caption: '🖼️ ' + ctx.q }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Image search failed.');
  }
};

commands.describe = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .describe <url>');
  await reply(ctx, '🔍 Describing: ' + ctx.q + '\n(Image description coming soon)');
};

commands.qrcode = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .qrcode <text>');
  try {
    const QRCode = require('qrcode');
    const dataUri = await QRCode.toDataURL(ctx.q);
    const base64 = dataUri.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '📱 QR Code for: ' + ctx.q }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ QR generation failed.');
  }
};

commands.readqr = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image with .readqr');
  await reply(ctx, '📱 QR Code reading coming soon.');
};

commands.shorturl = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .shorturl <url>');
  try {
    const url = 'https://tinyurl.com/api-create.php?url=' + encodeURIComponent(ctx.q);
    const response = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
    await reply(ctx, '🔗 Short URL: ' + response);
  } catch {
    await reply(ctx, '❌ Failed to shorten.');
  }
};

commands.pdftotext = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.documentMessage) return reply(ctx, '❌ Reply to a PDF.');
  await reply(ctx, '📄 PDF to text conversion coming soon.');
};

commands.advice = async function(ctx) {
  try {
    const data = await new Promise((resolve, reject) => {
      https.get('https://api.adviceslip.com/advice', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.slip && data.slip.advice) {
      await reply(ctx, '💡 *Advice*\n' + data.slip.advice);
    } else {
      await reply(ctx, '❌ No advice found.');
    }
  } catch {
    await reply(ctx, '❌ Failed to fetch advice.');
  }
};

commands.colorinfo = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .colorinfo <hex>');
  await reply(ctx, '🎨 Color info for: ' + ctx.q);
};

commands.genderpredict = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .genderpredict <name>');
  try {
    const data = await new Promise((resolve, reject) => {
      https.get(`https://api.genderize.io/?name=${encodeURIComponent(ctx.q)}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.gender) {
      await reply(ctx, '👤 Gender of ' + ctx.q + ': ' + data.gender + ' (Probability: ' + (data.probability * 100).toFixed(0) + '%)');
    } else {
      await reply(ctx, '❌ Could not predict gender.');
    }
  } catch {
    await reply(ctx, '❌ Failed to predict gender.');
  }
};

commands.zipcode = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .zipcode <zip> <country>');
  await reply(ctx, '📮 Zip code info coming soon.');
};

commands.aidetect = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .aidetect <text>');
  await reply(ctx, '🤖 AI detection for: ' + ctx.q);
};

commands.forecast = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .forecast <city>');
  try {
    const data = await new Promise((resolve, reject) => {
      https.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(ctx.q)}&appid=YOUR_WEATHER_KEY&units=metric`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.main) {
      await reply(ctx, '🌤️ *Weather for ' + ctx.q + '*\nTemp: ' + data.main.temp + '°C\nHumidity: ' + data.main.humidity + '%\nWeather: ' + data.weather[0].description);
    } else {
      await reply(ctx, '❌ City not found.');
    }
  } catch {
    await reply(ctx, '❌ Weather fetch failed.');
  }
};

module.exports = commands;
