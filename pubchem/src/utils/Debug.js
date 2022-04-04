import DebugLibrary from 'debug';
import delay from 'delay';

import { sendTelegram } from './sendTelegram.js';

const messages = [];

export default function Debug(context) {
  const realDebug = DebugLibrary(context);

  return (message) => {
    realDebug(message);

    messages.push({
      epoch: Date.now(),
      text: `${context}:${message}`,
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
