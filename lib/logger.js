function col(code, text) { return '\x1b[' + code + 'm' + text + '\x1b[0m'; }
const colors = { cyan:36, green:32, yellow:33, red:31, gray:90, white:97, magenta:35, bold:1 };
function c(name, text) { return col(colors[name], text); }
function ts() { return c('gray', '[' + new Date().toLocaleTimeString() + ']'); }

const log = {
  info:    function(msg) { console.log(ts() + ' ' + c('cyan',   '●') + ' ' + msg); },
  success: function(msg) { console.log(ts() + ' ' + c('green',  '✔') + ' ' + msg); },
  warn:    function(msg) { console.log(ts() + ' ' + c('yellow', '⚠') + ' ' + msg); },
  error:   function(msg) { console.log(ts() + ' ' + c('red',    '✖') + ' ' + msg); },
  msg: function(name, owner, text) {
    const badge = owner ? c('yellow', ' 👑') : '';
    console.log(ts() + ' ' + c('magenta','→') + ' ' + c('cyan',name) + badge + c('gray',':') + ' ' + text.slice(0,120));
  },
  divider: function() { console.log(c('gray', '  ' + '─'.repeat(50))); },
  c: c,
};
module.exports = log;
