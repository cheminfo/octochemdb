import { utimesSync, writeFileSync } from 'node:fs';

import delay from 'delay';
import fetch from 'node-fetch'; //ATTENTION: node-fetch is not the same as fetch

import debugLibrary from '../../../utils/Debug.js';

const MAX_COUNT = 10;

async function getFile(file, targetFile) {
  const debug = debugLibrary('getFile');

  let count = 0;
  let success = false;
  while (success === false && count++ < MAX_COUNT) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1800 * 1000); // 30 minutes
      let response;
      try {
        response = await fetch(file.url, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      // Any non-200 or a torn-down socket is retried below, not fatal: PubChem
      // routinely drops connections mid-transfer on large batches.
      if (response?.status !== 200) {
        throw new Error(
          `Unexpected status ${response?.status} for ${file.url}`,
        );
      }
      if (process.env.NODE_ENV === 'test') {
        return response.status;
      }
      // arrayBuffer() can also throw a "socket hang up" while streaming the
      // body, so it stays inside the retried try block.
      const arrayBuffer = await response.arrayBuffer();
      writeFileSync(targetFile, new Uint8Array(arrayBuffer));
      utimesSync(targetFile, file.epoch, file.epoch);
      success = true;
    } catch (error) {
      debug.error(
        `Attempt ${count}/${MAX_COUNT} failed for ${file.url}: ${error.message}`,
      );
      if (count < MAX_COUNT) {
        // Exponential-ish backoff, capped so a flaky file can't sleep for hours.
        await delay(Math.min(5000 * count ** 3, 120 * 1000));
      }
    }
  }

  if (!success) {
    debug.fatal(`ERROR downloading: ${file.url}`);
    throw new Error(`ERROR downloading: ${file.url}`);
  }
}

export default getFile;
