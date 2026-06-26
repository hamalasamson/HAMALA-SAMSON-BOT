async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "What do you call a fake noodle? An impasta.",
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "What do you call a fish with no eyes? A fsh.",
  "Why don't scientists trust atoms? Because they make up everything.",
  "I'm reading a book on anti-gravity. It's impossible to put down!"
];

const roasts = [
  "You're not stupid; you just have bad luck thinking.",
  "I'd agree with you, but then we'd both be wrong.",
  "You bring everyone joy when you leave the room.",
  "Even WiFi has more connections than you.",
  "You're proof that even evolution makes mistakes.",
  "Light travels faster than sound - that's why you seemed smart at first."
];

const compliments = [
  "You have a great smile!",
  "You're incredibly kind.",
  "You light up the room.",
  "You're more fun than bubble wrap.",
  "You're like a sunrise - beautiful and full of promise.",
  "Your energy is infectious!"
];

const quotes = [
  "The only way to do great work is to love what you do. – Steve Jobs",
  "In the middle of difficulty lies opportunity. – Einstein",
  "Be yourself; everyone else is already taken. – Oscar Wilde",
  "It always seems impossible until it's done. – Mandela",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. – Churchill"
];

const ballResponses = [
  "Yes, definitely.",
  "Without a doubt.",
  "It is certain.",
  "No, not at all.",
  "Very doubtful.",
  "Ask again later.",
  "Better not tell you now.",
  "Don't count on it.",
  "Signs point to yes.",
  "Cannot predict now."
];

const truths = [
  "What is your biggest fear?",
  "Have you ever lied to your best friend?",
  "What's the most embarrassing thing you've done?",
  "Who is your secret crush?",
  "What's the last thing you searched on your phone?",
  "Have you ever cheated on a test?",
  "What's something you've never told your parents?"
];

const dares = [
  "Send a voice note singing any song for 10 seconds.",
  "Change your WhatsApp bio to something embarrassing for 1 hour.",
  "Type a message using only your nose.",
  "Do 15 push-ups right now.",
  "Send a status saying: 'I lost a dare on WhatsApp.'",
  "Text your crush just the word 'hey'."
];

const wyrQuestions = [
  "Would you rather be invisible OR be able to fly?",
  "Would you rather lose all your money OR lose all your memories?",
  "Would you rather speak every language OR play every instrument?",
  "Would you rather be 10 years older OR 10 years younger?",
  "Would you rather always be cold OR always be hot?",
  "Would you rather have no internet OR no mobile data for a year?"
];

const pickups = [
  "Are you a magician? Because whenever I look at you, everyone else disappears.",
  "Do you have a map? I keep getting lost in your eyes.",
  "Is your name Google? Because you have everything I've been searching for.",
  "Are you a bank loan? Because you've got my interest.",
  "Do you have a Band-Aid? I just scraped my knee falling for you."
];

const insults = [
  "You're not the dumbest person in the world, but you better hope they don't die.",
  "I've seen salads with more personality than you.",
  "If I wanted to hear from an idiot, I'd watch you talk.",
  "You're like a cloud - when you disappear, it's a beautiful day."
];

const commands = {};

commands.joke = async function(ctx) {
  await reply(ctx, '😂 ' + pick(jokes));
};

commands.jokeplus = async function(ctx) {
  const category = ctx.q || 'general';
  await reply(ctx, '😂 ' + pick(jokes) + ' (Category: ' + category + ')');
};

commands.dadjoke = async function(ctx) {
  const dadJokes = [
    "What do you call a fake noodle? An impasta.",
    "Why did the scarecrow win an award? He was outstanding in his field.",
    "I'm reading a book on anti-gravity. It's impossible to put down!",
    "What do you call a fish with no eyes? A fsh."
  ];
  await reply(ctx, '👨 *Dad Joke*\n' + pick(dadJokes));
};

commands.roast = async function(ctx) {
  const target = ctx.q || 'you';
  await reply(ctx, '🔥 @' + target + ', ' + pick(roasts));
};

commands.compliment = async function(ctx) {
  const target = ctx.q || 'you';
  await reply(ctx, '💖 @' + target + ', ' + pick(compliments));
};

commands['8ball'] = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .8ball <question>');
  await reply(ctx, '🎱 ' + pick(ballResponses));
};

commands.quote = async function(ctx) {
  await reply(ctx, '💬 ' + pick(quotes));
};

commands.ship = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .ship <name1> & <name2>');
  const names = ctx.q.split('&').map(s => s.trim());
  if (names.length < 2) return reply(ctx, 'Separate names with &');
  const score = Math.floor(Math.random() * 101);
  const labels = score >= 90 ? '💕 SOULMATES' : score >= 70 ? '❤️ Strong Match' : score >= 50 ? '💛 Good Match' : '💔 Not Compatible';
  await reply(ctx, '💕 ' + names[0] + ' + ' + names[1] + ' = ' + score + '% ' + labels);
};

commands.truth = async function(ctx) {
  await reply(ctx, '🤫 *Truth*\n' + pick(truths));
};

commands.dare = async function(ctx) {
  await reply(ctx, '😈 *Dare*\n' + pick(dares));
};

commands.wyr = commands.wouldyou = async function(ctx) {
  await reply(ctx, '🤔 *Would You Rather?\n' + pick(wyrQuestions));
};

commands.riddle = async function(ctx) {
  const riddles = [
    { q: "I speak without a mouth and hear without ears. I have no body but come alive with wind. What am I?", a: "An echo" },
    { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
    { q: "I have hands but cannot clap. I have a face but no eyes. What am I?", a: "A clock" },
    { q: "What gets wetter the more it dries?", a: "A towel" },
    { q: "What can you catch but never throw?", a: "A cold" }
  ];
  const r = pick(riddles);
  global._riddle = r.a;
  await reply(ctx, '🧩 *Riddle*\n' + r.q + '\n\nType .riddleans to reveal the answer');
};

commands.riddleans = async function(ctx) {
  if (!global._riddle) return reply(ctx, '❌ No active riddle.');
  await reply(ctx, '💡 Answer: ' + global._riddle);
  global._riddle = null;
};

commands.pickupline = commands.rizz = async function(ctx) {
  const target = ctx.q || 'you';
  await reply(ctx, '😏 @' + target + ', ' + pick(pickups));
};

commands.insult = async function(ctx) {
  const target = ctx.q || 'you';
  await reply(ctx, '😤 @' + target + ', ' + pick(insults));
};

commands.fact = async function(ctx) {
  const facts = [
    "Honey never spoils - 3000-year-old honey is still edible.",
    "Octopuses have three hearts and blue blood.",
    "Lightning strikes Earth about 100 times every second.",
    "Sharks are older than trees - they've been around 400 million years.",
    "A day on Venus is longer than a year on Venus.",
    "Butterflies taste with their feet.",
    "Humans share 60% of their DNA with bananas."
  ];
  await reply(ctx, '🔍 *Fact*\n' + pick(facts));
};

commands.catfact = async function(ctx) {
  const facts = [
    "Cats sleep for 70% of their lives.",
    "A group of cats is called a clowder.",
    "Cats can't taste sweetness.",
    "The oldest known pet cat existed 9,500 years ago.",
    "Cats have 32 muscles in each ear."
  ];
  await reply(ctx, '🐱 *Cat Fact*\n' + pick(facts));
};

commands.catpic = async function(ctx) {
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
      await ctx.sock.sendMessage(ctx.from, { image: { url: data[0].url }, caption: '🐱 Here\'s a cat!' }, { quoted: ctx.msg });
    } else {
      await reply(ctx, '❌ No cat found.');
    }
  } catch {
    await reply(ctx, '❌ Failed to fetch cat.');
  }
};

commands.dogpic = async function(ctx) {
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
      await ctx.sock.sendMessage(ctx.from, { image: { url: data.message }, caption: '🐶 Here\'s a dog!' }, { quoted: ctx.msg });
    } else {
      await reply(ctx, '❌ No dog found.');
    }
  } catch {
    await reply(ctx, '❌ Failed to fetch dog.');
  }
};

commands.meme = async function(ctx) {
  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      https.get('https://meme-api.com/gimme', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(); }
        });
      }).on('error', reject);
    });
    if (data && data.url) {
      await ctx.sock.sendMessage(ctx.from, { image: { url: data.url }, caption: '😂 ' + data.title || 'Meme' }, { quoted: ctx.msg });
    } else {
      await reply(ctx, '❌ No meme found.');
    }
  } catch {
    await reply(ctx, '❌ Failed to fetch meme.');
  }
};

commands.emojimix = commands.emix = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .emojimix 😎+🥰');
  const emojis = ctx.q.split('+').map(s => s.trim());
  if (emojis.length < 2) return reply(ctx, '❌ Need 2 emojis separated by +');
  try {
    const url = `https://emojik.vercel.app/s/${encodeURIComponent(emojis[0])}_${encodeURIComponent(emojis[1])}`;
    await ctx.sock.sendMessage(ctx.from, { image: { url: url }, caption: '🎨 ' + emojis[0] + ' + ' + emojis[1] }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Failed to mix emojis.');
  }
};

commands.breakingbad = async function(ctx) {
  const quotes = [
    "I am the one who knocks.",
    "Say my name.",
    "I did it for me. I liked it. I was good at it.",
    "You're Goddamn right.",
    "Stay out of my territory.",
    "We're done when I say we're done."
  ];
  await reply(ctx, '🧪 *Breaking Bad*\n"' + pick(quotes) + '"');
};

commands.chucknorris = async function(ctx) {
  const jokes = [
    "Chuck Norris doesn't sleep. He waits.",
    "Chuck Norris can divide by zero.",
    "Chuck Norris counted to infinity. Twice.",
    "Chuck Norris can slam a revolving door.",
    "Chuck Norris doesn't use a computer - he stares at it until it gives him what he wants."
  ];
  await reply(ctx, '💪 *Chuck Norris*\n' + pick(jokes));
};

commands.fortune = async function(ctx) {
  const fortunes = [
    "You will have a great day today!",
    "A surprise is coming your way.",
    "Good things come to those who wait.",
    "You will soon receive good news.",
    "Your hard work will pay off.",
    "Adventure awaits you.",
    "A new opportunity is on the horizon."
  ];
  await reply(ctx, '🔮 *Fortune*\n' + pick(fortunes));
};

commands.tarot = async function(ctx) {
  const cards = [
    "The Fool - New beginnings",
    "The Magician - Manifestation",
    "The High Priestess - Intuition",
    "The Empress - Abundance",
    "The Emperor - Authority",
    "The Lovers - Love",
    "The Chariot - Victory",
    "Strength - Courage",
    "The Hermit - Wisdom",
    "The Star - Hope"
  ];
  await reply(ctx, '🃏 *Tarot*\n' + pick(cards));
};

module.exports = commands;
