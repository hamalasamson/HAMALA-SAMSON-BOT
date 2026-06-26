const https = require('https');
const cfg = require('../config');

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

async function askGroq(prompt, model) {
  return new Promise((resolve, reject) => {
    const key = cfg.GROQ_API_KEY;
    if (!key) return reject('No Groq API key. Get one at https://console.groq.com');
    const body = JSON.stringify({
      model: model || cfg.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    });
    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(parsed.error.message);
          resolve(parsed.choices[0].message.content.trim());
        } catch {
          reject('API response error.');
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Free image generation using Pollinations.ai
async function generateImage(prompt) {
  return new Promise((resolve) => {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;
    resolve(url);
  });
}

const commands = {};

commands.ai = commands.ask = commands.gpt = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .ai <question>');
  try {
    await reply(ctx, '⏳ Thinking...');
    const response = await askGroq(ctx.q);
    await reply(ctx, response);
  } catch (e) {
    await reply(ctx, '❌ AI error: ' + e);
  }
};

commands.copilot = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .copilot <question>');
  try {
    await reply(ctx, '⏳ Thinking...');
    const response = await askGroq(ctx.q);
    await reply(ctx, response);
  } catch (e) {
    await reply(ctx, '❌ Error: ' + e);
  }
};

commands.gemini = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .gemini <question>');
  try {
    await reply(ctx, '⏳ Thinking...');
    const response = await askGroq(ctx.q, 'gemma2-9b-it');
    await reply(ctx, response);
  } catch (e) {
    await reply(ctx, '❌ Error: ' + e);
  }
};

commands.claude = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .claude <question>');
  try {
    await reply(ctx, '⏳ Thinking...');
    const response = await askGroq(ctx.q);
    await reply(ctx, response);
  } catch (e) {
    await reply(ctx, '❌ Error: ' + e);
  }
};

commands.deepseek = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .deepseek <question>');
  try {
    await reply(ctx, '⏳ Thinking...');
    const response = await askGroq(ctx.q, 'deepseek-r1-distill-llama-70b');
    await reply(ctx, response);
  } catch (e) {
    await reply(ctx, '❌ Error: ' + e);
  }
};

commands.llama3 = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .llama3 <question>');
  try {
    await reply(ctx, '⏳ Thinking...');
    const response = await askGroq(ctx.q, 'llama-3.3-70b-versatile');
    await reply(ctx, response);
  } catch (e) {
    await reply(ctx, '❌ Error: ' + e);
  }
};

commands.mistral = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .mistral <question>');
  try {
    await reply(ctx, '⏳ Thinking...');
    const response = await askGroq(ctx.q, 'mixtral-8x7b-32768');
    await reply(ctx, response);
  } catch (e) {
    await reply(ctx, '❌ Error: ' + e);
  }
};

commands.codeai = commands.codegen = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .codeai <description>');
  try {
    await reply(ctx, '⏳ Generating code...');
    const response = await askGroq('Write code for: ' + ctx.q);
    await reply(ctx, response);
  } catch (e) {
    await reply(ctx, '❌ Error: ' + e);
  }
};

commands.imagine = commands.imagine_ai = commands.imagine2 = commands.sdimage = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .imagine <prompt>');
  try {
    await reply(ctx, '⏳ Generating image...');
    const imageUrl = await generateImage(ctx.q);
    await ctx.sock.sendMessage(ctx.from, { image: { url: imageUrl }, caption: '🎨 ' + ctx.q }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Image generation failed.');
  }
};

commands.flux = commands.fluxxmd = commands.pollinations = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .flux <prompt>');
  try {
    await reply(ctx, '⏳ Generating image...');
    const imageUrl = await generateImage(ctx.q);
    await ctx.sock.sendMessage(ctx.from, { image: { url: imageUrl }, caption: '✨ ' + ctx.q }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Image generation failed.');
  }
};

commands.genimage = commands.aiimage = commands.aiimage2 = commands.aigenimage = commands.gen = commands.generate = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .genimage <prompt>');
  try {
    await reply(ctx, '⏳ Generating image...');
    const imageUrl = await generateImage(ctx.q);
    await ctx.sock.sendMessage(ctx.from, { image: { url: imageUrl }, caption: '🖼️ ' + ctx.q }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Image generation failed.');
  }
};

commands.nanobananapro = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .nanobananapro <prompt>');
  try {
    await reply(ctx, '⏳ Generating image...');
    const imageUrl = await generateImage(ctx.q);
    await ctx.sock.sendMessage(ctx.from, { image: { url: imageUrl }, caption: '🍌 ' + ctx.q }, { quoted: ctx.msg });
  } catch {
    await reply(ctx, '❌ Image generation failed.');
  }
};

commands.chatbot = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mode = ctx.args[0]?.toLowerCase();
  if (mode === 'on') {
    state.chatbot = true;
    await reply(ctx, '✅ Chatbot: ON');
  } else if (mode === 'off') {
    state.chatbot = false;
    await reply(ctx, '✅ Chatbot: OFF');
  } else if (mode === 'clear') {
    state.aiHistory = {};
    await reply(ctx, '✅ Chat history cleared.');
  } else {
    await reply(ctx, 'Usage: .chatbot on/off/clear');
  }
};

commands['chatbot-private'] = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mode = ctx.args[0]?.toLowerCase();
  if (mode === 'on') {
    state.chatbotPrivate = true;
    await reply(ctx, '✅ Chatbot private: ON');
  } else if (mode === 'off') {
    state.chatbotPrivate = false;
    await reply(ctx, '✅ Chatbot private: OFF');
  } else {
    await reply(ctx, 'Usage: .chatbot-private on/off');
  }
};

module.exports = commands;
