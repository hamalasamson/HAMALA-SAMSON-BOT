const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const axios = require('axios');
const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

const commands = {};

// ─── EPHOTOLIST ──────────────────────────────────────────────
commands.ephotolist = async function(ctx) {
  const effects = `
🎨 *EPHOTO EFFECTS*

1. .glitchtext <text>
2. .cyberpunk <text>
3. .neonmetal <text>
4. .gaminglogo <text>
5. .graffiti <text>
6. .sandwriting <text>
7. .galaxy <text>
8. .rainbow <text>
9. .matrix <text>
10. .watercolor <text>
11. .neonlight <text>
12. .glitch2 <text>
13. .chalkboard <text>
14. .3dstone <text>
15. .3dgold <text>
16. .goldflag <text>
17. .smoke <text>
18. .ice <text>
19. .underwater <text>
20. .vaporwave <text>
21. .color <hex>
22. .currency <amt> <from> <to>

_Type .ephotostyles for style info_
`;
  await reply(ctx, effects);
};

// ─── EPHOTOSTYLES ────────────────────────────────────────────
commands.ephotostyles = async function(ctx) {
  await reply(ctx, '🎨 *Ephoto Styles*\n\nEach command generates a different text style effect.\n\nExample: .glitchtext SONXX\n\n_All effects use canvas/ffmpeg for text rendering._');
};

// ─── GLITZ TEXT ──────────────────────────────────────────────
commands.glitchtext = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .glitchtext <text>');
  try {
    await reply(ctx, '⏳ Creating glitch text...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    // Background
    ctx2.fillStyle = '#0a0a0a';
    ctx2.fillRect(0, 0, 800, 200);
    
    // Glitch effect
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    
    // Red channel
    ctx2.shadowColor = '#ff0000';
    ctx2.shadowBlur = 20;
    ctx2.fillStyle = '#ff0000';
    ctx2.fillText(text, 402, 102);
    
    // Green channel
    ctx2.shadowColor = '#00ff00';
    ctx2.shadowBlur = 20;
    ctx2.fillStyle = '#00ff00';
    ctx2.fillText(text, 398, 98);
    
    // Blue channel
    ctx2.shadowColor = '#0000ff';
    ctx2.shadowBlur = 20;
    ctx2.fillStyle = '#0000ff';
    ctx2.fillText(text, 400, 100);
    
    // White overlay
    ctx2.shadowBlur = 0;
    ctx2.fillStyle = 'white';
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '💫 Glitch Text' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── CYBERPUNK ──────────────────────────────────────────────
commands.cyberpunk = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .cyberpunk <text>');
  try {
    await reply(ctx, '⏳ Creating cyberpunk style...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    // Cyberpunk background
    const gradient = ctx2.createLinearGradient(0, 0, 800, 200);
    gradient.addColorStop(0, '#1a0030');
    gradient.addColorStop(1, '#0a0a2a');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 800, 200);
    
    // Neon glow
    ctx2.shadowColor = '#ff00ff';
    ctx2.shadowBlur = 30;
    ctx2.font = 'bold 70px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = '#00ffff';
    ctx2.fillText(text, 400, 100);
    
    ctx2.shadowColor = '#00ffff';
    ctx2.shadowBlur = 20;
    ctx2.fillStyle = '#ff00ff';
    ctx2.fillText(text, 398, 98);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🌃 Cyberpunk Text' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── NEONMETAL ──────────────────────────────────────────────
commands.neonmetal = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .neonmetal <text>');
  try {
    await reply(ctx, '⏳ Creating neon metal style...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    // Dark metallic background
    ctx2.fillStyle = '#1a1a1a';
    ctx2.fillRect(0, 0, 800, 200);
    
    // Metal gradient
    const gradient = ctx2.createLinearGradient(0, 0, 800, 0);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.5, '#ffd93d');
    gradient.addColorStop(1, '#6bcb77');
    ctx2.shadowColor = '#ffd93d';
    ctx2.shadowBlur = 40;
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = gradient;
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🔮 Neon Metal' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── GAMINGLOGO ──────────────────────────────────────────────
commands.gaminglogo = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .gaminglogo <text>');
  try {
    await reply(ctx, '⏳ Creating gaming logo...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    // Gaming background
    const gradient = ctx2.createRadialGradient(400, 100, 50, 400, 100, 400);
    gradient.addColorStop(0, '#2d1b69');
    gradient.addColorStop(1, '#0a0a2a');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 800, 200);
    
    ctx2.shadowColor = '#ff00ff';
    ctx2.shadowBlur = 30;
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = '#ff6b6b';
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🎮 Gaming Logo' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── GRAFFITI ──────────────────────────────────────────────
commands.graffiti = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .graffiti <text>');
  try {
    await reply(ctx, '⏳ Creating graffiti style...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    // Brick wall
    ctx2.fillStyle = '#8B4513';
    ctx2.fillRect(0, 0, 800, 200);
    for (let x = 0; x < 800; x += 100) {
      ctx2.strokeStyle = '#6B3410';
      ctx2.lineWidth = 2;
      ctx2.strokeRect(x, 0, 100, 200);
    }
    
    ctx2.font = 'bold 70px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.shadowColor = 'black';
    ctx2.shadowBlur = 10;
    ctx2.fillStyle = '#ff0000';
    ctx2.fillText(text, 400, 100);
    ctx2.fillStyle = '#00ff00';
    ctx2.fillText(text, 402, 102);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🎨 Graffiti Text' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── SANDWRITING ──────────────────────────────────────────────
commands.sandwriting = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .sandwriting <text>');
  try {
    await reply(ctx, '⏳ Creating sand writing...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    // Sand background
    ctx2.fillStyle = '#d4a574';
    ctx2.fillRect(0, 0, 800, 200);
    
    ctx2.shadowColor = '#8B7355';
    ctx2.shadowBlur = 5;
    ctx2.font = 'bold 70px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = '#8B7355';
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🏖️ Sand Writing' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── GALAXY ──────────────────────────────────────────────────
commands.galaxy = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .galaxy <text>');
  try {
    await reply(ctx, '⏳ Creating galaxy style...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    // Galaxy background
    const gradient = ctx2.createRadialGradient(400, 100, 50, 400, 100, 400);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.3, '#ffd93d');
    gradient.addColorStop(0.6, '#6bcb77');
    gradient.addColorStop(1, '#4d96ff');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 800, 200);
    
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.shadowColor = 'white';
    ctx2.shadowBlur = 20;
    ctx2.fillStyle = 'white';
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🌌 Galaxy Text' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── RAINBOW ──────────────────────────────────────────────────
commands['ephoto-rainbow'] = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .rainbow <text>');
  try {
    await reply(ctx, '⏳ Creating rainbow text...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    ctx2.fillStyle = '#1a1a2e';
    ctx2.fillRect(0, 0, 800, 200);
    
    const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8b00ff'];
    const gradient = ctx2.createLinearGradient(0, 0, 800, 0);
    colors.forEach((color, i) => {
      gradient.addColorStop(i / (colors.length - 1), color);
    });
    
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.shadowColor = 'white';
    ctx2.shadowBlur = 10;
    ctx2.fillStyle = gradient;
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🌈 Rainbow Text' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── MATRIX ──────────────────────────────────────────────────
commands.matrix = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .matrix <text>');
  try {
    await reply(ctx, '⏳ Creating matrix style...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    ctx2.fillStyle = '#0a0a0a';
    ctx2.fillRect(0, 0, 800, 200);
    
    // Matrix rain effect (simplified)
    for (let i = 0; i < 50; i++) {
      ctx2.fillStyle = '#00ff00';
      ctx2.font = '16px monospace';
      ctx2.textAlign = 'left';
      ctx2.textBaseline = 'top';
      ctx2.fillText('01'[Math.floor(Math.random() * 2)], Math.random() * 800, Math.random() * 200);
    }
    
    ctx2.font = 'bold 70px monospace';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.shadowColor = '#00ff00';
    ctx2.shadowBlur = 30;
    ctx2.fillStyle = '#00ff00';
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '💻 Matrix Text' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── WATERCOLOR ──────────────────────────────────────────────
commands.watercolor = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .watercolor <text>');
  try {
    await reply(ctx, '⏳ Creating watercolor style...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    const gradient = ctx2.createLinearGradient(0, 0, 800, 200);
    gradient.addColorStop(0, '#ff9a9e');
    gradient.addColorStop(0.5, '#fecfef');
    gradient.addColorStop(1, '#fdfcfb');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 800, 200);
    
    ctx2.font = 'bold 70px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.shadowColor = 'rgba(0,0,0,0.3)';
    ctx2.shadowBlur = 5;
    ctx2.fillStyle = '#2d3436';
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🎨 Watercolor Text' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── NEONLIGHT ──────────────────────────────────────────────
commands.neonlight = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .neonlight <text>');
  try {
    await reply(ctx, '⏳ Creating neon light style...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    ctx2.fillStyle = '#0a0a2a';
    ctx2.fillRect(0, 0, 800, 200);
    
    ctx2.shadowColor = '#ff00ff';
    ctx2.shadowBlur = 40;
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = '#ff00ff';
    ctx2.fillText(text, 400, 100);
    
    ctx2.shadowColor = '#00ffff';
    ctx2.shadowBlur = 20;
    ctx2.fillStyle = '#00ffff';
    ctx2.fillText(text, 398, 98);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '💡 Neon Light' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── GLITCH2 ──────────────────────────────────────────────────
commands.glitch2 = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .glitch2 <text>');
  try {
    await reply(ctx, '⏳ Creating glitch v2...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    ctx2.fillStyle = '#0a0a0a';
    ctx2.fillRect(0, 0, 800, 200);
    
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    
    const glitchColors = ['#ff0000', '#00ff00', '#0000ff'];
    glitchColors.forEach((color, i) => {
      ctx2.shadowColor = color;
      ctx2.shadowBlur = 20;
      ctx2.fillStyle = color;
      ctx2.fillText(text, 400 + i*3 - 3, 100 + i*3 - 3);
    });
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🌀 Glitch V2' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── CHALKBOARD ──────────────────────────────────────────────
commands.chalkboard = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .chalkboard <text>');
  try {
    await reply(ctx, '⏳ Creating chalkboard style...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    ctx2.fillStyle = '#2d3436';
    ctx2.fillRect(0, 0, 800, 200);
    
    for (let i = 0; i < 100; i++) {
      ctx2.fillStyle = 'rgba(255,255,255,0.02)';
      ctx2.fillRect(Math.random() * 800, Math.random() * 200, 2, 2);
    }
    
    ctx2.font = 'bold 70px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.shadowColor = 'rgba(255,255,255,0.2)';
    ctx2.shadowBlur = 3;
    ctx2.fillStyle = '#ffffff';
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '📝 Chalkboard' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── 3DSTONE ──────────────────────────────────────────────────
commands['3dstone'] = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .3dstone <text>');
  try {
    await reply(ctx, '⏳ Creating 3D stone style...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    const gradient = ctx2.createLinearGradient(0, 0, 800, 200);
    gradient.addColorStop(0, '#8B8B8B');
    gradient.addColorStop(0.5, '#A0A0A0');
    gradient.addColorStop(1, '#8B8B8B');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 800, 200);
    
    ctx2.shadowColor = 'rgba(0,0,0,0.5)';
    ctx2.shadowBlur = 10;
    ctx2.shadowOffsetX = 3;
    ctx2.shadowOffsetY = 3;
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = '#6B6B6B';
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🪨 3D Stone' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── 3DGOLD ──────────────────────────────────────────────────
commands['3dgold'] = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .3dgold <text>');
  try {
    await reply(ctx, '⏳ Creating 3D gold style...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    const gradient = ctx2.createLinearGradient(0, 0, 800, 200);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.3, '#FFA500');
    gradient.addColorStop(0.7, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 800, 200);
    
    ctx2.shadowColor = 'rgba(0,0,0,0.5)';
    ctx2.shadowBlur = 10;
    ctx2.shadowOffsetX = 3;
    ctx2.shadowOffsetY = 3;
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = '#FFD700';
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '✨ 3D Gold' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── GOLDFLAG ──────────────────────────────────────────────────
commands.goldflag = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .goldflag <text>');
  try {
    await reply(ctx, '⏳ Creating gold flag style...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    ctx2.fillStyle = '#1a1a2e';
    ctx2.fillRect(0, 0, 800, 200);
    
    const gradient = ctx2.createLinearGradient(0, 0, 800, 200);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    ctx2.shadowColor = '#FFD700';
    ctx2.shadowBlur = 20;
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = gradient;
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🏁 Gold Flag' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── SMOKE ──────────────────────────────────────────────────
commands.smoke = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .smoke <text>');
  try {
    await reply(ctx, '⏳ Creating smoke effect...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    const gradient = ctx2.createLinearGradient(0, 0, 800, 200);
    gradient.addColorStop(0, '#2d3436');
    gradient.addColorStop(1, '#636e72');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 800, 200);
    
    ctx2.shadowColor = 'rgba(255,255,255,0.3)';
    ctx2.shadowBlur = 30;
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = 'rgba(255,255,255,0.8)';
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '💨 Smoke Effect' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── ICE ──────────────────────────────────────────────────────
commands.ice = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .ice <text>');
  try {
    await reply(ctx, '⏳ Creating ice effect...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    const gradient = ctx2.createLinearGradient(0, 0, 800, 200);
    gradient.addColorStop(0, '#00d2ff');
    gradient.addColorStop(1, '#3a7bd5');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 800, 200);
    
    ctx2.shadowColor = 'white';
    ctx2.shadowBlur = 20;
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = '#e8f4f8';
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '❄️ Ice Effect' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── VAPORWAVE ──────────────────────────────────────────────────
commands['ephoto-vaporwave'] = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .vaporwave <text>');
  try {
    await reply(ctx, '⏳ Creating vaporwave style...');
    const text = ctx.q;
    const canvas = createCanvas(800, 200);
    const ctx2 = canvas.getContext('2d');
    
    const gradient = ctx2.createLinearGradient(0, 0, 800, 200);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.5, '#ffd93d');
    gradient.addColorStop(1, '#6bcb77');
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 800, 200);
    
    ctx2.font = 'bold 80px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.shadowColor = 'white';
    ctx2.shadowBlur = 10;
    ctx2.fillStyle = '#2d3436';
    ctx2.fillText(text, 400, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: '🌴 Vaporwave' }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── COLOR ──────────────────────────────────────────────────
commands.color = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .color <hex>\nExample: .color ff0000');
  try {
    const hex = ctx.q.replace('#', '');
    const color = parseInt(hex, 16);
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;
    
    const canvas = createCanvas(400, 200);
    const ctx2 = canvas.getContext('2d');
    ctx2.fillStyle = `rgb(${r},${g},${b})`;
    ctx2.fillRect(0, 0, 400, 200);
    
    ctx2.font = '20px Arial';
    ctx2.fillStyle = '#ffffff';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillText(`#${hex}`, 200, 100);
    ctx2.fillStyle = '#000000';
    ctx2.fillText(`#${hex}`, 202, 102);
    ctx2.fillStyle = '#ffffff';
    ctx2.fillText(`#${hex}`, 200, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: `🎨 Color #${hex}` }, { quoted: ctx.msg });
  } catch (e) {
    await reply(ctx, '❌ Failed: ' + e.message);
  }
};

// ─── CURRENCY ──────────────────────────────────────────────────
commands.currency = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .currency <amount> <from> <to>\nExample: .currency 100 USD EUR');
  try {
    const parts = ctx.q.split(' ');
    if (parts.length < 3) return reply(ctx, '❌ Format: amount from to');
    const amount = parseFloat(parts[0]);
    const from = parts[1].toUpperCase();
    const to = parts[2].toUpperCase();
    
    // Use free currency API
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);
    if (!response.data || !response.data.rates) {
      return reply(ctx, '❌ Invalid currency code.');
    }
    const rate = response.data.rates[to];
    if (!rate) return reply(ctx, `❌ Currency ${to} not found.`);
    const result = (amount * rate).toFixed(2);
    
    await reply(ctx, `💱 *Currency Converter*\n${amount} ${from} = ${result} ${to}\nRate: 1 ${from} = ${rate} ${to}`);
  } catch (e) {
    await reply(ctx, '❌ Currency conversion failed: ' + e.message);
  }
};

module.exports = commands;
