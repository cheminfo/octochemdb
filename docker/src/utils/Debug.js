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
    logger[level] = async (message, options = {}) => {
      if (levels[level] >= minLevel) {
        realDebug(message);
      }
      const epoch = Date.now();
      const timestamp = new Date()
        .toISOString()
        .replace(/.*T/, '')
        .replace('Z', '');
      const text = `${timestamp}-${context}-${level}:${message}`;
      const messageDebug = {
        epoch,
        text,
        level: levels[level],
      };

      if (options?.stack) {
        messageDebug.stack = options.stack;
      }

      messages.push(messageDebug);
      if (levels[level] >= minLevelTelegram) {
        sendTelegrams();
      }
      if (options && Object.keys(options).length > 0) {
        options.level = levels[level];
        options.levelLabel = level;
        try {
          await logInDB(message, options);
        } catch (error) {
          throw new Error(`Error logging message: ${error}`);
        }
      }
    };
  }
  return logger;
}

async function sendTelegrams() {
  // messages can grow while we are sending telegrams so we need to copy the array
  while (messages.length > 0) {
    let messagesToSend = [...messages];
    messages.length = 0;
    for (const message of messagesToSend) {
      await sendTelegram(message.text);
      await delay(5000);
    }
    messagesToSend.length = 0;
  }
}

async function logInDB(message, options) {
  const { collection, connection, stack, level, levelLabel } = options;
  if (!collection || !connection) return;

  const progress = await connection.getProgress(collection);
  const logs = progress.logs || [];

  logs.push({
    epoch: new Date().toISOString(),
    level,
    levelLabel,
    message,
    stack,
  });

  if (logs.length > 500) {
    logs.splice(0, logs.length - 500);
  }
  if (!progress.logs && logs.length > 0) {
    progress.logs = logs;
  }
  await connection.setProgress(progress);
}
