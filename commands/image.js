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

async function getImageBuffer(msg) {
  const media = await ctx.sock.downloadMediaMessage(msg);
  return media;
}

const commands = {};

// ─── WANTED ──────────────────────────────────────────────────────
commands.wanted = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image with .wanted');
  try {
    await reply(ctx, '⏳ Creating wanted poster...');
    const media = await getImageBuffer(msg);
    const inputFile = '/tmp/wanted_input_' + Date.now() + '.jpg';
    const outputFile = '/tmp/wanted_output_' + Date.now() + '.jpg';
    fs.writeFileSync(inputFile, media);
    
    const image = await sharp(inputFile);
    const metadata = await image.metadata();
    const width = Math.min(metadata.width || 800, 600);
    const height = Math.min(metadata.height || 600, 600);
    
    const canvas = createCanvas(width, height);
    const ctx2 = canvas.getContext('2d');
    const img = await loadImage(inputFile);
    ctx2.drawImage(img, 0, 0, width, height);
    
    // WANTED overlay
    ctx2.fillStyle = 'rgba(0,0,0,0.5)';
    ctx2.fillRect(0, 0, width, 60);
    ctx2.font = 'bold 40px Arial';
    ctx2.fillStyle = '#ff0000';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'top';
    ctx2.fillText('WANTED', width/2, 10);
    ctx2.font = '20px Arial';
    ctx2.fillStyle = 'white';
    ctx2.fillText('DEAD OR ALIVE', width/2, 55);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '🔫 WANTED POSTER'
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── WASTED ──────────────────────────────────────────────────────
commands.wasted = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image with .wasted');
  try {
    await reply(ctx, '⏳ Creating wasted effect...');
    const media = await getImageBuffer(msg);
    const inputFile = '/tmp/wasted_input_' + Date.now() + '.jpg';
    const outputFile = '/tmp/wasted_output_' + Date.now() + '.jpg';
    fs.writeFileSync(inputFile, media);
    
    const image = await sharp(inputFile);
    const metadata = await image.metadata();
    const width = Math.min(metadata.width || 800, 600);
    const height = Math.min(metadata.height || 600, 600);
    
    const canvas = createCanvas(width, height);
    const ctx2 = canvas.getContext('2d');
    const img = await loadImage(inputFile);
    ctx2.drawImage(img, 0, 0, width, height);
    
    // Red tint
    ctx2.fillStyle = 'rgba(255,0,0,0.3)';
    ctx2.fillRect(0, 0, width, height);
    
    // WASTED overlay
    ctx2.font = 'bold 60px Arial';
    ctx2.fillStyle = '#ff0000';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillText('WASTED', width/2, height/2 - 10);
    ctx2.strokeStyle = '#880000';
    ctx2.lineWidth = 3;
    ctx2.strokeText('WASTED', width/2, height/2 - 10);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '💀 WASTED'
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── JAIL ──────────────────────────────────────────────────────
commands.jail = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image with .jail');
  try {
    await reply(ctx, '⏳ Creating jail effect...');
    const media = await getImageBuffer(msg);
    const inputFile = '/tmp/jail_input_' + Date.now() + '.jpg';
    const outputFile = '/tmp/jail_output_' + Date.now() + '.jpg';
    fs.writeFileSync(inputFile, media);
    
    const image = await sharp(inputFile);
    const metadata = await image.metadata();
    const width = Math.min(metadata.width || 800, 600);
    const height = Math.min(metadata.height || 600, 600);
    
    const canvas = createCanvas(width, height);
    const ctx2 = canvas.getContext('2d');
    const img = await loadImage(inputFile);
    ctx2.drawImage(img, 0, 0, width, height);
    
    // Jail bars
    ctx2.fillStyle = 'rgba(0,0,0,0.4)';
    const barWidth = 15;
    const gap = 40;
    for (let x = 0; x < width; x += gap) {
      ctx2.fillRect(x, 0, barWidth, height);
    }
    // Horizontal bars
    ctx2.fillRect(0, height/3, width, 8);
    ctx2.fillRect(0, height*2/3, width, 8);
    
    ctx2.font = 'bold 30px Arial';
    ctx2.fillStyle = 'white';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'bottom';
    ctx2.fillText('🚔 JAIL', width/2, height - 20);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '🚔 JAIL'
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── INVERT ──────────────────────────────────────────────────────
commands.invert = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image with .invert');
  try {
    await reply(ctx, '⏳ Inverting colors...');
    const media = await getImageBuffer(msg);
    const inputFile = '/tmp/invert_input_' + Date.now() + '.jpg';
    const outputFile = '/tmp/invert_output_' + Date.now() + '.jpg';
    fs.writeFileSync(inputFile, media);
    
    await sharp(inputFile)
      .negate()
      .toFile(outputFile);
    
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '🔄 Inverted Colors'
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── RAINBOW ──────────────────────────────────────────────────
commands.rainbow = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image with .rainbow');
  try {
    await reply(ctx, '⏳ Applying rainbow effect...');
    const media = await getImageBuffer(msg);
    const inputFile = '/tmp/rainbow_input_' + Date.now() + '.jpg';
    const outputFile = '/tmp/rainbow_output_' + Date.now() + '.jpg';
    fs.writeFileSync(inputFile, media);
    
    const image = await sharp(inputFile);
    const metadata = await image.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;
    
    const canvas = createCanvas(width, height);
    const ctx2 = canvas.getContext('2d');
    const img = await loadImage(inputFile);
    ctx2.drawImage(img, 0, 0, width, height);
    
    // Rainbow overlay
    const gradient = ctx2.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(255,0,0,0.3)');
    gradient.addColorStop(0.17, 'rgba(255,165,0,0.3)');
    gradient.addColorStop(0.33, 'rgba(255,255,0,0.3)');
    gradient.addColorStop(0.5, 'rgba(0,255,0,0.3)');
    gradient.addColorStop(0.67, 'rgba(0,0,255,0.3)');
    gradient.addColorStop(0.83, 'rgba(75,0,130,0.3)');
    gradient.addColorStop(1, 'rgba(148,0,211,0.3)');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, width, height);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '🌈 Rainbow Effect'
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── HD / ENHANCE ──────────────────────────────────────────────
commands.hd = async function(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image with .hd');
  try {
    await reply(ctx, '⏳ Enhancing image...');
    const media = await getImageBuffer(msg);
    const inputFile = '/tmp/hd_input_' + Date.now() + '.jpg';
    const outputFile = '/tmp/hd_output_' + Date.now() + '.jpg';
    fs.writeFileSync(inputFile, media);
    
    await sharp(inputFile)
      .resize(null, null, { kernel: 'cubic' })
      .sharpen()
      .toFile(outputFile);
    
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '✨ Enhanced HD'
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

commands.enhance = commands.hd;

// ─── CARBON ──────────────────────────────────────────────────
commands.carbon = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .carbon <code>\nExample: .carbon console.log("Hello")');
  try {
    await reply(ctx, '⏳ Creating carbon code screenshot...');
    const code = ctx.q;
    const canvas = createCanvas(800, 400);
    const ctx2 = canvas.getContext('2d');
    
    // Dark background
    ctx2.fillStyle = '#1a1a2e';
    ctx2.fillRect(0, 0, 800, 400);
    
    // Code area
    ctx2.fillStyle = '#16213e';
    ctx2.fillRect(20, 20, 760, 360);
    ctx2.strokeStyle = '#0f3460';
    ctx2.lineWidth = 2;
    ctx2.strokeRect(20, 20, 760, 360);
    
    // Code text
    ctx2.font = '18px monospace';
    ctx2.fillStyle = '#00d2ff';
    ctx2.textAlign = 'left';
    ctx2.textBaseline = 'top';
    const lines = code.split('\n');
    lines.forEach((line, i) => {
      ctx2.fillText(line, 40, 40 + i * 30);
    });
    
    // Carbon logo
    ctx2.font = '12px Arial';
    ctx2.fillStyle = 'rgba(255,255,255,0.3)';
    ctx2.textAlign = 'right';
    ctx2.textBaseline = 'bottom';
    ctx2.fillText('carbon.now.sh', 760, 380);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '💻 Carbon Code'
    }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── BRAT ──────────────────────────────────────────────────────
commands.brat = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .brat <text>\nExample: .brat Brat Style');
  try {
    await reply(ctx, '⏳ Creating brat style...');
    const canvas = createCanvas(600, 200);
    const ctx2 = canvas.getContext('2d');
    
    // Background
    ctx2.fillStyle = '#ff00ff';
    ctx2.fillRect(0, 0, 600, 200);
    
    // Grid pattern
    ctx2.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx2.lineWidth = 1;
    for (let x = 0; x < 600; x += 30) {
      ctx2.beginPath();
      ctx2.moveTo(x, 0);
      ctx2.lineTo(x, 200);
      ctx2.stroke();
    }
    for (let y = 0; y < 200; y += 30) {
      ctx2.beginPath();
      ctx2.moveTo(0, y);
      ctx2.lineTo(600, y);
      ctx2.stroke();
    }
    
    // Text
    ctx2.font = 'bold 60px Arial';
    ctx2.fillStyle = 'white';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.shadowColor = 'black';
    ctx2.shadowBlur = 10;
    ctx2.fillText('📝 ' + ctx.q, 300, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '💅 Brat Style'
    }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── CROP ──────────────────────────────────────────────────────
commands.crop = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .crop <width>x<height>\nExample: .crop 400x400');
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image with .crop');
  try {
    const [width, height] = ctx.q.split('x').map(Number);
    if (isNaN(width) || isNaN(height)) return reply(ctx, '❌ Invalid dimensions. Use: widthxheight');
    
    await reply(ctx, '⏳ Cropping image...');
    const media = await getImageBuffer(msg);
    const inputFile = '/tmp/crop_input_' + Date.now() + '.jpg';
    const outputFile = '/tmp/crop_output_' + Date.now() + '.jpg';
    fs.writeFileSync(inputFile, media);
    
    await sharp(inputFile)
      .resize(width, height, { fit: 'cover' })
      .toFile(outputFile);
    
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: `✂️ Cropped to ${width}x${height}`
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── RESIZE ──────────────────────────────────────────────────
commands.resize = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .resize <width>x<height> or <50%>\nExample: .resize 400x400 or .resize 50%');
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image with .resize');
  try {
    await reply(ctx, '⏳ Resizing image...');
    const media = await getImageBuffer(msg);
    const inputFile = '/tmp/resize_input_' + Date.now() + '.jpg';
    const outputFile = '/tmp/resize_output_' + Date.now() + '.jpg';
    fs.writeFileSync(inputFile, media);
    
    const image = sharp(inputFile);
    const metadata = await image.metadata();
    let width, height;
    
    if (ctx.q.includes('%')) {
      const percent = parseFloat(ctx.q) / 100;
      width = Math.round(metadata.width * percent);
      height = Math.round(metadata.height * percent);
    } else {
      const dims = ctx.q.split('x').map(Number);
      width = dims[0];
      height = dims[1] || width;
    }
    
    await image.resize(width, height).toFile(outputFile);
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: `📐 Resized to ${width}x${height}`
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── FILTER ──────────────────────────────────────────────────
commands.filter = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .filter greyscale|sepia|blur\nExample: .filter sepia');
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image with .filter');
  try {
    const filter = ctx.q.toLowerCase();
    if (!['greyscale', 'sepia', 'blur'].includes(filter)) {
      return reply(ctx, '❌ Available filters: greyscale, sepia, blur');
    }
    await reply(ctx, `⏳ Applying ${filter} filter...`);
    const media = await getImageBuffer(msg);
    const inputFile = '/tmp/filter_input_' + Date.now() + '.jpg';
    const outputFile = '/tmp/filter_output_' + Date.now() + '.jpg';
    fs.writeFileSync(inputFile, media);
    
    let pipeline = sharp(inputFile);
    if (filter === 'greyscale') pipeline = pipeline.grayscale();
    else if (filter === 'sepia') pipeline = pipeline.tint('#704214');
    else if (filter === 'blur') pipeline = pipeline.blur(5);
    
    await pipeline.toFile(outputFile);
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: `🎨 ${filter} Filter Applied`
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── MICH-MEME ──────────────────────────────────────────────────
commands['mich-meme'] = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .mich-meme top text | bottom text');
  const msg = ctx.msg.message;
  if (!msg?.imageMessage) return reply(ctx, '❌ Reply to an image with .mich-meme');
  try {
    const parts = ctx.q.split('|').map(s => s.trim());
    const topText = parts[0] || '';
    const bottomText = parts[1] || '';
    
    await reply(ctx, '⏳ Creating meme...');
    const media = await getImageBuffer(msg);
    const inputFile = '/tmp/meme_input_' + Date.now() + '.jpg';
    const outputFile = '/tmp/meme_output_' + Date.now() + '.jpg';
    fs.writeFileSync(inputFile, media);
    
    const image = await sharp(inputFile);
    const metadata = await image.metadata();
    const width = Math.min(metadata.width || 800, 600);
    const height = Math.min(metadata.height || 600, 600);
    
    const canvas = createCanvas(width, height);
    const ctx2 = canvas.getContext('2d');
    const img = await loadImage(inputFile);
    ctx2.drawImage(img, 0, 0, width, height);
    
    // Meme text
    ctx2.font = 'bold 30px Impact';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'top';
    ctx2.shadowColor = 'black';
    ctx2.shadowBlur = 4;
    ctx2.shadowOffsetX = 2;
    ctx2.shadowOffsetY = 2;
    ctx2.fillStyle = 'white';
    ctx2.strokeStyle = 'black';
    ctx2.lineWidth = 3;
    
    if (topText) {
      ctx2.strokeText(topText, width/2, 10);
      ctx2.fillText(topText, width/2, 10);
    }
    if (bottomText) {
      ctx2.textBaseline = 'bottom';
      ctx2.strokeText(bottomText, width/2, height - 10);
      ctx2.fillText(bottomText, width/2, height - 10);
    }
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '😂 Meme Created'
    }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── QUOTEIMG ──────────────────────────────────────────────────
commands.quoteimg = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .quoteimg <text> | <author>\nExample: .quoteimg Be yourself | Oscar Wilde');
  try {
    const parts = ctx.q.split('|').map(s => s.trim());
    const text = parts[0] || 'Quote';
    const author = parts[1] || 'Unknown';
    
    await reply(ctx, '⏳ Creating quote image...');
    const canvas = createCanvas(600, 400);
    const ctx2 = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx2.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 600, 400);
    
    // Quote border
    ctx2.strokeStyle = '#00d2ff';
    ctx2.lineWidth = 2;
    ctx2.strokeRect(20, 20, 560, 360);
    
    // Quote marks
    ctx2.font = '60px Georgia';
    ctx2.fillStyle = 'rgba(255,255,255,0.1)';
    ctx2.textAlign = 'left';
    ctx2.textBaseline = 'top';
    ctx2.fillText('"', 40, 30);
    ctx2.textAlign = 'right';
    ctx2.textBaseline = 'bottom';
    ctx2.fillText('"', 560, 370);
    
    // Quote text
    ctx2.font = '20px Georgia';
    ctx2.fillStyle = 'white';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.shadowColor = 'rgba(0,0,0,0.5)';
    ctx2.shadowBlur = 8;
    
    const lines = text.match(/.{1,25}/g) || [text];
    lines.forEach((line, i) => {
      ctx2.fillText(line, 300, 160 + i * 30);
    });
    
    // Author
    ctx2.font = '18px Georgia';
    ctx2.fillStyle = '#00d2ff';
    ctx2.shadowBlur = 0;
    ctx2.textBaseline = 'bottom';
    ctx2.fillText('— ' + author, 300, 350);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { 
      image: buffer, 
      caption: '📖 Quote Image'
    }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

module.exports = commands;
