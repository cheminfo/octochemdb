import DebugLibrary from 'debug';
import delay from 'delay';

import { sendTelegram } from './sendTelegram.js';

const messages = [];

export default function Debug(context) {
  const realDebug = DebugLibrary(context);

  return (message, options = {}) => {
    realDebug(message);
    let messageDebug = {
      epoch: Date.now(),
      text: `${new Date()
        .toISOString()
        .replace(/.*T/, '')
        .replace('Z', ' - ')}${context}:${message}`,
    };
    if (options?.stack) {
      messageDebug.stack = options.stack;
    }
    messages.push(messageDebug);

    sendTelegrams();
    if (options) {
      logInDB(message, options);
    }
  };
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
