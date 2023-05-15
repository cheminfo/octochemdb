import { writeFileSync, utimesSync } from 'fs';

import delay from 'delay';
import fetch from 'node-fetch'; //ATTENTION: node-fetch is not the same as fetch

import debugLibrary from '../../../utils/Debug.js';

async function getFile(file, targetFile) {
  const debug = debugLibrary('getFile');
  let start = Date.now();
  let lastFileName = 'Start Import';
  try {
    let count = 0;
    let success = false;
    let response;
    while (success === false && count < 3) {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1800 * 1000); // 30 minutes
        response = await fetch(file.url, { signal: controller.signal });
      } catch (e) {
        debug.error(e);
      }
      if (response?.status === 200) {
        success = true;
      } else {
        await delay(1000);
      }
      count++;
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

    if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
      debug.trace(`Downloaded from: ${lastFileName} till ${file.name}`);
      start = Date.now();
      lastFileName = file.name;
    }
  } catch (e) {
    debug.fatal(`ERROR downloading: ${file.url}`);
    throw e;
  }
}

export default getFile;
