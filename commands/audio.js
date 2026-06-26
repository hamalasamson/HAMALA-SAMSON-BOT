const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

async function applyAudioEffect(inputFile, outputFile, effect) {
  const cmd = `ffmpeg -i ${inputFile} ${effect} ${outputFile}`;
  await execPromise(cmd);
}

async function downloadAudio(ctx) {
  const msg = ctx.msg.message;
  if (!msg?.audioMessage && !msg?.videoMessage) {
    throw new Error('Reply to an audio or video message.');
  }
  const media = await ctx.sock.downloadMediaMessage(ctx.msg);
  const inputFile = '/tmp/audio_input_' + Date.now() + '.mp3';
  fs.writeFileSync(inputFile, media);
  return inputFile;
}

const commands = {};

// ─── BASS ──────────────────────────────────────────────────────
commands.bass = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/bass_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "bass=g=10,compand" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Bass effect failed: ' + e.message);
  }
};

// ─── BLOWN ────────────────────────────────────────────────────
commands.blown = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/blown_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "volume=3,compand" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Blown effect failed: ' + e.message);
  }
};

// ─── DEEP ──────────────────────────────────────────────────────
commands.deep = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/deep_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "atempo=0.8,asetrate=44100*0.8" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Deep effect failed: ' + e.message);
  }
};

// ─── ROBOT ────────────────────────────────────────────────────
commands.robot = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/robot_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "aecho=0.8:0.9:1000:0.3,aresample=24000" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Robot effect failed: ' + e.message);
  }
};

// ─── TINY ──────────────────────────────────────────────────────
commands.tiny = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/tiny_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "atempo=1.5,asetrate=44100*0.6" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Tiny effect failed: ' + e.message);
  }
};

// ─── CHIPMUNK ──────────────────────────────────────────────────
commands.chipmunk = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/chipmunk_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "atempo=1.8,asetrate=44100*0.5" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Chipmunk effect failed: ' + e.message);
  }
};

// ─── SLOWED ────────────────────────────────────────────────────
commands.slowed = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/slowed_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "atempo=0.7" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Slowed effect failed: ' + e.message);
  }
};

// ─── REVERB ────────────────────────────────────────────────────
commands.reverb = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/reverb_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "aecho=0.8:0.9:1000:0.3" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Reverb effect failed: ' + e.message);
  }
};

// ─── NIGHTCORE ──────────────────────────────────────────────────
commands.nightcore = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/nightcore_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "atempo=1.25,asetrate=44100*0.8,aecho=0.8:0.9:1000:0.3" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Nightcore effect failed: ' + e.message);
  }
};

// ─── EARRAPE ──────────────────────────────────────────────────
commands.earrape = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/earrape_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "volume=5,compand,aecho=0.8:0.9:1000:0.3" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Earrape effect failed: ' + e.message);
  }
};

// ─── ECHO ──────────────────────────────────────────────────────
commands.echo = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/echo_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "aecho=0.8:0.9:500:0.5" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Echo effect failed: ' + e.message);
  }
};

// ─── UNDERWATER ──────────────────────────────────────────────────
commands.underwater = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/underwater_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "lowpass=1000,highpass=200,compand" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Underwater effect failed: ' + e.message);
  }
};

// ─── TELEPHONE ──────────────────────────────────────────────────
commands.telephone = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/telephone_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "lowpass=3400,highpass=300,compand" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Telephone effect failed: ' + e.message);
  }
};

// ─── REVERSE ──────────────────────────────────────────────────
commands.reverse = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/reverse_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "areverse" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Reverse effect failed: ' + e.message);
  }
};

// ─── VAPORWAVE ──────────────────────────────────────────────────
commands.vaporwave = async function(ctx) {
  try {
    const inputFile = await downloadAudio(ctx);
    const outputFile = '/tmp/vaporwave_output_' + Date.now() + '.mp3';
    await applyAudioEffect(inputFile, outputFile, '-af "atempo=0.8,asetrate=44100*0.7,aecho=0.8:0.9:1000:0.3" -acodec mp3');
    const buffer = fs.readFileSync(outputFile);
    await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);
  } catch (e) {
    await reply(ctx, '❌ Vaporwave effect failed: ' + e.message);
  }
};

module.exports = commands;
