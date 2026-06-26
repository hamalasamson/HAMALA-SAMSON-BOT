async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const commands = {};

const actions = {
  hug: ['🤗 *hugs* @%s', '🫂 *hugs* @%s tightly', '🤗 *hugs* @%s warmly'],
  kiss: ['😘 *kisses* @%s', '💋 *kisses* @%s softly', '😚 *kisses* @%s on the cheek'],
  slap: ['✋ *slaps* @%s', '💥 *slaps* @%s hard', '👋 *slaps* @%s lightly'],
  pat: ['👋 *pats* @%s', '🫳 *pats* @%s gently', '🤚 *pats* @%s on the head'],
  lick: ['👅 *licks* @%s', '😛 *licks* @%s playfully'],
  bite: ['🦷 *bites* @%s', '😬 *bites* @%s gently'],
  yeet: ['🚀 *yeets* @%s into the sky', '💨 *yeets* @%s across the room'],
  bully: ['😤 *bullies* @%s', '🤬 *bullies* @%s mercilessly'],
  bonk: ['🔨 *bonks* @%s', '💢 *bonks* @%s on the head'],
  wink: ['😉 *winks at* @%s', '😜 *winks* at @%s playfully'],
  poke: ['👉 *pokes* @%s', '☝️ *pokes* @%s gently'],
  nom: ['🍽️ *noms* on @%s', '😋 *noms* @%s'],
  smile: ['😊 *smiles at* @%s', '😁 *smiles* at @%s warmly'],
  wave: ['👋 *waves at* @%s', '🙋 *waves* at @%s excitedly'],
  blush: ['😊 *blushes at* @%s', '🥰 *blushes* at @%s shyly'],
  dance: ['💃 *dances with* @%s', '🕺 *dances* with @%s'],
  cry: ['😭 *cries with* @%s', '😢 *cries* with @%s'],
  happy: ['🎉 *is happy with* @%s', '😊 *smiles at* @%s'],
  laugh: ['😂 *laughs with* @%s', '🤣 *laughs* at @%s'],
  angry: ['😠 *is angry at* @%s', '😡 *glares* at @%s'],
  cuddle: ['🫂 *cuddles* @%s', '🤗 *cuddles* @%s warmly'],
  highfive: ['🖐️ *high-fives* @%s', '✋ *high-fives* @%s'],
  shoot: ['🔫 *shoots* @%s', '💥 *shoots* @%s'],
  sleep: ['😴 *sleeps with* @%s', '💤 *sleeps next to* @%s'],
  awoo: ['🐺 *awoos at* @%s', '🌕 *awoos* at @%s'],
  smug: ['😏 *smirks at* @%s', '😤 *looks smug at* @%s'],
  glomp: ['💥 *glomps* @%s', '🤗 *glomps* @%s tightly'],
  cringe: ['😬 *cringes at* @%s', '😖 *cringes* with @%s'],
  handhold: ['🤝 *holds hands with* @%s', '🫱 *holds hands* with @%s'],
  shinobu: ['🦋 *Shinobu appears* for @%s', '🌸 *Shinobu smiles* at @%s'],
  kill: ['💀 *kills* @%s', '🗡️ *kills* @%s'],
  kiss: ['😘 *kisses* @%s', '💋 *kisses* @%s softly']
};

Object.keys(actions).forEach(cmd => {
  commands[cmd] = async function(ctx) {
    let target = ctx.q;
    const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (mention) target = '@' + mention.split('@')[0];
    else if (!target) target = '@' + ctx.sender;
    const msgs = actions[cmd];
    await reply(ctx, pick(msgs).replace('%s', target));
  };
});

// Anime info commands
commands.animenews = async function(ctx) {
  await reply(ctx, '📰 *Anime News*\nCheck https://myanimelist.net/news for latest updates.');
};

commands.animewlp = commands.animewallpaper = async function(ctx) {
  const query = ctx.q || 'anime';
  try {
    const https = require('https');
    const url = `https://api.waifu.pics/sfw/${query}`;
    const data = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.url) {
      await ctx.sock.sendMessage(ctx.from, { image: { url: data.url }, caption: '🖼️ Anime Wallpaper' }, { quoted: ctx.msg });
    } else {
      await reply(ctx, '❌ No wallpaper found.');
    }
  } catch {
    await reply(ctx, '❌ Failed to fetch wallpaper.');
  }
};

commands.animechar = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .animechar <name>');
  await reply(ctx, '🔍 Searching for character: ' + ctx.q + '\nUse https://myanimelist.net/character.php to find characters.');
};

commands.animerec = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .animerec <anime>');
  await reply(ctx, '📺 Recommendation for: ' + ctx.q + '\nTry searching on https://myanimelist.net');
};

commands.animesearch = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .animesearch <anime>');
  await reply(ctx, '🔍 Searching for: ' + ctx.q + '\nVisit https://myanimelist.net/anime.php?q=' + encodeURIComponent(ctx.q));
};

commands.digimon = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .digimon <name>');
  const names = ['Agumon', 'Gabumon', 'Patamon', 'Gatomon', 'Greymon', 'Garurumon'];
  const found = names.find(n => n.toLowerCase().includes(ctx.q.toLowerCase()));
  await reply(ctx, '🦕 ' + (found || 'Digimon not found. Try: ' + names.join(', ')));
};

// Animal commands
commands.fox = async function(ctx) {
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get('https://randomfox.ca/floof/', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.image) {
      await ctx.sock.sendMessage(ctx.from, { image: { url: data.image }, caption: '🦊 Fox!' }, { quoted: ctx.msg });
    } else {
      await reply(ctx, '❌ No fox found.');
    }
  } catch {
    await reply(ctx, '❌ Failed to fetch fox.');
  }
};

commands.koala = async function(ctx) {
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get('https://some-random-api.ml/img/koala', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.link) {
      await ctx.sock.sendMessage(ctx.from, { image: { url: data.link }, caption: '🐨 Koala!' }, { quoted: ctx.msg });
    } else {
      await reply(ctx, '❌ No koala found.');
    }
  } catch {
    await reply(ctx, '❌ Failed to fetch koala.');
  }
};

commands.bird = async function(ctx) {
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get('https://some-random-api.ml/img/bird', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.link) {
      await ctx.sock.sendMessage(ctx.from, { image: { url: data.link }, caption: '🐦 Bird!' }, { quoted: ctx.msg });
    } else {
      await reply(ctx, '❌ No bird found.');
    }
  } catch {
    await reply(ctx, '❌ Failed to fetch bird.');
  }
};

commands.panda = async function(ctx) {
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get('https://some-random-api.ml/img/panda', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.link) {
      await ctx.sock.sendMessage(ctx.from, { image: { url: data.link }, caption: '🐼 Panda!' }, { quoted: ctx.msg });
    } else {
      await reply(ctx, '❌ No panda found.');
    }
  } catch {
    await reply(ctx, '❌ Failed to fetch panda.');
  }
};

commands.dog = async function(ctx) {
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get('https://dog.ceo/api/breeds/image/random', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.message) {
      await ctx.sock.sendMessage(ctx.from, { image: { url: data.message }, caption: '🐶 Dog!' }, { quoted: ctx.msg });
    } else {
      await reply(ctx, '❌ No dog found.');
    }
  } catch {
    await reply(ctx, '❌ Failed to fetch dog.');
  }
};

commands.cat = async function(ctx) {
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get('https://api.thecatapi.com/v1/images/search', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data[0] && data[0].url) {
      await ctx.sock.sendMessage(ctx.from, { image: { url: data[0].url }, caption: '🐱 Cat!' }, { quoted: ctx.msg });
    } else {
      await reply(ctx, '❌ No cat found.');
    }
  } catch {
    await reply(ctx, '❌ Failed to fetch cat.');
  }
};

module.exports = commands;
