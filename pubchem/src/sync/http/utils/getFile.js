import { writeFileSync, utimesSync } from 'fs';

import fetch from 'cross-fetch';

import Debug from '../../../utils/Debug.js';

const debug = Debug('getFile');
let start = Date.now();
let lastFileName = 'Start Import';
async function getFile(file, targetFile) {
  try {
    const response = await fetch(file.url);
    const arrayBuffer = await response.arrayBuffer();

    writeFileSync(targetFile, new Uint8Array(arrayBuffer));

    utimesSync(targetFile, file.epoch, file.epoch);

    if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
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
