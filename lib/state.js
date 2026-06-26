const fs = require('fs');
const path = require('path');

const state = {
  antiLink: {},
  banList: new Set(),
  autoReact: true,
  autoStatusView: true,
  autoStatusLike: false,
  chatbotGroups: false,
  chatbotPrivate: false,
  aiHistory: {},
  knownJids: new Set(),
  recentLogs: [],
  menuWaiting: new Set(),
  autoTyping: true,
  alwaysOnline: false,
  antiCall: true,
  ruvaVoice: false,
  newsletterJid: null,
  newsletterName: null,
  sockets: {},
  webServerProcess: null,
};

module.exports = state;
