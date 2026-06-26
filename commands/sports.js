const axios = require('axios');

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

// ─── API-FOOTBALL KEY ──────────────────────────────────────────
// You need to get a free API key from: https://www.api-football.com/
// Free tier: 100 requests/day
const API_KEY = '3e6fc67611e1a0c52d59b53f46104f87';
const BASE_URL = 'https://v3.football.api-sports.io';

async function apiRequest(endpoint, params = {}) {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      },
      params: params
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw new Error('Sports API error: ' + error.message);
  }
}

function getLeagueId(leagueName) {
  const leagues = {
    'premier league': 39,
    'laliga': 140,
    'serie a': 135,
    'bundesliga': 78,
    'ligue 1': 61,
    'eredivisie': 88,
    'primeira liga': 94,
    'champions league': 2,
    'europa league': 3,
    'world cup': 1,
    'fa cup': 45,
    'copa america': 10,
    'euro': 4
  };
  return leagues[leagueName.toLowerCase()] || null;
}

const commands = {};

// ─── LIVESCORE ────────────────────────────────────────────────────
commands.livescore = async function(ctx) {
  try {
    await reply(ctx, '⏳ Fetching live scores...');
    
    const response = await apiRequest('/fixtures', { 
      live: 'all',
      timezone: 'Africa/Nairobi'
    });
    
    if (!response.response || response.response.length === 0) {
      return reply(ctx, '⚽ No live matches at the moment.');
    }
    
    const matches = response.response.slice(0, 10);
    let msg = '⚽ *LIVE SCORES*\n\n';
    
    matches.forEach(match => {
      const home = match.teams.home.name;
      const away = match.teams.away.name;
      const homeScore = match.goals.home ?? 0;
      const awayScore = match.goals.away ?? 0;
      const status = match.fixture.status.short;
      const time = match.fixture.status.elapsed || '0';
      
      let statusEmoji = '⏳';
      if (status === 'FT') statusEmoji = '✅';
      else if (status === 'HT') statusEmoji = '⏸️';
      else if (status === 'PST') statusEmoji = '⏰';
      
      msg += `*${home}* ${homeScore} - ${awayScore} *${away}*\n`;
      msg += `   ${statusEmoji} ${time}' ${status}\n\n`;
    });
    
    msg += '_Matches update automatically._';
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch live scores: ' + error.message);
  }
};

// ─── SCORES ──────────────────────────────────────────────────────
commands.scores = async function(ctx) {
  try {
    const leagueName = ctx.q || 'Premier League';
    const leagueId = getLeagueId(leagueName);
    
    if (!leagueId) {
      return reply(ctx, `❌ League not found. Try: Premier League, LaLiga, Serie A, Bundesliga, Ligue 1, Champions League`);
    }
    
    await reply(ctx, `⏳ Fetching scores for ${leagueName}...`);
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    const response = await apiRequest('/fixtures', { 
      league: leagueId,
      season: today.getFullYear(),
      date: dateStr
    });
    
    if (!response.response || response.response.length === 0) {
      return reply(ctx, `📅 No matches for ${leagueName} today.`);
    }
    
    const matches = response.response.slice(0, 15);
    let msg = `⚽ *${leagueName} SCORES*\n📅 ${dateStr}\n\n`;
    
    matches.forEach(match => {
      const home = match.teams.home.name;
      const away = match.teams.away.name;
      const homeScore = match.goals.home ?? '-';
      const awayScore = match.goals.away ?? '-';
      const status = match.fixture.status.short;
      const time = match.fixture.status.elapsed || '';
      
      msg += `*${home}* ${homeScore} - ${awayScore} *${away}*\n`;
      if (time) msg += `   ⏱️ ${time}' ${status}\n`;
      msg += '\n';
    });
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch scores: ' + error.message);
  }
};

// ─── FIXTURES ────────────────────────────────────────────────────
commands.fixtures = async function(ctx) {
  try {
    const leagueName = ctx.q || 'Premier League';
    const leagueId = getLeagueId(leagueName);
    
    if (!leagueId) {
      return reply(ctx, `❌ League not found. Try: Premier League, LaLiga, Serie A, Bundesliga, Ligue 1`);
    }
    
    await reply(ctx, `⏳ Fetching fixtures for ${leagueName}...`);
    
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    
    const response = await apiRequest('/fixtures', { 
      league: leagueId,
      season: today.getFullYear(),
      date: dateStr
    });
    
    if (!response.response || response.response.length === 0) {
      return reply(ctx, `📅 No upcoming fixtures for ${leagueName} in the next 7 days.`);
    }
    
    const matches = response.response.slice(0, 15);
    let msg = `📅 *${leagueName} FIXTURES*\n📆 ${dateStr}\n\n`;
    
    matches.forEach(match => {
      const home = match.teams.home.name;
      const away = match.teams.away.name;
      const time = match.fixture.date;
      const date = new Date(time);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      msg += `*${home}* vs *${away}*\n`;
      msg += `   🕐 ${timeStr}\n\n`;
    });
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch fixtures: ' + error.message);
  }
};

// ─── STANDINGS / TABLE ─────────────────────────────────────────
commands.standings = commands.table = async function(ctx) {
  try {
    const leagueName = ctx.q || 'Premier League';
    const leagueId = getLeagueId(leagueName);
    
    if (!leagueId) {
      return reply(ctx, `❌ League not found. Try: Premier League, LaLiga, Serie A, Bundesliga, Ligue 1`);
    }
    
    await reply(ctx, `⏳ Fetching standings for ${leagueName}...`);
    
    const response = await apiRequest('/standings', { 
      league: leagueId,
      season: new Date().getFullYear()
    });
    
    if (!response.response || response.response.length === 0) {
      return reply(ctx, `❌ No standings found for ${leagueName}.`);
    }
    
    const standings = response.response[0].league.standings[0];
    let msg = `🏆 *${leagueName} STANDINGS*\n\n`;
    
    const topTeams = standings.slice(0, 10);
    topTeams.forEach((team, index) => {
      const pos = team.rank;
      const name = team.team.name;
      const points = team.points;
      const played = team.all.played;
      const wins = team.all.win;
      const draws = team.all.draw;
      const losses = team.all.lose;
      const goalsFor = team.all.goals.for;
      const goalsAgainst = team.all.goals.against;
      const gd = goalsFor - goalsAgainst;
      
      let medal = '';
      if (pos === 1) medal = '🏆 ';
      else if (pos === 2) medal = '🥈 ';
      else if (pos === 3) medal = '🥉 ';
      
      msg += `${medal}*${pos}.* ${name} - ${points}pts\n`;
      msg += `   P:${played} W:${wins} D:${draws} L:${losses} GD:${gd}\n\n`;
    });
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch standings: ' + error.message);
  }
};

// ─── TEAM ────────────────────────────────────────────────────────
commands.team = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .team <team_name>\nExample: .team Manchester United');
  
  try {
    await reply(ctx, `⏳ Searching for ${ctx.q}...`);
    
    const response = await apiRequest('/teams', { 
      search: ctx.q
    });
    
    if (!response.response || response.response.length === 0) {
      return reply(ctx, `❌ Team "${ctx.q}" not found.`);
    }
    
    const team = response.response[0].team;
    const venue = response.response[0].venue;
    
    let msg = `⚽ *${team.name}*\n`;
    msg += `🏷️ Country: ${team.country}\n`;
    msg += `🏷️ Founded: ${team.founded || 'Unknown'}\n`;
    if (venue) {
      msg += `🏟️ Stadium: ${venue.name}\n`;
      msg += `📍 City: ${venue.city || 'Unknown'}\n`;
      msg += `🪑 Capacity: ${venue.capacity || 'Unknown'}\n`;
    }
    msg += `🔗 ID: ${team.id}\n`;
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch team info: ' + error.message);
  }
};

// ─── PLAYER ──────────────────────────────────────────────────────
commands.player = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .player <player_name>\nExample: .player Lionel Messi');
  
  try {
    await reply(ctx, `⏳ Searching for ${ctx.q}...`);
    
    const response = await apiRequest('/players', { 
      search: ctx.q,
      season: new Date().getFullYear()
    });
    
    if (!response.response || response.response.length === 0) {
      return reply(ctx, `❌ Player "${ctx.q}" not found.`);
    }
    
    const player = response.response[0];
    const p = player.player;
    const stats = player.statistics[0] || {};
    
    let msg = `⚽ *${p.name}*\n`;
    msg += `🏷️ Nationality: ${p.nationality || 'Unknown'}\n`;
    msg += `🎂 Age: ${p.age || 'Unknown'}\n`;
    msg += `📏 Height: ${p.height || 'Unknown'}\n`;
    msg += `⚖️ Weight: ${p.weight || 'Unknown'}\n`;
    msg += `🔢 Number: ${stats.squad?.number || 'Unknown'}\n`;
    msg += `📍 Position: ${stats.games?.position || 'Unknown'}\n`;
    if (stats.goals) {
      msg += `⚽ Goals: ${stats.goals.total || 0}\n`;
      msg += `🎯 Assists: ${stats.goals.assists || 0}\n`;
    }
    if (stats.cards) {
      msg += `🟨 Yellow Cards: ${stats.cards.yellow || 0}\n`;
      msg += `🟥 Red Cards: ${stats.cards.red || 0}\n`;
    }
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch player info: ' + error.message);
  }
};

// ─── LEAGUE ──────────────────────────────────────────────────────
commands.league = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .league <league_name>\nExample: .league Premier League');
  
  try {
    await reply(ctx, `⏳ Searching for ${ctx.q}...`);
    
    const response = await apiRequest('/leagues', { 
      search: ctx.q
    });
    
    if (!response.response || response.response.length === 0) {
      return reply(ctx, `❌ League "${ctx.q}" not found.`);
    }
    
    const league = response.response[0];
    const l = league.league;
    const country = league.country;
    
    let msg = `🏆 *${l.name}*\n`;
    msg += `🏷️ Country: ${country.name || 'Unknown'}\n`;
    msg += `📅 Season: ${league.season || 'Unknown'}\n`;
    msg += `🆔 ID: ${l.id}\n`;
    msg += `🔗 Type: ${l.type || 'Unknown'}\n`;
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch league info: ' + error.message);
  }
};

// ─── H2H ────────────────────────────────────────────────────────
commands.h2h = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .h2h <team1> vs <team2>\nExample: .h2h Manchester United vs Liverpool');
  
  try {
    const parts = ctx.q.split('vs').map(s => s.trim());
    if (parts.length < 2) return reply(ctx, '❌ Format: .h2h team1 vs team2');
    
    const team1 = parts[0];
    const team2 = parts[1];
    
    await reply(ctx, `⏳ Fetching head-to-head: ${team1} vs ${team2}...`);
    
    // Get team IDs first
    const team1Response = await apiRequest('/teams', { search: team1 });
    const team2Response = await apiRequest('/teams', { search: team2 });
    
    if (!team1Response.response || !team2Response.response) {
      return reply(ctx, '❌ One or both teams not found.');
    }
    
    const team1Id = team1Response.response[0].team.id;
    const team2Id = team2Response.response[0].team.id;
    
    const response = await apiRequest('/fixtures/headtohead', { 
      h2h: `${team1Id}-${team2Id}`,
      last: 5
    });
    
    if (!response.response || response.response.length === 0) {
      return reply(ctx, `❌ No previous matches found between ${team1} and ${team2}.`);
    }
    
    let msg = `⚽ *H2H: ${team1} vs ${team2}*\n\n`;
    
    response.response.forEach(match => {
      const home = match.teams.home.name;
      const away = match.teams.away.name;
      const homeScore = match.goals.home ?? '-';
      const awayScore = match.goals.away ?? '-';
      const date = new Date(match.fixture.date);
      const dateStr = date.toLocaleDateString();
      
      msg += `*${home}* ${homeScore} - ${awayScore} *${away}*\n`;
      msg += `   📅 ${dateStr}\n\n`;
    });
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch H2H: ' + error.message);
  }
};

// ─── SPORTNEWS ──────────────────────────────────────────────────
commands.sportnews = async function(ctx) {
  try {
    const news = [
      '🏆 Champions League: Knockout stage draws announced',
      '⚽ Premier League: Title race heats up',
      '🌍 World Cup qualifiers: Key matches this week',
      '🏀 NBA: Playoff race intensifies',
      '🎾 Tennis: Grand Slam season approaching',
      '🏏 Cricket: World Cup preparations underway',
      '🏎️ F1: New season regulations announced',
      '⚽ Transfer window: Major moves expected'
    ];
    
    let msg = '📰 *Latest Sports News*\n\n';
    const randomNews = news.slice(0, 5);
    randomNews.forEach((item, i) => {
      msg += `${i+1}. ${item}\n\n`;
    });
    msg += '_More updates coming soon._';
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch news: ' + error.message);
  }
};

module.exports = commands;
