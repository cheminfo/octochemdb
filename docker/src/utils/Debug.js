import debugLibrary from 'debug';
import delay from 'delay';
import { configDotenv } from 'dotenv';

import { sendTelegram } from './sendTelegram.js';

// @ts-ignore
const messages = [];
const levels = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};
configDotenv();
// @ts-ignore
const minLevelTelegram = levels[process.env.TELEGRAM_DEBUG_LEVEL];

// @ts-ignore
const minLevel = levels[process.env.DEBUG_LEVEL];

/**
 * @typedef {Object} Logger
 * @property {(message: string, options?: object) => Promise<void>} fatal
 * @property {(message: string, options?: object) => Promise<void>} error
 * @property {(message: string, options?: object) => Promise<void>} warn
 * @property {(message: string, options?: object) => Promise<void>} info
 * @property {(message: string, options?: object) => Promise<void>} debug
 * @property {(message: string, options?: object) => Promise<void>} trace
 */

/**
 * Creates a debug logger with various logging levels and capabilities to log messages to a database and send critical logs via Telegram.
 * @function Debug
 * @param {string} context - The context or namespace for the logger.
 * @returns {Logger} An object containing logging methods for different levels (fatal, error, warn, info, debug, trace).
 */

export default function Debug(context) {
  const realDebug = debugLibrary(context);

  /** @type {Logger} */
  const logger = /** @type {Logger} */ ({});

  for (const level of Object.keys(levels)) {
    if (!Object.keys(levels).includes(level)) {
      throw new Error(`Unknown level ${level}`);
    }
    // @ts-ignore
    logger[level] = async (message, options = {}) => {
      // @ts-ignore
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
        // @ts-ignore
        level: levels[level],
      };

      // @ts-ignore
      if (options?.stack) {
        // @ts-ignore
        messageDebug.stack = options.stack;
      }

      messages.push(messageDebug);
      // @ts-ignore
      if (levels[level] >= minLevelTelegram) {
        // @ts-ignore
        await sendTelegrams(messages);
      }
      if (options && Object.keys(options).length > 0) {
        // @ts-ignore
        options.level = levels[level];
        // @ts-ignore
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

/**
 * Sends telegram messages in the queue with a delay between each message to avoid hitting rate limits.
 * @param {Array<any>} messages - Array of message objects to be sent via Telegram.
 * @returns {Promise<void>} Promise that resolves when all messages have been sent.
 */
async function sendTelegrams(messages) {
  // messages can grow while we are sending telegrams so we need to copy the array

  while (messages.length > 0) {
    let messagesToSend = messages.filter(
      (msg) => msg.level >= minLevelTelegram,
    );
    messages.length = 0;

    for (const message of messagesToSend) {
      await sendTelegram(message?.text);
      await delay(500);
    }
    messagesToSend.length = 0;
  }
}
/**
 * This function logs messages into collection admin, on the property logs for the given collection. and stores up to 500 recent logs.
 * @param {*} message log message
 * @param {*} options options object containing collection name, connection instance, stack trace, level and levelLabel
 * @returns {Promise<void>} Promise that resolves when the log is stored in the database.
 */
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
  return connection.setProgress(progress);
}
