const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
const https = require('https');
const axios = require('axios');

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

async function downloadMedia(url, format, outputExt) {
  const outputFile = path.join('/tmp', Date.now() + '.' + outputExt);
  const cmd = `yt-dlp -f ${format} -o "${outputFile}" "${url}"`;
  await execPromise(cmd);
  return outputFile;
}

async function searchYoutube(query) {
  const cmd = `yt-dlp --default-search ytsearch "ytsearch1:${query}" --get-id --get-title`;
  const { stdout } = await execPromise(cmd);
  const lines = stdout.trim().split('\n');
  if (lines.length < 2) return null;
  return { id: lines[0].trim(), title: lines[1].trim() };
}

const commands = {};

// ─── YTMP3 ────────────────────────────────────────────────────
commands.ytmp3 = commands.ytaudio = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .ytmp3 <YouTube URL>');
  try {
    await reply(ctx, '⏳ Downloading audio...');
    const file = await downloadMedia(ctx.q, 'bestaudio', 'mp3');
    await ctx.sock.sendMessage(ctx.from, { audio: fs.readFileSync(file), mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Download failed: ' + e.message);
  }
};

// ─── YTMP4 ────────────────────────────────────────────────────
commands.ytmp4 = commands.ytvideo = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .ytmp4 <YouTube URL>');
  try {
    await reply(ctx, '⏳ Downloading video...');
    const file = await downloadMedia(ctx.q, 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', 'mp4');
    await ctx.sock.sendMessage(ctx.from, { video: fs.readFileSync(file) }, { quoted: ctx.msg });
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Download failed: ' + e.message);
  }
};

// ─── YTSEARCH ──────────────────────────────────────────────────
commands.ytsearch = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .ytsearch <query>');
  try {
    const cmd = `yt-dlp --default-search ytsearch "ytsearch10:${ctx.q}" --get-title --get-id --get-duration | paste - - -`;
    const { stdout } = await execPromise(cmd);
    if (!stdout.trim()) return reply(ctx, '❌ No results.');
    const lines = stdout.trim().split('\n');
    let msg = '🎵 *YouTube Search*\n';
    lines.forEach((line, i) => {
      const parts = line.split('\t');
      if (parts.length === 3) {
        msg += (i+1) + '. ' + parts[0] + '\n';
      }
    });
    await reply(ctx, msg);
  } catch {
    await reply(ctx, '❌ Search failed.');
  }
};

// ─── TIKTOK ────────────────────────────────────────────────────
commands.tiktok = commands.tt = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .tiktok <URL>');
  try {
    await reply(ctx, '⏳ Downloading TikTok...');
    const file = await downloadMedia(ctx.q, 'best', 'mp4');
    await ctx.sock.sendMessage(ctx.from, { video: fs.readFileSync(file) }, { quoted: ctx.msg });
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Download failed: ' + e.message);
  }
};

// ─── TIKTOKMP3 ─────────────────────────────────────────────────
commands.tiktokmp3 = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .tiktokmp3 <URL>');
  try {
    await reply(ctx, '⏳ Downloading audio...');
    const file = await downloadMedia(ctx.q, 'bestaudio', 'mp3');
    await ctx.sock.sendMessage(ctx.from, { audio: fs.readFileSync(file), mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Download failed: ' + e.message);
  }
};

// ─── TIKTOKIMG ─────────────────────────────────────────────────
commands.tiktokimg = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .tiktokimg <TikTok URL>');
  try {
    await reply(ctx, '⏳ Downloading image...');
    const file = await downloadMedia(ctx.q, 'best[ext=jpg]', 'jpg');
    await ctx.sock.sendMessage(ctx.from, { image: fs.readFileSync(file), caption: '📸 TikTok Image' }, { quoted: ctx.msg });
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Download failed: ' + e.message);
  }
};

// ─── TTSEARCH ──────────────────────────────────────────────────
commands.ttsearch = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .ttsearch <query>');
  try {
    // Use yt-dlp to search TikTok (limited)
    const cmd = `yt-dlp --default-search tiktok "tiktoksearch:${ctx.q}" --get-title --get-id | head -5`;
    const { stdout } = await execPromise(cmd);
    if (!stdout.trim()) return reply(ctx, '❌ No results.');
    const lines = stdout.trim().split('\n');
    let msg = '🎵 *TikTok Search*\n';
    lines.forEach((line, i) => {
      if (line.trim()) {
        msg += (i+1) + '. ' + line.trim() + '\n';
      }
    });
    await reply(ctx, msg);
  } catch {
    await reply(ctx, '❌ Search failed.');
  }
};

// ─── IGDL ──────────────────────────────────────────────────────
commands.ig = commands.igdl = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .igdl <Instagram URL>');
  try {
    await reply(ctx, '⏳ Downloading Instagram...');
    const file = await downloadMedia(ctx.q, 'best', 'mp4');
    await ctx.sock.sendMessage(ctx.from, { video: fs.readFileSync(file) }, { quoted: ctx.msg });
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Download failed: ' + e.message);
  }
};

// ─── FBDL ──────────────────────────────────────────────────────
commands.fbdl = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .fbdl <Facebook URL>');
  try {
    await reply(ctx, '⏳ Downloading Facebook...');
    const file = await downloadMedia(ctx.q, 'best', 'mp4');
    await ctx.sock.sendMessage(ctx.from, { video: fs.readFileSync(file) }, { quoted: ctx.msg });
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Download failed: ' + e.message);
  }
};

// ─── PLAY ──────────────────────────────────────────────────────
commands.play = commands.song = commands.music = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .play <song name>');
  try {
    await reply(ctx, '⏳ Searching and downloading...');
    const searchQuery = encodeURIComponent(ctx.q);
    const cmd = `yt-dlp -f bestaudio -o "/tmp/%(title)s.%(ext)s" "ytsearch:${searchQuery}"`;
    await execPromise(cmd);
    const files = fs.readdirSync('/tmp').filter(f => f.endsWith('.mp3') || f.endsWith('.m4a'));
    const latest = files.sort((a,b) => fs.statSync('/tmp/'+a).mtime - fs.statSync('/tmp/'+b).mtime).pop();
    if (!latest) return reply(ctx, '❌ No song found.');
    const filePath = path.join('/tmp', latest);
    await ctx.sock.sendMessage(ctx.from, { audio: fs.readFileSync(filePath), mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(filePath);
  } catch (e) {
    await reply(ctx, '❌ Play failed: ' + e.message);
  }
};

// ─── SPOTIFYDL ──────────────────────────────────────────────────
commands.spotifydl = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .spotifydl <song_name or Spotify URL>');
  try {
    await reply(ctx, '⏳ Searching Spotify...');
    
    // If it's a Spotify URL, extract the ID
    let query = ctx.q;
    if (query.includes('spotify.com')) {
      const match = query.match(/track\/([a-zA-Z0-9]+)/);
      if (match) {
        query = match[1];
      }
    }
    
    // Search YouTube for the song
    const searchCmd = `yt-dlp --default-search ytsearch "ytsearch1:${query} audio" --get-id --get-title`;
    const { stdout } = await execPromise(searchCmd);
    const lines = stdout.trim().split('\n');
    if (lines.length < 2) return reply(ctx, '❌ No matching song found.');
    
    const title = lines[1].trim();
    await reply(ctx, `⏳ Found: ${title}\nDownloading audio...`);
    
    const cmd = `yt-dlp -f bestaudio -o "/tmp/spotify_%(title)s.%(ext)s" "ytsearch:${query}"`;
    await execPromise(cmd);
    
    const files = fs.readdirSync('/tmp').filter(f => f.startsWith('spotify_') && (f.endsWith('.mp3') || f.endsWith('.m4a')));
    const latest = files.sort((a,b) => fs.statSync('/tmp/'+a).mtime - fs.statSync('/tmp/'+b).mtime).pop();
    if (!latest) return reply(ctx, '❌ No song found.');
    
    const filePath = path.join('/tmp', latest);
    await ctx.sock.sendMessage(ctx.from, { audio: fs.readFileSync(filePath), mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(filePath);
  } catch (e) {
    await reply(ctx, '❌ Spotify download failed: ' + e.message);
  }
};

// ─── SERIESDL ──────────────────────────────────────────────────
commands.seriesdl = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .seriesdl <series_name> <season> <episode>\nExample: .seriesdl Game of Thrones 1 1');
  
  const parts = ctx.q.split(' ');
  if (parts.length < 3) return reply(ctx, '❌ Need: series_name season episode');
  
  const seriesName = parts.slice(0, -2).join(' ');
  const season = parts[parts.length - 2];
  const episode = parts[parts.length - 1];
  
  try {
    await reply(ctx, `⏳ Searching for ${seriesName} S${season}E${episode}...`);
    
    const searchQuery = `${seriesName} S${season}E${episode}`;
    const cmd = `yt-dlp -f best[ext=mp4] -o "/tmp/series_%(title)s.%(ext)s" "ytsearch:${searchQuery}"`;
    await execPromise(cmd);
    
    const files = fs.readdirSync('/tmp').filter(f => f.startsWith('series_') && f.endsWith('.mp4'));
    const latest = files.sort((a,b) => fs.statSync('/tmp/'+a).mtime - fs.statSync('/tmp/'+b).mtime).pop();
    if (!latest) return reply(ctx, '❌ No video found.');
    
    const filePath = path.join('/tmp', latest);
    await ctx.sock.sendMessage(ctx.from, { video: fs.readFileSync(filePath), caption: `${seriesName} S${season}E${episode}` }, { quoted: ctx.msg });
    fs.unlinkSync(filePath);
  } catch (e) {
    await reply(ctx, '❌ Series download failed: ' + e.message);
  }
};

// ─── MOVIE_DL ──────────────────────────────────────────────────
commands.movie_dl = commands.moviedl = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .moviedl <movie_name>\nExample: .moviedl Inception');
  
  try {
    await reply(ctx, `⏳ Searching for ${ctx.q}...`);
    
    const cmd = `yt-dlp -f best[ext=mp4] -o "/tmp/movie_%(title)s.%(ext)s" "ytsearch:${ctx.q} movie"`;
    await execPromise(cmd);
    
    const files = fs.readdirSync('/tmp').filter(f => f.startsWith('movie_') && f.endsWith('.mp4'));
    const latest = files.sort((a,b) => fs.statSync('/tmp/'+a).mtime - fs.statSync('/tmp/'+b).mtime).pop();
    if (!latest) return reply(ctx, '❌ No movie found.');
    
    const filePath = path.join('/tmp', latest);
    await ctx.sock.sendMessage(ctx.from, { video: fs.readFileSync(filePath), caption: `🎬 ${ctx.q}` }, { quoted: ctx.msg });
    fs.unlinkSync(filePath);
  } catch (e) {
    await reply(ctx, '❌ Movie download failed: ' + e.message);
  }
};

// ─── TW ──────────────────────────────────────────────────────
commands.tw = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .tw <Twitter/X URL>');
  try {
    await reply(ctx, '⏳ Downloading...');
    const file = await downloadMedia(ctx.q, 'best', 'mp4');
    await ctx.sock.sendMessage(ctx.from, { video: fs.readFileSync(file) }, { quoted: ctx.msg });
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Download failed: ' + e.message);
  }
};

// ─── PINDL ──────────────────────────────────────────────────────
commands.pintdl = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .pintdl <Pinterest URL>');
  try {
    await reply(ctx, '⏳ Downloading...');
    const file = await downloadMedia(ctx.q, 'best', 'mp4');
    await ctx.sock.sendMessage(ctx.from, { video: fs.readFileSync(file) }, { quoted: ctx.msg });
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Download failed: ' + e.message);
  }
};

// ─── DLALL ──────────────────────────────────────────────────────
commands.dlall = commands.downloadall = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .dlall <URL>');
  try {
    await reply(ctx, '⏳ Downloading all content...');
    const file = await downloadMedia(ctx.q, 'best', 'mp4');
    await ctx.sock.sendMessage(ctx.from, { video: fs.readFileSync(file) }, { quoted: ctx.msg });
    fs.unlinkSync(file);
  } catch (e) {
    await reply(ctx, '❌ Download failed: ' + e.message);
  }
};

// ─── SCDLSEARCH ─────────────────────────────────────────────────
commands.scdlsearch = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .scdlsearch <song>');
  try {
    const cmd = `yt-dlp --default-search soundcloud "scsearch:${ctx.q}" --get-title --get-id | head -5`;
    const { stdout } = await execPromise(cmd);
    if (!stdout.trim()) return reply(ctx, '❌ No results.');
    const lines = stdout.trim().split('\n');
    let msg = '🎵 *SoundCloud Search*\n';
    lines.forEach((line, i) => {
      if (line.trim()) {
        msg += (i+1) + '. ' + line.trim() + '\n';
      }
    });
    await reply(ctx, msg);
  } catch {
    await reply(ctx, '❌ Search failed.');
  }
};

// ─── APK ──────────────────────────────────────────────────────
commands.apk = commands.apkdl = commands.apkdownload = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .apk <app_name>\nExample: .apk WhatsApp');
  await reply(ctx, `📱 Searching for ${ctx.q}...\nVisit https://apkcombo.com/search/?q=${encodeURIComponent(ctx.q)}`);
};

// ─── FILM / MOVIE2 ──────────────────────────────────────────────
commands.film = commands.movie2 = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .movie2 <title>\nExample: .movie2 Inception');
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(ctx.q)}`);
    if (!response.data.results || response.data.results.length === 0) {
      return reply(ctx, `❌ No movie found for "${ctx.q}".`);
    }
    const movie = response.data.results[0];
    let msg = `🎬 *${movie.title}*\n`;
    msg += `📅 Year: ${movie.release_date?.split('-')[0] || 'Unknown'}\n`;
    msg += `⭐ Rating: ${movie.vote_average}/10 (${movie.vote_count} votes)\n`;
    msg += `📖 Overview: ${movie.overview?.slice(0, 200) || 'No description'}\n`;
    await reply(ctx, msg);
  } catch {
    await reply(ctx, '❌ Movie search failed.');
  }
};

// ─── TRENDING ──────────────────────────────────────────────────
commands.trending = async function(ctx) {
  try {
    const cmd = `yt-dlp --default-search ytsearch "ytsearch10:trending music" --get-title --get-id | head -10`;
    const { stdout } = await execPromise(cmd);
    if (!stdout.trim()) return reply(ctx, '❌ No trending songs.');
    const lines = stdout.trim().split('\n');
    let msg = '🔥 *Trending Songs*\n';
    lines.forEach((line, i) => {
      if (line.trim()) {
        msg += (i+1) + '. ' + line.trim() + '\n';
      }
    });
    await reply(ctx, msg);
  } catch {
    await reply(ctx, '❌ Failed to fetch trending.');
  }
};

module.exports = commands;
