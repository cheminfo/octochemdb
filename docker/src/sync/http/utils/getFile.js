import { writeFileSync, utimesSync } from 'fs';

import fetch from 'node-fetch';

import debugLibrary from '../../../utils/Debug.js';

const debug = debugLibrary('getFile');
let start = Date.now();
let lastFileName = 'Start Import';

async function getFile(file, targetFile) {
  try {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const response = await fetch(file.url);
    if (response.status !== 200) {
      throw new Error(`Could not fetch file: ${file.url}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    writeFileSync(targetFile, new Uint8Array(arrayBuffer));

    utimesSync(targetFile, file.epoch, file.epoch);

    if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
      debug(`Downloaded from: ${lastFileName} till ${file.name}`);
      start = Date.now();
      lastFileName = file.name;
    }
  } catch (e) {
    debug(`ERROR downloading: ${file.url}`);
    throw e;
  }
}

export default getFile;
