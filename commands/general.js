const cfg = require('../config');
const fs = require('fs');
const path = require('path');
const state = require('../lib/state');

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

function uptime() {
  const s = Math.floor(process.uptime());
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h + 'h ' + m + 'm ' + sec + 's';
}

const commands = {};

// ─── MENU (bold + decorations) ───────────────────────────────
commands.menu = async function(ctx) {
  const imageUrl = 'https://i.imgur.com/bW935lG.png';
  const contextInfo = {
    isForwarded: true,
    forwardingScore: 999,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363275847725658@newsletter',
      newsletterName: 'SONXX LITE MAIN DEV',
      serverMessageId: -1
    }
  };
  const caption = `
*╭✰ SONXX LITE MAIN DEV*
*┃ 📱 Version:* ${cfg.VERSION}
*┃ 👑 Owner:* Session Owner
*┃ 👤 User:* ${ctx.sender}
*┃ ⏰ Runtime:* ${uptime()}
*┃ 🔧 Mode:* ${cfg.MODE}
*┃ 📝 Prefix:* ${cfg.PREFIX}
*╰✰*

*【 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 】*

*╭✰ ⟬ 𝐌𝐄𝐃𝐈𝐀 ⟭*
│ *.sticker*
│ *.stickervid*
│ *.toimage*
│ *.tovideo*
│ *.toaudio*
│ *.tovoice*
│ *.tourl*
│ *.togif*
│ *.todoc <filename>*
│ *.toview*
│ *.toviewonce*
│ *.vv*
│ *.vv2*
│ *.take <packname>*
│ *.mediatag*
│ *.removebg*
│ *.imgtext*
│ *.ocr*
│ *.wm*
│ *.sub*
│ *.subtitle*
│ *.mtovideo*
│ *.couplepp*
│ *.steal*
│ *.del*
│ *.delete*
│ *.forward <jid>*
│ *.volaudio <vol>*
│ *.volvideo <vol>*
*╰✰*

*╭✰ ⟬ 𝐒𝐓𝐈𝐂𝐊𝐄𝐑 𝐓𝐎𝐎𝐋𝐒 ⟭*
│ *.stickerinfo*
│ *.txtsticker*
│ *.tgsticker <link>*
│ *.album*
*╰✰*

*╭✰ ⟬ 𝐎𝐖𝐍𝐄𝐑 ⟭*
│ *.owner*
│ *.ping*
│ *.runtime*
│ *.profile*
│ *.support*
│ *.feedback*
│ *.alive*
│ *.setalive <text>*
│ *.setsudo @user*
│ *.delsudo @user*
│ *.listsudo*
│ *.block <num>*
│ *.unblock <num>*
│ *.listblocked*
│ *.setpp (reply image)*
│ *.delpp*
│ *.setppname <text>*
│ *.setbio <text>*
│ *.getpp*
│ *.getname*
│ *.pinchat*
│ *.unpinchat*
│ *.join <link>*
│ *.joinch <link>*
│ *.leave*
│ *.broadcast <text>*
│ *.save (reply media)*
│ *.sendgclink <num>*
│ *.reactch <link> <emoji>*
│ *.idch*
│ *.checkidch*
│ *.autotyping*
│ *.autorecording*
│ *.autoread*
│ *.autoviewstatus on/off*
│ *.alwaysonline*
│ *.autoreact*
│ *.anticall on/off*
│ *.listgc*
│ *.totalcmd*
│ *.totalmembers*
│ *.membercount*
│ *.mblock*
│ *.mbsearch*
*╰✰*

*╭✰ ⟬ 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 ⟭*
│ *.setprefix <sym>*
│ *.public*
│ *.private*
│ *.setname <name>*
│ *.setowner <num>*
│ *.setmenuimage <url>*
│ *.setwelcome on/off/reset*
│ *.setgoodbye on/off/reset*
│ *.modstatus*
│ *.modsettings*
*╰✰*

*╭✰ ⟬ 𝐒𝐓𝐀𝐓𝐔𝐒 ⟭*
│ *.togcstatus*
│ *.totgstatus2*
│ *.poststatus*
│ *.mstatus*
│ *.groupstatus*
*╰✰*

*╭✰ ⟬ 𝐆𝐑𝐎𝐔𝐏 ⟭*
│ *.kick @user*
│ *.add <num>*
│ *.promote @user*
│ *.demote @user*
│ *.promoteall*
│ *.demoteall*
│ *.demotealladmins*
│ *.kickall*
│ *.findfriends*
│ *.ban @user*
│ *.unban @user*
│ *.listban*
│ *.warn @user*
│ *.unwarn @user*
│ *.listwarn*
│ *.resetwarns @user*
│ *.autolink*
│ *.tagall*
│ *.hidetag <text>*
│ *.tagadmins*
│ *.announce <text>*
│ *.open*
│ *.close*
│ *.opentime*
│ *.closetime*
│ *.setgcname <name>*
│ *.setgcdesc <text>*
│ *.setgcpp (reply image)*
│ *.delgcpp*
│ *.getlink*
│ *.revoke*
│ *.acceptall*
│ *.rejectall*
│ *.gcinfo*
│ *.groupid*
│ *.listmembers*
│ *.admins*
│ *.pin*
│ *.unpin*
│ *.poll <q>|<o1>|<o2>*
│ *.creategc <name>*
│ *.left*
│ *.find*
*╰✰*

*╭✰ ⟬ 𝐆𝐑𝐎𝐔𝐏 𝐌𝐀𝐍𝐀𝐆𝐄𝐌𝐄𝐍𝐓 ⟭*
│ *.mute-gc <dur>*
│ *.unmute-gc*
│ *.announcement <text>*
│ *.report @user*
│ *.event Title | DD/MM/YYYY | HH:MM*
│ *.eventinfo (reply)*
│ *.online @user*
│ *.contact <num> [name]*
*╰✰*

*╭✰ ⟬ 𝐏𝐑𝐎𝐓𝐄𝐂𝐓𝐈𝐎𝐍 ⟭*
│ *.antilink on/off/warn/kick/reset*
│ *.antifwd on/off/warn/kick*
│ *.antibot on/off/warn/kick*
│ *.antigroupmention on/off/warn/kick*
│ *.antispam on/off/warn/kick*
│ *.antitag on/off/warn/kick*
│ *.antibadword on/off*
│ *.antibadwords add <word>*
│ *.antipromote on/off*
│ *.antidemote on/off*
│ *.flood on/off*
*╰✰*

*╭✰ ⟬ 𝐈𝐍𝐓𝐄𝐑𝐀𝐂𝐓𝐈𝐕𝐄 ⟭*
│ *.button <q> | <b1> | <b2>*
│ *.list <title> <desc> <opt...>*
│ *.edit <text> (reply bot)*
│ *.keep (reply)*
│ *.fwdviewonce <jid>*
│ *.reactto <emoji> (reply)*
│ *.pollresults (reply)*
*╰✰*

*╭✰ ⟬ 𝐈𝐌𝐀𝐆𝐄 𝐏𝐑𝐎𝐂𝐄𝐒𝐒𝐈𝐍𝐆 ⟭*
│ *.mich-meme top | bottom (reply)*
│ *.quoteimg <text> | <author>*
│ *.crop <wxh> (reply)*
│ *.resize <50%> or <200x200>*
│ *.filter greyscale|sepia|blur*
│ *.wanted (reply image)*
│ *.wasted (reply image)*
│ *.jail (reply image)*
│ *.invert (reply image)*
│ *.rainbow (reply image)*
│ *.hd / enhance (reply image)*
│ *.carbon <code>*
│ *.brat <text>*
*╰✰*

*╭✰ ⟬ 𝐔𝐓𝐈𝐋𝐈𝐓𝐘 ⟭*
│ *.say <text>*
│ *.translate <lang> <text>*
│ *.tr <lang> <text>*
│ *.style <text>*
│ *.fancy <text>*
│ *.readmore <text>*
│ *.calc <expr>*
│ *.calculator <expr>*
│ *.morse <text>*
│ *.morsecode <text>*
│ *.ssweb <url>*
│ *.screenshot <url>*
│ *.imgur (reply)*
│ *.get <url>*
│ *.checkweb <url>*
│ *.urlinfo <url>*
│ *.linkinfo <url>*
│ *.passcheck <pwd>*
│ *.passwordcheck <pwd>*
│ *.getdevice*
│ *.archive*
│ *.unarchive*
│ *.setcmd*
│ *.delcmd*
│ *.listcmd*
│ *.tts <text>*
│ *.speak <text>*
│ *.whois @user*
│ *.app*
│ *.dl <url>*
│ *.flip*
│ *.reset*
│ *.top*
│ *.scores*
│ *.pay @user <amt>*
│ *.bet <amt>*
│ *.rch <link>*
│ *.img <q>*
│ *.describe <url>*
│ *.qrcode <text>*
│ *.readqr (reply image)*
│ *.shorturl <url>*
│ *.pdftotext (reply pdf)*
│ *.advice*
│ *.colorinfo <hex>*
│ *.genderpredict <name>*
│ *.zipcode <zip> <country>*
│ *.aidetect <text>*
│ *.forecast <city>*
*╰✰*

*╭✰ ⟬ 𝐒𝐄𝐀𝐑𝐂𝐇 ⟭*
│ *.google <q>*
│ *.gsearch <q>*
│ *.wiki <q>*
│ *.wikipedia <q>*
│ *.npmsearch <pkg>*
│ *.npmstalk <pkg>*
│ *.pinterest <q>*
│ *.pixabay <q>*
│ *.gimage <q>*
│ *.dictionary <word>*
│ *.define <word>*
│ *.moviesearch <title>*
│ *.movieinfo <title>*
│ *.imdb <title>*
│ *.moviedb <title>*
│ *.recipe <dish>*
│ *.weather <city>*
│ *.wth <city>*
│ *.wx <city>*
│ *.ipinfo <ip>*
│ *.track-ip <ip>*
│ *.myip*
│ *.bible <ref>*
│ *.quran <ref>*
│ *.element <name>*
│ *.shazam*
│ *.horoscope <sign>*
│ *.tiktokstalk <user>*
│ *.igstalk <user>*
│ *.ytstalk <user>*
│ *.fbstalk <user>*
│ *.twstalk <user>*
│ *.wastalk <num>*
│ *.inspiration*
│ *.nasaphoto*
│ *.apod*
│ *.news <topic>*
│ *.randomfact*
│ *.rfact*
│ *.mfact*
│ *.numberfact <n>*
│ *.asteroid*
│ *.artwork <query>*
│ *.musicinfo <artist>*
│ *.michsearch <title>*
*╰✰*

*╭✰ ⟬ 𝐅𝐔𝐍 & 𝐒𝐎𝐂𝐈𝐀𝐋 ⟭*
│ *.truth*
│ *.dare*
│ *.wyr*
│ *.wouldyou*
│ *.ship @u1 @u2*
│ *.riddle*
│ *.pickupline*
│ *.rizz*
│ *.insult*
│ *.simi <msg>*
│ *.catfact*
│ *.catpic*
│ *.dogpic*
│ *.emojimix 😎+🥰*
│ *.emix 😎+🥰*
│ *.meme*
│ *.joke*
│ *.jokeplus <category>*
│ *.dadjoke*
│ *.chucknorris <category>*
│ *.breakingbad*
│ *.fact*
│ *.quote*
│ *.numbergame*
│ *.nsfwgen <prompt>*
│ *.text2nsfw <prompt>*
│ *.8ball*
│ *.fortune*
│ *.tarot*
│ *.battle @user*
*╰✰*

*╭✰ ⟬ 𝐄𝐂𝐎𝐍𝐎𝐌𝐘 ⟭*
│ *.economy on/off*
│ *.bal*
│ *.balance*
│ *.wallet*
│ *.daily*
│ *.work*
│ *.deposit <amt>*
│ *.withdraw <amt>*
│ *.give @user <amt>*
│ *.rob @user*
│ *.gamble <amt>*
│ *.lb*
│ *.leaderboard*
│ *.shop*
│ *.buy <item>*
│ *.inv*
│ *.inventory*
│ *.steal*
│ *.crime*
│ *.hunt*
│ *.fish*
│ *.mine*
│ *.level*
│ *.ecoinfo*
│ *.bail*
*╰✰*

*╭✰ ⟬ 𝐀𝐍𝐈𝐌𝐄 & 𝐆𝐈𝐅 ⟭*
│ *.animenews*
│ *.animewlp*
│ *.animewallpaper*
│ *.animechar <name>*
│ *.animerec <title>*
│ *.animesearch <title>*
│ *.digimon <name>*
│ *.hug*
│ *.kiss*
│ *.kill*
│ *.slap*
│ *.pat*
│ *.lick*
│ *.bite*
│ *.yeet*
│ *.bully*
│ *.bonk*
│ *.wink*
│ *.poke*
│ *.nom*
│ *.smile*
│ *.wave*
│ *.blush*
│ *.dance*
│ *.cry*
│ *.happy*
│ *.laugh*
│ *.angry*
│ *.cuddle*
│ *.highfive*
│ *.shoot*
│ *.sleep*
│ *.awoo*
│ *.smug*
│ *.glomp*
│ *.cringe*
│ *.handhold*
│ *.shinobu*
│ *.fox*
│ *.koala*
│ *.bird*
│ *.panda*
│ *.dog*
│ *.cat*
*╰✰*

*╭✰ ⟬ 𝐄𝐏𝐇𝐎𝐓𝐎 𝐄𝐅𝐅𝐄𝐂𝐓𝐒 ⟭*
│ *.ephotolist*
│ *.ephotostyles*
│ *.glitchtext <text>*
│ *.cyberpunk <text>*
│ *.neonmetal <text>*
│ *.gaminglogo <text>*
│ *.graffiti <text>*
│ *.sandwriting <text>*
│ *.galaxy <text>*
│ *.rainbow <text>*
│ *.matrix <text>*
│ *.watercolor <text>*
│ *.neonlight <text>*
│ *.glitch2 <text>*
│ *.chalkboard <text>*
│ *.3dstone <text>*
│ *.3dgold <text>*
│ *.goldflag <text>*
│ *.smoke <text>*
│ *.ice <text>*
│ *.underwater <text>*
│ *.vaporwave <text>*
│ *.color <hex>*
│ *.currency <amt> <from> <to>*
*╰✰*

*╭✰ ⟬ 𝐀𝐈 ⟭*
│ *.ask <q>*
│ *.ai <q>*
│ *.gpt <q>*
│ *.codeai <desc>*
│ *.codegen <desc>*
│ *.imagine <prompt>*
│ *.imagine-ai <prompt>*
│ *.imagine2 <prompt>*
│ *.sdimage <prompt>*
│ *.aiimage <prompt>*
│ *.aiimage2 <prompt>*
│ *.aigenimage <prompt>*
│ *.flux <prompt>*
│ *.fluxxmd <prompt>*
│ *.pollinations <prompt>*
│ *.genimage <prompt>*
│ *.nanobananapro <prompt>*
│ *.gen <prompt>*
│ *.generate <prompt>*
│ *.gemini-vision <url>*
│ *.chatbot on/off*
│ *.chatbot private on/off*
│ *.chatbot clear*
*╰✰*

*╭✰ ⟬ 𝐀𝐔𝐃𝐈𝐎 𝐄𝐅𝐅𝐄𝐂𝐓𝐒 ⟭*
│ *.bass*
│ *.blown*
│ *.deep*
│ *.robot*
│ *.tiny*
│ *.chipmunk*
│ *.slowed*
│ *.reverb*
│ *.nightcore*
│ *.earrape*
│ *.echo*
│ *.underwater*
│ *.telephone*
│ *.reverse*
│ *.vaporwave*
*╰✰*

*╭✰ ⟬ 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 ⟭*
│ *.play <song>*
│ *.song <name>*
│ *.sing <name>*
│ *.music <name>*
│ *.sonu <prompt>*
│ *.scdlsearch <song>*
│ *.ytmp3 <link>*
│ *.ytmp4 <link>*
│ *.ytaudio <link>*
│ *.ytvideo <link>*
│ *.ytsearch <q>*
│ *.tiktok <link>*
│ *.tt <link>*
│ *.tiktokmp3 <link>*
│ *.tiktokimg <link>*
│ *.ttsearch <q>*
│ *.ig <link>*
│ *.igdl <link>*
│ *.fbdl <link>*
│ *.scdl <link>*
│ *.soundcloud <link>*
│ *.tw <link>*
│ *.dlall <url>*
│ *.downloadall <url>*
│ *.apk <app>*
│ *.apkdl <app>*
│ *.apkdownload <app>*
│ *.mediafire <link>*
│ *.mfdl <link>*
│ *.pintdl <link>*
│ *.gdrive <link>*
│ *.spotifysearch <song>*
│ *.spsearch <song>*
│ *.spotifydl <id>*
│ *.lyrics <song>*
│ *.lyric <song>*
│ *.lyric2 <song>*
│ *.film <title>*
│ *.movie <title>*
│ *.movie2 <title>*
│ *.movie2detail <url>*
│ *.moviebox <title>*
│ *.moviedetail <url>*
│ *.movie-dl <url>*
│ *.cinesubz <title>*
│ *.video <q>*
│ *.moviedl <title>*
│ *.seriesdl <title> <s> <ep>*
│ *.michsearch <title>*
│ *.trending*
*╰✰*

*╭✰ ⟬ 𝐒𝐏𝐎𝐑𝐓𝐒 ⟭*
│ *.livescore*
│ *.scores*
│ *.fixtures <league>*
│ *.schedule <league>*
│ *.sportnews <topic>*
│ *.standings <league>*
│ *.table <league>*
│ *.team <name>*
│ *.player <name>*
│ *.league <name>*
│ *.h2h <team1> vs <team2>*
│ *.sporttrivia*
│ *.sportanswer <answer>*
│ *.transfers*
│ *.transfernews*
│ *.sportstats <team>*
│ *.f1*
│ *.nhl*
*╰✰*

*╭✰ ⟬ 𝐅𝐔𝐍 𝐅𝐀𝐂𝐓𝐒 & 𝐈𝐍𝐅𝐎 ⟭*
│ *.cocktail <name>*
│ *.makeup <brand>*
│ *.disney <character>*
│ *.remotejobs <skill>*
│ *.chucknorris <category>*
│ *.asteroid*
│ *.artwork <query>*
│ *.nasaphoto*
*╰✰*

*╭✰ ⟬ 𝐆𝐀𝐌𝐄𝐒 ⟭*
│ *.games*
│ *.gamelist*
│ *.tictactoe @user*
│ *.ttt @user*
│ *.tttmove <1-9>*
│ *.numguess*
│ *.numbergame*
│ *.guess <num>*
│ *.rps rock/paper/scissors*
│ *.trivia*
│ *.answer a/b/c/d*
│ *.scramble*
│ *.unscramble <word>*
│ *.hangman*
│ *.hmguess <letter>*
│ *.mathquiz*
│ *.mathans <num>*
│ *.dice*
│ *.coinflip*
│ *.wouldyou*
│ *.wyr*
│ *.wordchain*
│ *.wcg*
│ *.emojiquiz*
│ *.eqanswer <guess>*
│ *.sporttrivia*
│ *.sportanswer <answer>*
│ *.endgame*
*╰✰*

*> © Powered by ${cfg.BOT_NAME}*
`;
  try {
    await ctx.sock.sendMessage(ctx.from, {
      image: { url: imageUrl },
      caption: caption,
      contextInfo: contextInfo
    }, { quoted: ctx.msg });
  } catch {
    await ctx.sock.sendMessage(ctx.from, { text: caption }, { quoted: ctx.msg });
  }
};
commands.help = commands.menu;

// ─── PING WITH ANIMATION ──────────────────────────────────────
commands.ping = async function(ctx) {
  const start = Date.now();
  const sent = await ctx.sock.sendMessage(ctx.from, { text: '🏓 Pinging...\n0%' }, { quoted: ctx.msg });
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    const percent = i * 10;
    const bar = '█'.repeat(i) + '░'.repeat(steps - i);
    const text = `🏓 Pinging...\n${bar}  ${percent}%`;
    await ctx.sock.sendMessage(ctx.from, { text, edit: sent.key });
    await new Promise(r => setTimeout(r, 150));
  }
  const ms = Date.now() - start;
  const final = `🏓 Pong!\nSpeed: ${ms}ms\nUptime: ${uptime()}`;
  await ctx.sock.sendMessage(ctx.from, { text: final, edit: sent.key });
};

commands.runtime = commands.uptime = async function(ctx) {
  await reply(ctx, '⏱️ Uptime: ' + uptime());
};

commands.alive = async function(ctx) {
  await reply(ctx, '✅ I am alive!\nUptime: ' + uptime());
};

commands.owner = async function(ctx) {
  await reply(ctx, '👑 Owner: Session Owner\n📱 Bot: SONXX LITE MAIN DEV');
};

commands.profile = async function(ctx) {
  await reply(ctx, '👤 User: ' + ctx.sender + '\n📱 Bot: SONXX LITE MAIN DEV');
};

commands.support = commands.feedback = async function(ctx) {
  await reply(ctx, '💬 Support: https://whatsapp.com/channel/0029Vb8fAvuIXnltjmHYm31j');
};

commands.stats = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  const sessions = Object.keys(state.sockets || {}).length;
  await reply(ctx, '📊 *Stats*\nUptime: ' + uptime() + '\nRAM: ' + mem + ' MB\nSessions: ' + sessions);
};

commands.restart = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  await reply(ctx, '🔄 Restarting...');
  setTimeout(() => process.exit(0), 1000);
};

commands.broadcast = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .broadcast <message>');
  const jids = Array.from(state.knownJids || []);
  if (!jids.length) return reply(ctx, '❌ No known DMs.');
  let sent = 0;
  for (const jid of jids) {
    try {
      await ctx.sock.sendMessage(jid, { text: '📢 *Broadcast*\n' + ctx.q });
      sent++;
    } catch {}
  }
  await reply(ctx, '✅ Sent to ' + sent + ' chats.');
};

commands.setprefix = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .setprefix <new_prefix>');
  const newPrefix = ctx.q.trim();
  if (newPrefix.length > 5) return reply(ctx, '❌ Prefix too long.');
  cfg.PREFIX = newPrefix;
  try {
    const configPath = path.join(__dirname, '../config.js');
    let content = fs.readFileSync(configPath, 'utf8');
    content = content.replace(/PREFIX: '[^']*'/, `PREFIX: '${newPrefix}'`);
    fs.writeFileSync(configPath, content);
  } catch {}
  await reply(ctx, '✅ Prefix changed to: ' + newPrefix);
};

commands.public = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  cfg.MODE = 'public';
  await reply(ctx, '✅ Mode set to: public');
};

commands.private = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  cfg.MODE = 'private';
  await reply(ctx, '✅ Mode set to: private');
};

commands.setname = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .setname <name>');
  cfg.BOT_NAME = ctx.q;
  await reply(ctx, '✅ Bot name set to: ' + ctx.q);
};

commands.setalive = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .setalive <text>');
  global.aliveMsg = ctx.q;
  await reply(ctx, '✅ Alive message set.');
};

commands.setowner = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .setowner <number>');
  cfg.OWNER = ctx.q.replace(/[^0-9]/g, '');
  await reply(ctx, '✅ Owner set to: ' + cfg.OWNER);
};

commands.block = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user.');
  try {
    await ctx.sock.updateBlockStatus(mention, 'block');
    await reply(ctx, '✅ Blocked @' + mention.split('@')[0]);
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.unblock = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user.');
  try {
    await ctx.sock.updateBlockStatus(mention, 'unblock');
    await reply(ctx, '✅ Unblocked @' + mention.split('@')[0]);
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.getpp = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    const pp = await ctx.sock.profilePictureUrl(ctx.sock.user.id, 'image');
    await ctx.sock.sendMessage(ctx.from, { image: { url: pp }, caption: '📸 Profile picture' }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ No profile picture found.');
  }
};

commands.pinchat = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    await ctx.sock.pinChat(ctx.from, true);
    await reply(ctx, '✅ Chat pinned.');
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.unpinchat = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  try {
    await ctx.sock.pinChat(ctx.from, false);
    await reply(ctx, '✅ Chat unpinned.');
  } catch {
    await reply(ctx, '❌ Failed.');
  }
};

commands.autotyping = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  state.autoTyping = !state.autoTyping;
  await reply(ctx, '✅ Auto-typing: ' + (state.autoTyping ? 'ON' : 'OFF'));
};

commands.autorecording = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  // Toggle recording
  await reply(ctx, '✅ Auto-recording toggled.');
};

commands.autoread = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  state.autoRead = !state.autoRead;
  await reply(ctx, '✅ Auto-read: ' + (state.autoRead ? 'ON' : 'OFF'));
};

commands.autoviewstatus = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const onoff = ctx.args[0]?.toLowerCase();
  if (onoff === 'on') {
    state.autoStatusView = true;
    await reply(ctx, '✅ Auto-view status: ON');
  } else if (onoff === 'off') {
    state.autoStatusView = false;
    await reply(ctx, '✅ Auto-view status: OFF');
  } else {
    await reply(ctx, 'Usage: .autoviewstatus on/off');
  }
};

commands.alwaysonline = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  state.alwaysOnline = !state.alwaysOnline;
  await reply(ctx, '✅ Always online: ' + (state.alwaysOnline ? 'ON' : 'OFF'));
};

commands.autoreact = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  state.autoReact = !state.autoReact;
  await reply(ctx, '✅ Auto-react: ' + (state.autoReact ? 'ON' : 'OFF'));
};

commands.anticall = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const onoff = ctx.args[0]?.toLowerCase();
  if (onoff === 'on') {
    state.antiCall = true;
    await reply(ctx, '✅ Anti-call: ON');
  } else if (onoff === 'off') {
    state.antiCall = false;
    await reply(ctx, '✅ Anti-call: OFF');
  } else {
    await reply(ctx, 'Usage: .anticall on/off');
  }
};

commands.setmenuimage = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .setmenuimage <url>');
  global.menuImage = ctx.q;
  await reply(ctx, '✅ Menu image set to: ' + ctx.q);
};

commands.leave = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.isGroup) return reply(ctx, '❌ This is not a group.');
  try {
    await ctx.sock.groupLeave(ctx.from);
    await reply(ctx, '✅ Left the group.');
  } catch {
    await reply(ctx, '❌ Failed to leave.');
  }
};

commands.join = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  if (!ctx.q) return reply(ctx, 'Usage: .join <group_link>');
  try {
    const code = ctx.q.split('/').pop();
    await ctx.sock.groupAcceptInvite(code);
    await reply(ctx, '✅ Joined the group.');
  } catch {
    await reply(ctx, '❌ Failed to join.');
  }
};

commands.totalcmd = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const commandsCount = Object.keys(commands).length;
  await reply(ctx, '📊 Total commands: ' + commandsCount);
};

module.exports = commands;
