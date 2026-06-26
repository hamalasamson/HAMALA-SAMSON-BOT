const axios = require('axios');

async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const commands = {};

// ─── COCKTAIL ──────────────────────────────────────────────────
commands.cocktail = async function(ctx) {
  try {
    const name = ctx.q || 'random';
    let url = 'https://www.thecocktaildb.com/api/json/v1/1/random.php';
    
    if (name !== 'random') {
      url = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`;
    }
    
    const response = await axios.get(url);
    
    if (!response.data.drinks || response.data.drinks.length === 0) {
      return reply(ctx, '🍸 No cocktail found. Try: .cocktail random');
    }
    
    const drink = response.data.drinks[0];
    let msg = `🍸 *${drink.strDrink}*\n`;
    msg += `🏷️ Category: ${drink.strCategory || 'Unknown'}\n`;
    msg += `🥤 Glass: ${drink.strGlass || 'Unknown'}\n`;
    msg += `🧪 Alcoholic: ${drink.strAlcoholic || 'Unknown'}\n`;
    msg += `📖 Instructions: ${drink.strInstructions?.slice(0, 200) || 'No instructions'}\n\n`;
    msg += `📋 *Ingredients:*\n`;
    
    for (let i = 1; i <= 15; i++) {
      const ingredient = drink[`strIngredient${i}`];
      const measure = drink[`strMeasure${i}`];
      if (ingredient) {
        msg += `• ${ingredient}${measure ? ' - ' + measure : ''}\n`;
      }
    }
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch cocktail: ' + error.message);
  }
};

// ─── MAKEUP ────────────────────────────────────────────────────
commands.makeup = async function(ctx) {
  try {
    const brand = ctx.q || '';
    let url = 'http://makeup-api.herokuapp.com/api/v1/products.json?product_type=makeup';
    if (brand) {
      url += `&brand=${encodeURIComponent(brand)}`;
    }
    
    const response = await axios.get(url);
    
    if (!response.data || response.data.length === 0) {
      return reply(ctx, '💄 No makeup products found.');
    }
    
    const product = pick(response.data);
    let msg = `💄 *${product.name}*\n`;
    msg += `🏷️ Brand: ${product.brand || 'Unknown'}\n`;
    msg += `💰 Price: ${product.price || 'Unknown'} ${product.price_sign || ''}\n`;
    msg += `🎨 Color: ${product.product_colors?.length > 0 ? product.product_colors[0].hex_value || 'Various' : 'Various'}\n`;
    if (product.description) {
      msg += `📖 Description: ${product.description.slice(0, 200)}...\n`;
    }
    msg += `🔗 Link: ${product.product_link || 'N/A'}`;
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch makeup: ' + error.message);
  }
};

// ─── DISNEY ────────────────────────────────────────────────────
commands.disney = async function(ctx) {
  try {
    const character = ctx.q || '';
    let url = 'https://api.disneyapi.dev/character';
    if (character) {
      url += `?name=${encodeURIComponent(character)}`;
    }
    
    const response = await axios.get(url);
    
    if (!response.data.data || response.data.data.length === 0) {
      return reply(ctx, '🎪 No Disney character found.');
    }
    
    const charData = pick(response.data.data);
    let msg = `🎪 *${charData.name}*\n`;
    if (charData.films && charData.films.length > 0) {
      msg += `🎬 Films: ${charData.films.slice(0, 3).join(', ')}\n`;
    }
    if (charData.tvShows && charData.tvShows.length > 0) {
      msg += `📺 TV Shows: ${charData.tvShows.slice(0, 3).join(', ')}\n`;
    }
    if (charData.videoGames && charData.videoGames.length > 0) {
      msg += `🎮 Video Games: ${charData.videoGames.slice(0, 3).join(', ')}\n`;
    }
    msg += `🆔 ID: ${charData._id || 'Unknown'}`;
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch Disney character: ' + error.message);
  }
};

// ─── REMOTEJOBS ────────────────────────────────────────────────
commands.remotejobs = async function(ctx) {
  try {
    const skill = ctx.q || '';
    let url = 'https://remotive.io/api/remote-jobs?limit=5';
    if (skill) {
      url += `&search=${encodeURIComponent(skill)}`;
    }
    
    const response = await axios.get(url);
    
    if (!response.data.jobs || response.data.jobs.length === 0) {
      return reply(ctx, '💼 No remote jobs found.');
    }
    
    const jobs = response.data.jobs.slice(0, 5);
    let msg = '💼 *Remote Jobs*\n\n';
    
    jobs.forEach((job, i) => {
      msg += `${i+1}. *${job.title}*\n`;
      msg += `🏷️ Company: ${job.company_name || 'Unknown'}\n`;
      msg += `📍 Location: ${job.candidate_required_location || 'Remote'}\n`;
      msg += `💰 Salary: ${job.salary || 'Not specified'}\n`;
      msg += `🔗 Link: ${job.url}\n\n`;
    });
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch remote jobs: ' + error.message);
  }
};

// ─── ASTEROID ──────────────────────────────────────────────────
commands.asteroid = async function(ctx) {
  try {
    const response = await axios.get('https://api.nasa.gov/neo/rest/v1/feed?api_key=DEMO_KEY');
    
    if (!response.data || !response.data.near_earth_objects) {
      return reply(ctx, '☄️ No asteroid data available.');
    }
    
    const today = new Date().toISOString().split('T')[0];
    const asteroids = response.data.near_earth_objects[today] || [];
    
    if (asteroids.length === 0) {
      return reply(ctx, '☄️ No asteroids passing near Earth today.');
    }
    
    const asteroid = asteroids[0];
    let msg = `☄️ *Asteroid Alert!*\n\n`;
    msg += `📛 Name: ${asteroid.name}\n`;
    msg += `📏 Diameter: ${(asteroid.estimated_diameter.meters.estimated_diameter_max || 0).toFixed(2)} meters\n`;
    msg += `⚠️ Hazardous: ${asteroid.is_potentially_hazardous_asteroid ? '⚠️ YES' : '✅ NO'}\n`;
    msg += `📅 Date: ${today}\n`;
    if (asteroid.close_approach_data && asteroid.close_approach_data.length > 0) {
      const data = asteroid.close_approach_data[0];
      msg += `🌍 Distance: ${(parseFloat(data.miss_distance.kilometers) / 1000000).toFixed(2)} million km\n`;
      msg += `🚀 Speed: ${(parseFloat(data.relative_velocity.kilometers_per_hour) / 1000).toFixed(2)} km/s\n`;
    }
    
    await reply(ctx, msg);
    
  } catch (error) {
    await reply(ctx, '❌ Failed to fetch asteroid data: ' + error.message);
  }
};

module.exports = commands;
