async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

const commands = {};

commands.google = commands.gsearch = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .google <query>');
  await reply(ctx, '🔍 Google search: ' + ctx.q + '\nhttps://www.google.com/search?q=' + encodeURIComponent(ctx.q));
};

commands.wiki = commands.wikipedia = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .wiki <query>');
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(ctx.q)}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.extract) {
      await reply(ctx, '📖 *' + data.title + '*\n' + data.extract.slice(0, 1500));
    } else {
      await reply(ctx, '❌ No Wikipedia page found.');
    }
  } catch {
    await reply(ctx, '❌ Wikipedia fetch failed.');
  }
};

commands.define = commands.dictionary = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .define <word>');
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(ctx.q)}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data[0] && data[0].meanings && data[0].meanings[0]) {
      const def = data[0].meanings[0].definitions[0].definition;
      await reply(ctx, '📖 *' + ctx.q + '*\n' + def);
    } else {
      await reply(ctx, '❌ Word not found.');
    }
  } catch {
    await reply(ctx, '❌ Dictionary fetch failed.');
  }
};

commands.weather = commands.wth = commands.wx = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .weather <city>');
  try {
    const https = require('https');
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

commands.myip = async function(ctx) {
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get('https://api.ipify.org?format=json', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.ip) {
      await reply(ctx, '🌐 Your IP: ' + data.ip);
    } else {
      await reply(ctx, '❌ Could not get IP.');
    }
  } catch {
    await reply(ctx, '❌ IP fetch failed.');
  }
};

commands.ipinfo = commands.track_ip = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .ipinfo <ip>');
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get(`http://ip-api.com/json/${ctx.q}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.status === 'success') {
      await reply(ctx, '🌐 *IP Info for ' + ctx.q + '*\nCountry: ' + data.country + '\nCity: ' + data.city + '\nISP: ' + data.isp);
    } else {
      await reply(ctx, '❌ IP not found.');
    }
  } catch {
    await reply(ctx, '❌ IP info fetch failed.');
  }
};

commands.news = async function(ctx) {
  const topic = ctx.q || 'general';
  await reply(ctx, '📰 News for: ' + topic + '\nVisit https://news.google.com/search?q=' + encodeURIComponent(topic));
};

commands.randomfact = commands.rfact = commands.mfact = async function(ctx) {
  const facts = [
    "Honey never spoils - 3000-year-old honey is still edible.",
    "Octopuses have three hearts and blue blood.",
    "Lightning strikes Earth about 100 times every second.",
    "Sharks are older than trees - they've been around 400 million years.",
    "A day on Venus is longer than a year on Venus.",
    "Butterflies taste with their feet.",
    "Humans share 60% of their DNA with bananas.",
    "The Eiffel Tower grows 6 inches taller in summer.",
    "It rains diamonds on Neptune and Uranus."
  ];
  await reply(ctx, '🔍 *Fact*\n' + pick(facts));
};

commands.numberfact = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .numberfact <number>');
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get(`http://numbersapi.com/${ctx.q}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      }).on('error', reject);
    });
    await reply(ctx, '🔢 ' + data);
  } catch {
    await reply(ctx, '❌ Failed to fetch fact.');
  }
};

commands.npmsearch = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .npmsearch <package>');
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(ctx.q)}&size=5`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.objects && data.objects.length) {
      let msg = '📦 *NPM Search*\n';
      data.objects.slice(0, 5).forEach((pkg, i) => {
        msg += (i+1) + '. ' + pkg.package.name + ' - ' + pkg.package.version + '\n';
      });
      await reply(ctx, msg);
    } else {
      await reply(ctx, '❌ No packages found.');
    }
  } catch {
    await reply(ctx, '❌ NPM search failed.');
  }
};

commands.npmstalk = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .npmstalk <package>');
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get(`https://registry.npmjs.org/${encodeURIComponent(ctx.q)}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.name) {
      await reply(ctx, '📦 *NPM Package: ' + data.name + '*\nVersion: ' + data['dist-tags'].latest + '\nDescription: ' + (data.description || 'N/A'));
    } else {
      await reply(ctx, '❌ Package not found.');
    }
  } catch {
    await reply(ctx, '❌ NPM fetch failed.');
  }
};

commands.pinterest = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .pinterest <query>');
  await reply(ctx, '📌 Pinterest search: ' + ctx.q + '\nVisit https://pinterest.com/search/pins/?q=' + encodeURIComponent(ctx.q));
};

commands.pixabay = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .pixabay <query>');
  await reply(ctx, '🖼️ Pixabay search: ' + ctx.q + '\nVisit https://pixabay.com/images/search/' + encodeURIComponent(ctx.q));
};

commands.gimage = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .gimage <query>');
  await reply(ctx, '🖼️ Google Images search: ' + ctx.q + '\nhttps://www.google.com/search?q=' + encodeURIComponent(ctx.q) + '&tbm=isch');
};

commands.moviesearch = commands.movieinfo = commands.imdb = commands.moviedb = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .movieinfo <title>');
  await reply(ctx, '🎬 Movie: ' + ctx.q + '\nSearch on https://www.imdb.com/find?q=' + encodeURIComponent(ctx.q));
};

commands.recipe = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .recipe <dish>');
  await reply(ctx, '🍳 Recipe for: ' + ctx.q + '\nSearch on https://www.allrecipes.com/search?q=' + encodeURIComponent(ctx.q));
};

commands.bible = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .bible <reference>');
  await reply(ctx, '📖 Bible reference: ' + ctx.q + '\nVisit https://www.biblegateway.com/passage/?search=' + encodeURIComponent(ctx.q));
};

commands.quran = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .quran <reference>');
  await reply(ctx, '🕌 Quran reference: ' + ctx.q + '\nVisit https://quran.com/' + encodeURIComponent(ctx.q));
};

commands.element = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .element <name>');
  await reply(ctx, '🧪 Element: ' + ctx.q + '\nVisit https://periodictable.com');
};

commands.shazam = async function(ctx) {
  await reply(ctx, '🎵 Shazam coming soon. Use .play to search songs.');
};

commands.horoscope = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .horoscope <sign>');
  const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  if (!signs.includes(ctx.q.toLowerCase())) return reply(ctx, '❌ Invalid sign. Choose: ' + signs.join(', '));
  await reply(ctx, '🔮 Horoscope for ' + ctx.q + '\nCheck https://www.horoscope.com/us/horoscopes/general/');
};

commands.igstalk = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .igstalk <username>');
  await reply(ctx, '📸 Instagram: ' + ctx.q + '\nVisit https://www.instagram.com/' + ctx.q);
};

commands.tiktokstalk = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .tiktokstalk <username>');
  await reply(ctx, '🎵 TikTok: ' + ctx.q + '\nVisit https://www.tiktok.com/@' + ctx.q);
};

commands.ytstalk = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .ytstalk <username>');
  await reply(ctx, '▶️ YouTube: ' + ctx.q + '\nVisit https://www.youtube.com/@' + ctx.q);
};

commands.fbstalk = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .fbstalk <username>');
  await reply(ctx, '📘 Facebook: ' + ctx.q);
};

commands.twstalk = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .twstalk <username>');
  await reply(ctx, '🐦 Twitter/X: ' + ctx.q);
};

commands.wastalk = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .wastalk <number>');
  await reply(ctx, '📱 WhatsApp: https://wa.me/' + ctx.q.replace(/[^0-9]/g, ''));
};

commands.inspiration = async function(ctx) {
  const quotes = [
    "Believe you can and you're halfway there. – T. Roosevelt",
    "The only impossible journey is the one you never begin. – T. Robbins",
    "It does not matter how slowly you go as long as you do not stop. – Confucius",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. – W. Churchill"
  ];
  await reply(ctx, '💡 *Inspiration*\n' + pick(quotes));
};

commands.nasaphoto = commands.apod = async function(ctx) {
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.url) {
      await ctx.sock.sendMessage(ctx.from, { image: { url: data.url }, caption: '🌌 *' + data.title + '*\n' + data.explanation.slice(0, 300) }, { quoted: ctx.msg });
    } else {
      await reply(ctx, '❌ No NASA image found.');
    }
  } catch {
    await reply(ctx, '❌ NASA APOD fetch failed.');
  }
};

commands.asteroid = async function(ctx) {
  await reply(ctx, '☄️ Asteroid info coming soon.');
};

commands.artwork = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .artwork <query>');
  await reply(ctx, '🎨 Artwork for: ' + ctx.q + '\nVisit https://www.artsy.net/search?q=' + encodeURIComponent(ctx.q));
};

commands.musicinfo = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .musicinfo <artist>');
  await reply(ctx, '🎵 Music info for: ' + ctx.q + '\nVisit https://www.allmusic.com/search/artists/' + encodeURIComponent(ctx.q));
};

commands.michsearch = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .michsearch <query>');
  await reply(ctx, '🔍 Search results for: ' + ctx.q);
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

module.exports = commands;
