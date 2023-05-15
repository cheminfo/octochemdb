import debugLibrary from 'debug';
import delay from 'delay';

import { sendTelegram } from './sendTelegram.js';

const messages = [];
const levels = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};
const minLevelTelegram = levels[process.env.TELEGRAM_DEBUG_LEVEL];
const minLevel = levels[process.env.DEBUG_LEVEL];

export default function Debug(context) {
  const realDebug = debugLibrary(context);

  const logger = {};

  for (const level of Object.keys(levels)) {
    if (!Object.keys(levels).includes(level)) {
      throw new Error(`Unknown level ${level}`);
    }
    logger[level] = (message, options = {}) => {
      if (levels[level] >= minLevel) {
        realDebug(message);
      }
      let messageDebug = {
        epoch: Date.now(),
        text: `${new Date()
          .toISOString()
          .replace(/.*T/, '')
          .replace('Z', ' - ')}${context}-${level}:${message}`,
        level: levels[level],
      };
      if (options?.stack) {
        messageDebug.stack = options.stack;
      }
      messages.push(messageDebug);
      if (levels[level] >= minLevelTelegram) {
        sendTelegrams();
      }
      if (options) {
        logInDB(message, options);
      }
    };
  }
  return logger;
}

async function sendTelegrams() {
  if (messages.length > 1) return;

  while (messages.length > 0) {
    await sendTelegram(messages[0].text);
    await delay(1000);
    messages.shift();
  }
}

async function logInDB(message, options) {
  const { collection, connection, stack } = options;
  if (!collection) return;
  const progress = await connection.getProgress(collection);
  if (progress.logs === null || progress.logs === undefined) {
    progress.logs = [];
  }

  let logs = progress.logs;
  if (logs && logs.length < 49) {
    logs.push({
      epoch: `${new Date().toISOString()}`,
      message: `${collection}:${message}`,
      stack: `${collection}:${stack}`,
    });
  }
  if (logs && logs.length === 49) {
    logs.shift();
    logs.push({
      epoch: `${new Date().toISOString()}`,
      message: `${collection}:${message}`,
      stack: `${collection}:${stack}`,
    });
  }

  await connection.setProgress(progress);
}
