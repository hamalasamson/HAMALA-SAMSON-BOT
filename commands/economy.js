const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '../data');
const ECONOMY_FILE = path.join(DATA_DIR, 'economy.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadEconomy() {
  try {
    return JSON.parse(fs.readFileSync(ECONOMY_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveEconomy(data) {
  fs.writeFileSync(ECONOMY_FILE, JSON.stringify(data, null, 2));
}

function getBalance(user, data) {
  return data[user] || { balance: 0, daily: 0, lastDaily: 0, inventory: [] };
}

function setBalance(user, balance, data) {
  if (!data[user]) data[user] = { balance: 0, daily: 0, lastDaily: 0, inventory: [] };
  data[user].balance = balance;
  saveEconomy(data);
}

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const commands = {};

commands.economy = async function(ctx) {
  if (!ctx.owner) return reply(ctx, '❌ Owner only.');
  const mode = ctx.args[0]?.toLowerCase();
  if (mode === 'on') {
    global.economy = true;
    await reply(ctx, '✅ Economy: ON');
  } else if (mode === 'off') {
    global.economy = false;
    await reply(ctx, '✅ Economy: OFF');
  } else {
    await reply(ctx, 'Usage: .economy on/off');
  }
};

commands.bal = commands.balance = commands.wallet = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const data = loadEconomy();
  const user = ctx.sender + '@s.whatsapp.net';
  const userData = getBalance(user, data);
  await reply(ctx, '💰 *Balance*\nUser: @' + ctx.sender + '\nBalance: $' + userData.balance + '\nDaily Streak: ' + (userData.daily || 0), { mentions: [user] });
};

commands.daily = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const data = loadEconomy();
  const user = ctx.sender + '@s.whatsapp.net';
  const userData = getBalance(user, data);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (now - userData.lastDaily < day) {
    const remaining = Math.ceil((day - (now - userData.lastDaily)) / (60 * 1000));
    return reply(ctx, '⏳ Daily already claimed. Next in ' + remaining + ' minutes.');
  }
  const amount = 100 + Math.floor(Math.random() * 100);
  userData.balance += amount;
  userData.daily = (userData.daily || 0) + 1;
  userData.lastDaily = now;
  data[user] = userData;
  saveEconomy(data);
  await reply(ctx, '🎉 Daily claimed!\n+$' + amount + '\nBalance: $' + userData.balance);
};

commands.work = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const data = loadEconomy();
  const user = ctx.sender + '@s.whatsapp.net';
  const userData = getBalance(user, data);
  const jobs = ['Developer', 'Designer', 'Writer', 'Teacher', 'Chef', 'Driver', 'Doctor', 'Engineer'];
  const job = pick(jobs);
  const amount = 50 + Math.floor(Math.random() * 150);
  userData.balance += amount;
  data[user] = userData;
  saveEconomy(data);
  await reply(ctx, '💼 You worked as a ' + job + '!\n+$' + amount + '\nBalance: $' + userData.balance);
};

commands.give = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user to give money.');
  const amount = parseInt(ctx.args[0]);
  if (isNaN(amount) || amount <= 0) return reply(ctx, '❌ Enter a valid amount.');
  const data = loadEconomy();
  const sender = ctx.sender + '@s.whatsapp.net';
  const senderData = getBalance(sender, data);
  if (senderData.balance < amount) return reply(ctx, '❌ Insufficient balance.');
  const receiverData = getBalance(mention, data);
  senderData.balance -= amount;
  receiverData.balance += amount;
  data[sender] = senderData;
  data[mention] = receiverData;
  saveEconomy(data);
  await ctx.sock.sendMessage(ctx.from, { text: '✅ Gave $' + amount + ' to @' + mention.split('@')[0], mentions: [mention] }, { quoted: ctx.msg });
};

commands.rob = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user to rob.');
  const data = loadEconomy();
  const sender = ctx.sender + '@s.whatsapp.net';
  const senderData = getBalance(sender, data);
  const targetData = getBalance(mention, data);
  if (targetData.balance <= 0) return reply(ctx, '❌ Target has no money to rob.');
  const success = Math.random() < 0.4;
  if (success) {
    const amount = Math.floor(targetData.balance * (0.1 + Math.random() * 0.3));
    senderData.balance += amount;
    targetData.balance -= amount;
    data[sender] = senderData;
    data[mention] = targetData;
    saveEconomy(data);
    await ctx.sock.sendMessage(ctx.from, { text: '🦹 Robbed $' + amount + ' from @' + mention.split('@')[0] + '!', mentions: [mention] }, { quoted: ctx.msg });
  } else {
    const penalty = 20 + Math.floor(Math.random() * 50);
    senderData.balance -= penalty;
    data[sender] = senderData;
    saveEconomy(data);
    await reply(ctx, '❌ Robbing failed! You got caught and lost $' + penalty);
  }
};

commands.gamble = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const amount = parseInt(ctx.q);
  if (isNaN(amount) || amount <= 0) return reply(ctx, '❌ Usage: .gamble <amount>');
  const data = loadEconomy();
  const user = ctx.sender + '@s.whatsapp.net';
  const userData = getBalance(user, data);
  if (userData.balance < amount) return reply(ctx, '❌ Insufficient balance.');
  const win = Math.random() < 0.45;
  if (win) {
    const winnings = amount * (1 + Math.floor(Math.random() * 3));
    userData.balance += winnings;
    data[user] = userData;
    saveEconomy(data);
    await reply(ctx, '🎰 You won $' + winnings + '! Balance: $' + userData.balance);
  } else {
    userData.balance -= amount;
    data[user] = userData;
    saveEconomy(data);
    await reply(ctx, '❌ You lost $' + amount + '. Balance: $' + userData.balance);
  }
};

commands.lb = commands.leaderboard = async function(ctx) {
  const data = loadEconomy();
  const sorted = Object.entries(data).sort((a, b) => b[1].balance - a[1].balance).slice(0, 10);
  if (!sorted.length) return reply(ctx, '❌ No users found.');
  let msg = '🏆 *Leaderboard*\n';
  sorted.forEach(([user, info], i) => {
    msg += (i+1) + '. @' + user.split('@')[0] + ' - $' + info.balance + '\n';
  });
  const mentions = sorted.map(([user]) => user);
  await ctx.sock.sendMessage(ctx.from, { text: msg, mentions }, { quoted: ctx.msg });
};

commands.shop = async function(ctx) {
  const items = [
    { name: '🍕 Pizza', price: 50 },
    { name: '🍔 Burger', price: 30 },
    { name: '☕ Coffee', price: 15 },
    { name: '🎫 Lottery Ticket', price: 100 },
    { name: '📱 Phone', price: 500 },
    { name: '💎 Diamond', price: 1000 }
  ];
  let msg = '🛒 *Shop*\n';
  items.forEach((item, i) => {
    msg += (i+1) + '. ' + item.name + ' - $' + item.price + '\n';
  });
  msg += '\nType .buy <item number>';
  await reply(ctx, msg);
};

commands.buy = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const items = [
    { name: 'Pizza', price: 50 },
    { name: 'Burger', price: 30 },
    { name: 'Coffee', price: 15 },
    { name: 'Lottery Ticket', price: 100 },
    { name: 'Phone', price: 500 },
    { name: 'Diamond', price: 1000 }
  ];
  const index = parseInt(ctx.q) - 1;
  if (isNaN(index) || index < 0 || index >= items.length) return reply(ctx, '❌ Invalid item number.');
  const item = items[index];
  const data = loadEconomy();
  const user = ctx.sender + '@s.whatsapp.net';
  const userData = getBalance(user, data);
  if (userData.balance < item.price) return reply(ctx, '❌ Insufficient balance.');
  userData.balance -= item.price;
  userData.inventory = userData.inventory || [];
  userData.inventory.push(item.name);
  data[user] = userData;
  saveEconomy(data);
  await reply(ctx, '✅ You bought ' + item.name + ' for $' + item.price + '!\nBalance: $' + userData.balance);
};

commands.inv = commands.inventory = async function(ctx) {
  const data = loadEconomy();
  const user = ctx.sender + '@s.whatsapp.net';
  const userData = getBalance(user, data);
  const inventory = userData.inventory || [];
  if (!inventory.length) return reply(ctx, '❌ Your inventory is empty.');
  let msg = '📦 *Inventory*\n';
  inventory.forEach((item, i) => {
    msg += (i+1) + '. ' + item + '\n';
  });
  await reply(ctx, msg);
};

commands.steal = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user to steal from.');
  const data = loadEconomy();
  const sender = ctx.sender + '@s.whatsapp.net';
  const senderData = getBalance(sender, data);
  const targetData = getBalance(mention, data);
  if (targetData.balance <= 0) return reply(ctx, '❌ Target has nothing to steal.');
  const success = Math.random() < 0.3;
  if (success) {
    const amount = Math.floor(targetData.balance * 0.2);
    senderData.balance += amount;
    targetData.balance -= amount;
    data[sender] = senderData;
    data[mention] = targetData;
    saveEconomy(data);
    await ctx.sock.sendMessage(ctx.from, { text: '🦹 Stole $' + amount + ' from @' + mention.split('@')[0] + '!', mentions: [mention] }, { quoted: ctx.msg });
  } else {
    await reply(ctx, '❌ Stealing failed! You were caught.');
  }
};

commands.crime = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const data = loadEconomy();
  const user = ctx.sender + '@s.whatsapp.net';
  const userData = getBalance(user, data);
  const success = Math.random() < 0.5;
  if (success) {
    const amount = 50 + Math.floor(Math.random() * 150);
    userData.balance += amount;
    data[user] = userData;
    saveEconomy(data);
    await reply(ctx, '🦹 You committed a crime and got away with $' + amount + '!');
  } else {
    const penalty = 30 + Math.floor(Math.random() * 70);
    userData.balance -= penalty;
    data[user] = userData;
    saveEconomy(data);
    await reply(ctx, '🚔 You got caught! Lost $' + penalty);
  }
};

commands.hunt = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const data = loadEconomy();
  const user = ctx.sender + '@s.whatsapp.net';
  const userData = getBalance(user, data);
  const animals = ['Deer', 'Rabbit', 'Bear', 'Wolf', 'Fox'];
  const animal = pick(animals);
  const amount = 20 + Math.floor(Math.random() * 100);
  userData.balance += amount;
  data[user] = userData;
  saveEconomy(data);
  await reply(ctx, '🏹 You hunted a ' + animal + ' and earned $' + amount + '!');
};

commands.fish = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const data = loadEconomy();
  const user = ctx.sender + '@s.whatsapp.net';
  const userData = getBalance(user, data);
  const fish = ['Salmon', 'Trout', 'Tuna', 'Cod', 'Bass'];
  const caught = pick(fish);
  const amount = 15 + Math.floor(Math.random() * 60);
  userData.balance += amount;
  data[user] = userData;
  saveEconomy(data);
  await reply(ctx, '🎣 You caught a ' + caught + ' and earned $' + amount + '!');
};

commands.mine = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const data = loadEconomy();
  const user = ctx.sender + '@s.whatsapp.net';
  const userData = getBalance(user, data);
  const ores = ['Coal', 'Iron', 'Gold', 'Diamond', 'Emerald'];
  const ore = pick(ores);
  const amount = 10 + Math.floor(Math.random() * 200);
  userData.balance += amount;
  data[user] = userData;
  saveEconomy(data);
  await reply(ctx, '⛏️ You mined ' + ore + ' and earned $' + amount + '!');
};

commands.level = async function(ctx) {
  const data = loadEconomy();
  const user = ctx.sender + '@s.whatsapp.net';
  const userData = getBalance(user, data);
  const level = Math.floor(userData.balance / 100) + 1;
  await reply(ctx, '📊 *Level*\nUser: @' + ctx.sender + '\nLevel: ' + level + '\nBalance: $' + userData.balance + '\nNext level: $' + (level * 100), { mentions: [user] });
};

commands.ecoinfo = async function(ctx) {
  await reply(ctx, '💰 *Economy Info*\n- Use .daily for daily rewards\n- Use .work to earn money\n- Use .rob to steal from others\n- Use .shop to buy items\n- Use .gamble to risk money\n- Use .lb to view leaderboard');
};

commands.bail = async function(ctx) {
  if (global.economy === false) return reply(ctx, '❌ Economy is disabled.');
  const data = loadEconomy();
  const user = ctx.sender + '@s.whatsapp.net';
  const userData = getBalance(user, data);
  const bailCost = 100;
  if (userData.balance < bailCost) return reply(ctx, '❌ You need $' + bailCost + ' for bail.');
  userData.balance -= bailCost;
  data[user] = userData;
  saveEconomy(data);
  await reply(ctx, '✅ You posted bail for $' + bailCost + '! Balance: $' + userData.balance);
};

module.exports = commands;
