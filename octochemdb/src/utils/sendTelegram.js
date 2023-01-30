import { fetch } from 'cross-fetch';

export async function sendTelegram(message) {
  if (!process.env.TELEGRAM_BOT_ID || !process.env.TELEGRAM_CHAT_ID) {
    return;
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
