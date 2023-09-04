import { writeFileSync, utimesSync } from 'fs';

import delay from 'delay';

import debugLibrary from '../../../utils/Debug.js';

const MAX_COUNT = 10;

async function getFile(file, targetFile) {
  const debug = debugLibrary('getFile');

  let count = 0;

  let success = false;
  let response;
  while (success === false && count++ < MAX_COUNT) {
    try {
      const controller = new AbortController();
      const oneMinuteTimeout = setTimeout(() => controller.abort(), 60 * 1000); // 30 minutes
      setTimeout(() => controller.abort(), 1800 * 1000); // 30 minutes
      response = await fetch(file.url, { signal: controller.signal });
      clearTimeout(oneMinuteTimeout);
    } catch (e) {
      debug.error(e);
    }
    if (response?.status === 200) {
      success = true;
    } else {
      await delay(5000 * count ** 3);
    }
    if (response?.status !== 200) {
      throw new Error(`Could not fetch file: ${file.url}`);
    }

    if (process.env.NODE_ENV === 'test') {
      return response?.status;
    }
    try {
      const arrayBuffer = await response.arrayBuffer();

      writeFileSync(targetFile, new Uint8Array(arrayBuffer));

      utimesSync(targetFile, file.epoch, file.epoch);
    } catch (e) {
      debug.fatal(`ERROR while writing: ${file.url}`);
      debug.fatal(e);
      continue;
    }
  }

  if (count >= MAX_COUNT) {
    debug.fatal(`ERROR downloading: ${file.url}`);
    throw new Error(`ERROR downloading: ${file.url}`);
  }
}

export default getFile;
