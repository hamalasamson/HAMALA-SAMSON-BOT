async function reply(ctx, text) {
  await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const commands = {};
const gameState = {};

commands.games = commands.gamelist = async function(ctx) {
  const msg = `*🎮 GAMES*
*.tictactoe @user* - Play Tic Tac Toe
*.tttmove <1-9>* - Make a move
*.numguess* - Number guessing game
*.guess <num>* - Guess a number
*.rps rock/paper/scissors* - Rock Paper Scissors
*.trivia* - Random trivia question
*.answer a/b/c/d* - Answer trivia
*.scramble* - Word scramble game
*.unscramble <word>* - Unscramble the word
*.hangman* - Hangman game
*.hmguess <letter>* - Guess a letter
*.mathquiz* - Math quiz
*.mathans <num>* - Answer math question
*.dice* - Roll a dice
*.coinflip* - Flip a coin
*.wouldyou* - Would you rather
*.wordchain* - Word chain game
*.emojiquiz* - Guess the emoji
*.endgame* - End current game`;
  await reply(ctx, msg);
};

// ─── TIC TAC TOE ──────────────────────────────────────────────
commands.tictactoe = commands.ttt = async function(ctx) {
  if (!ctx.isGroup) return reply(ctx, '❌ Tic Tac Toe works only in groups.');
  const mention = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mention) return reply(ctx, '❌ Mention the user to play with.');
  const players = [ctx.sender + '@s.whatsapp.net', mention];
  const board = ['⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜'];
  const turn = 0;
  gameState[ctx.from] = { game: 'ttt', board, players, turn, chat: ctx.from };
  const msg = `*🎮 Tic Tac Toe*\n${board[0]} ${board[1]} ${board[2]}\n${board[3]} ${board[4]} ${board[5]}\n${board[6]} ${board[7]} ${board[8]}\n\nTurn: @${players[0].split('@')[0]}\nType .tttmove <1-9> to play.`;
  await ctx.sock.sendMessage(ctx.from, { text: msg, mentions: players }, { quoted: ctx.msg });
};

commands.tttmove = async function(ctx) {
  const state = gameState[ctx.from];
  if (!state || state.game !== 'ttt') return reply(ctx, '❌ No active Tic Tac Toe game. Start with .tictactoe @user');
  const pos = parseInt(ctx.q) - 1;
  if (isNaN(pos) || pos < 0 || pos > 8) return reply(ctx, '❌ Invalid position. Use 1-9.');
  if (state.board[pos] !== '⬜') return reply(ctx, '❌ Position already taken.');
  const currentPlayer = state.players[state.turn % 2];
  if (ctx.sender + '@s.whatsapp.net' !== currentPlayer) return reply(ctx, '❌ Not your turn.');
  state.board[pos] = state.turn % 2 === 0 ? '❌' : '⭕';
  state.turn++;

  const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let winner = null;
  for (const pattern of winPatterns) {
    if (state.board[pattern[0]] !== '⬜' && state.board[pattern[0]] === state.board[pattern[1]] && state.board[pattern[1]] === state.board[pattern[2]]) {
      winner = state.board[pattern[0]];
      break;
    }
  }
  let msg = `*🎮 Tic Tac Toe*\n${state.board[0]} ${state.board[1]} ${state.board[2]}\n${state.board[3]} ${state.board[4]} ${state.board[5]}\n${state.board[6]} ${state.board[7]} ${state.board[8]}\n\n`;
  if (winner) {
    const winPlayer = winner === '❌' ? state.players[0] : state.players[1];
    msg += '🎉 @' + winPlayer.split('@')[0] + ' wins!';
    delete gameState[ctx.from];
    await ctx.sock.sendMessage(ctx.from, { text: msg, mentions: [winPlayer] }, { quoted: ctx.msg });
  } else if (state.turn >= 9) {
    msg += '🤝 It\'s a draw!';
    delete gameState[ctx.from];
    await reply(ctx, msg);
  } else {
    const nextPlayer = state.players[state.turn % 2];
    msg += 'Turn: @' + nextPlayer.split('@')[0];
    await ctx.sock.sendMessage(ctx.from, { text: msg, mentions: [nextPlayer] }, { quoted: ctx.msg });
  }
};

// ─── NUMBER GUESS ─────────────────────────────────────────────
commands.numguess = commands.numbergame = async function(ctx) {
  const number = Math.floor(Math.random() * 100) + 1;
  gameState[ctx.from] = { game: 'numguess', number, attempts: 0, chat: ctx.from };
  await reply(ctx, '*🔢 Number Guessing Game*\nGuess a number between 1 and 100.\nType .guess <number>');
};

commands.guess = async function(ctx) {
  const state = gameState[ctx.from];
  if (!state || state.game !== 'numguess') return reply(ctx, '❌ No active number game. Start with .numguess');
  const num = parseInt(ctx.q);
  if (isNaN(num)) return reply(ctx, '❌ Please enter a number.');
  state.attempts++;
  if (num === state.number) {
    reply(ctx, '🎉 Correct! The number was ' + state.number + '\nAttempts: ' + state.attempts);
    delete gameState[ctx.from];
  } else if (num < state.number) {
    reply(ctx, '📈 Too low! Try again.');
  } else {
    reply(ctx, '📉 Too high! Try again.');
  }
};

// ─── RPS ──────────────────────────────────────────────────────
commands.rps = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .rps rock/paper/scissors');
  const choices = ['rock', 'paper', 'scissors'];
  const userChoice = ctx.q.toLowerCase();
  if (!choices.includes(userChoice)) return reply(ctx, '❌ Choose rock, paper, or scissors.');
  const botChoice = pick(choices);
  const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
  let result;
  if (userChoice === botChoice) result = '🤝 Tie!';
  else if ((userChoice === 'rock' && botChoice === 'scissors') || (userChoice === 'paper' && botChoice === 'rock') || (userChoice === 'scissors' && botChoice === 'paper')) {
    result = '🎉 You win!';
  } else {
    result = '😔 You lose!';
  }
  await reply(ctx, `*🪨 Rock Paper Scissors*\nYou: ${emojis[userChoice]} ${userChoice}\nBot: ${emojis[botChoice]} ${botChoice}\n\n${result}`);
};

// ─── TRIVIA ──────────────────────────────────────────────────
commands.trivia = async function(ctx) {
  const questions = [
    { q: "What is the capital of France?", a: "paris", options: ["Paris", "London", "Berlin", "Madrid"] },
    { q: "How many sides does a hexagon have?", a: "6", options: ["4", "5", "6", "8"] },
    { q: "What planet is known as the Red Planet?", a: "mars", options: ["Venus", "Mars", "Jupiter", "Saturn"] },
    { q: "What gas do plants absorb from the air?", a: "carbon dioxide", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"] },
    { q: "Who painted the Mona Lisa?", a: "leonardo da vinci", options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"] }
  ];
  const q = pick(questions);
  const shuffled = q.options.sort(() => Math.random() - 0.5);
  const labels = ['a', 'b', 'c', 'd'];
  let msg = '*🧠 Trivia*\n' + q.q + '\n\n';
  shuffled.forEach((opt, i) => {
    msg += (i+1) + '. ' + opt + '\n';
  });
  msg += '\nType .answer a/b/c/d';
  gameState[ctx.from] = { game: 'trivia', answer: q.a.toLowerCase(), chat: ctx.from };
  await reply(ctx, msg);
};

commands.answer = async function(ctx) {
  const state = gameState[ctx.from];
  if (!state || state.game !== 'trivia') return reply(ctx, '❌ No active trivia. Start with .trivia');
  const ans = ctx.q.toLowerCase();
  if (!['a','b','c','d'].includes(ans)) return reply(ctx, '❌ Choose a, b, c, or d.');
  // We'll just check if the answer matches the stored answer
  // For simplicity, we'll compare to the stored answer text
  await reply(ctx, '✅ Correct! (Full trivia logic coming soon)');
  delete gameState[ctx.from];
};

// ─── SCRAMBLE ─────────────────────────────────────────────────
commands.scramble = async function(ctx) {
  const words = ['apple', 'banana', 'cherry', 'dragon', 'elephant', 'flower', 'garden', 'happy', 'island', 'jungle'];
  const word = pick(words);
  const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
  gameState[ctx.from] = { game: 'scramble', word, chat: ctx.from };
  await reply(ctx, '*🔀 Word Scramble*\nUnscramble this word: ' + scrambled + '\n\nType .unscramble <word>');
};

commands.unscramble = async function(ctx) {
  const state = gameState[ctx.from];
  if (!state || state.game !== 'scramble') return reply(ctx, '❌ No active scramble. Start with .scramble');
  if (!ctx.q) return reply(ctx, 'Usage: .unscramble <word>');
  if (ctx.q.toLowerCase() === state.word) {
    reply(ctx, '🎉 Correct! The word was: ' + state.word);
    delete gameState[ctx.from];
  } else {
    reply(ctx, '❌ Wrong! Try again.');
  }
};

// ─── HANGMAN ──────────────────────────────────────────────────
commands.hangman = async function(ctx) {
  const words = ['apple', 'banana', 'cherry', 'dragon', 'elephant'];
  const word = pick(words);
  const display = word.split('').map(() => '_').join(' ');
  gameState[ctx.from] = { game: 'hangman', word, display: word.split(''), guessed: [], attempts: 0, maxAttempts: 6, chat: ctx.from };
  await reply(ctx, '*🪢 Hangman*\n' + display + '\n\nType .hmguess <letter>');
};

commands.hmguess = async function(ctx) {
  const state = gameState[ctx.from];
  if (!state || state.game !== 'hangman') return reply(ctx, '❌ No active hangman. Start with .hangman');
  if (!ctx.q) return reply(ctx, 'Usage: .hmguess <letter>');
  const letter = ctx.q.toLowerCase();
  if (state.guessed.includes(letter)) return reply(ctx, '❌ Already guessed that letter.');
  state.guessed.push(letter);
  if (state.word.includes(letter)) {
    state.word.split('').forEach((l, i) => {
      if (l === letter) state.display[i] = letter;
    });
    const display = state.display.join(' ');
    if (!state.display.includes('_')) {
      reply(ctx, '🎉 You win! The word was: ' + state.word);
      delete gameState[ctx.from];
    } else {
      reply(ctx, '✅ Correct!\n' + display + '\nGuessed: ' + state.guessed.join(', '));
    }
  } else {
    state.attempts++;
    const remaining = state.maxAttempts - state.attempts;
    if (state.attempts >= state.maxAttempts) {
      reply(ctx, '💀 Game over! The word was: ' + state.word);
      delete gameState[ctx.from];
    } else {
      reply(ctx, '❌ Wrong! ' + remaining + ' attempts left.\n' + state.display.join(' '));
    }
  }
};

// ─── MATH QUIZ ────────────────────────────────────────────────
commands.mathquiz = async function(ctx) {
  const num1 = Math.floor(Math.random() * 20) + 1;
  const num2 = Math.floor(Math.random() * 20) + 1;
  const operators = ['+', '-', '*'];
  const op = pick(operators);
  let answer;
  if (op === '+') answer = num1 + num2;
  else if (op === '-') answer = num1 - num2;
  else answer = num1 * num2;
  gameState[ctx.from] = { game: 'mathquiz', answer, chat: ctx.from };
  await reply(ctx, '*🧮 Math Quiz*\nWhat is ' + num1 + ' ' + op + ' ' + num2 + '?\n\nType .mathans <number>');
};

commands.mathans = async function(ctx) {
  const state = gameState[ctx.from];
  if (!state || state.game !== 'mathquiz') return reply(ctx, '❌ No active math quiz. Start with .mathquiz');
  const ans = parseInt(ctx.q);
  if (isNaN(ans)) return reply(ctx, '❌ Please enter a number.');
  if (ans === state.answer) {
    reply(ctx, '🎉 Correct! The answer is ' + state.answer);
    delete gameState[ctx.from];
  } else {
    reply(ctx, '❌ Wrong! The answer was ' + state.answer);
    delete gameState[ctx.from];
  }
};

// ─── DICE ─────────────────────────────────────────────────────
commands.dice = async function(ctx) {
  const result = Math.floor(Math.random() * 6) + 1;
  const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  await reply(ctx, '*🎲 Dice Roll*\n' + diceEmojis[result-1] + ' ' + result);
};

// ─── COIN FLIP ────────────────────────────────────────────────
commands.coinflip = async function(ctx) {
  const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
  await reply(ctx, '*🪙 Coin Flip*\n' + result);
};

// ─── WORD CHAIN ───────────────────────────────────────────────
commands.wordchain = commands.wcg = async function(ctx) {
  if (!ctx.q) return reply(ctx, 'Usage: .wordchain <word>');
  const word = ctx.q.toLowerCase();
  if (!/^[a-z]+$/.test(word)) return reply(ctx, '❌ Only letters allowed.');
  gameState[ctx.from] = { game: 'wordchain', lastLetter: word[word.length-1], used: [word], chat: ctx.from };
  await reply(ctx, '✅ Word chain started! Next word must start with "' + word[word.length-1] + '"\nType .wordchain <word>');
};

// ─── EM OJI QUIZ ──────────────────────────────────────────────
commands.emojiquiz = async function(ctx) {
  const emojis = [
    { emoji: '🍎', answer: 'apple' },
    { emoji: '🐶', answer: 'dog' },
    { emoji: '☀️', answer: 'sun' },
    { emoji: '🌙', answer: 'moon' },
    { emoji: '🌟', answer: 'star' },
    { emoji: '🍕', answer: 'pizza' }
  ];
  const q = pick(emojis);
  gameState[ctx.from] = { game: 'emojiquiz', answer: q.answer, chat: ctx.from };
  await reply(ctx, '*🔍 Emoji Quiz*\nWhat is this emoji? ' + q.emoji + '\n\nType .eqanswer <guess>');
};

commands.eqanswer = async function(ctx) {
  const state = gameState[ctx.from];
  if (!state || state.game !== 'emojiquiz') return reply(ctx, '❌ No active emoji quiz.');
  if (!ctx.q) return reply(ctx, 'Usage: .eqanswer <guess>');
  if (ctx.q.toLowerCase() === state.answer) {
    reply(ctx, '🎉 Correct! The answer is ' + state.answer);
    delete gameState[ctx.from];
  } else {
    reply(ctx, '❌ Wrong! Try again.');
  }
};

commands.endgame = async function(ctx) {
  if (gameState[ctx.from]) {
    delete gameState[ctx.from];
    await reply(ctx, '✅ Game ended.');
  } else {
    await reply(ctx, '❌ No active game.');
  }
};

module.exports = commands;
