import DebugLibrary from 'debug';
import delay from 'delay';

import { sendTelegram } from './sendTelegram.js';

const messages = [];

export default function Debug(context) {
  const realDebug = DebugLibrary(context);

  return (message, options = {}) => {
    realDebug(message);

    await logInDB(message, options);

    messages.push({
      epoch: Date.now(),
      text: `${new Date()
        .toISOString()
        .replace(/.*T/, '')
        .replace('Z', ' - ')}${context}:${message}`,
    });

    sendTelegrams();
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
  const { collection } = options;
  if (!collection) return;
  // TODO
// load admin -> collection entry
// record.logs=[{epoch, event}]
// logs.prepend
// logs.slice(0,50)


}
