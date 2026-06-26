const { showMenu } = require('./lib/ui');
const sessionManager = require('./lib/sessionManager');
const logger = require('./lib/logger');

(async () => {
  const sessions = sessionManager.listSessions();
  if (sessions.length > 0) {
    logger.info(`Found ${sessions.length} session(s). Starting...`);
    for (const s of sessions) {
      try {
        await sessionManager.startSession(s.name);
        logger.success(`Started ${s.name}`);
      } catch (e) {
        logger.error(`Failed to start ${s.name}: ${e.message}`);
      }
    }
  } else {
    logger.warn('No sessions found. Pair a new device.');
  }
  await showMenu();
})();
