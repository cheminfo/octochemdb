import { writeFileSync, utimesSync } from 'fs';

import delay from 'delay';
import fetch from 'node-fetch'; //ATTENTION: node-fetch is not the same as fetch

import debugLibrary from '../../../utils/Debug.js';

const MAX_COUNT = 10;

async function getFile(file, targetFile) {
  const debug = debugLibrary('getFile');

  let count = 0;
  try {
    let success = false;
    let response;
    while (success === false && count++ < MAX_COUNT) {
      try {
        const controller = new AbortController();
        const oneMinuteTimeout = setTimeout(() => controller.abort(), 60 * 1000); // 30 minutes
        response = await fetch(file.url, { signal: controller.signal });
        clearTimeout(oneMinuteTimeout);
        setTimeout(() => controller.abort(), 1800 * 1000); // 30 minutes
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
        return await response?.status;
      }
      const arrayBuffer = await response.arrayBuffer();

      writeFileSync(targetFile, new Uint8Array(arrayBuffer));

      utimesSync(targetFile, file.epoch, file.epoch);
    }
  } catch (e) {
    debug.fatal(`ERROR downloading: ${file.url}`);
    throw e;
  }
  if (count >= MAX_COUNT) {
    debug.fatal(`ERROR downloading: ${file.url}`);
    throw new Error(`ERROR downloading: ${file.url}`);
  }

}

export default getFile;
