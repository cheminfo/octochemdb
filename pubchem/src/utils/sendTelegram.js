import fetch from 'cross-fetch';
import Debug from './Debug.js';

const debug = Debug('sendTelegram');

export async function sendTelegram(message) {
  if (!process.env.TELEGRAM_BOT_ID || !process.env.TELEGRAM_CHAT_ID) {
    debug(
      'no TELEGRAM_CHAT_ID or TELEGRAM_BOT_ID environnement variable Can not send telegram',
    );
  }
  return fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_ID}/sendMessage`,
    {
      method: 'POST',
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // eslint-disable-next-line camelcase
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
      }),
    },
  );
}
