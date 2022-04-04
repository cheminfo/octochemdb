import { writeFileSync, utimesSync } from 'fs';

import fetch from 'cross-fetch';
import Debug from 'debug';

const debug = Debug('getFile');

async function getFile(file, targetFile) {
  try {
    const response = await fetch(file.url);
    const arrayBuffer = await response.arrayBuffer();

    writeFileSync(targetFile, new Uint8Array(arrayBuffer));

    utimesSync(targetFile, file.epoch, file.epoch);

    debug(`Downloading: ${file.name}`);
  } catch (e) {
    debug(`ERROR downloading: ${file.url}`);
    throw e;
  }
}

export default getFile;
