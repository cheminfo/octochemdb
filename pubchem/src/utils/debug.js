import Debug from 'debug';
import { sendTelegram } from './sendTelegram.js';

let debugs;
let syncName;
let state = false;
let count = 0;

async function debug(message) {
  if (message.includes('sync') && count == 0) {
    debugs = Debug(message);
    syncName = message;
    state = true;
  }

  if (state === true && count > 0) {
    await debugs(message);
    await sendTelegram(`${syncName}:${message}`);
  }
  count++;
}

export default debug;
