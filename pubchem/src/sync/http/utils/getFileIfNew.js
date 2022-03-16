import { writeFileSync, utimesSync, existsSync } from 'fs';
import { join } from 'path';

import fetch from 'cross-fetch';
import Debug from 'debug';
import FSExtra from 'fs-extra';

const { mkdirpSync } = FSExtra;

const debug = Debug('getFileIfNew');

/**
 * We will extract the date of last modification of the file and only copy if new.
 * We will also append the date in the filename
 * @param {*} file
 * @param {*} targetFolder
 */
async function getFileIfNew(file, targetFolder) {
  try {
    mkdirpSync(targetFolder);
    const response = await fetch(file.url);
    const headers = Array.from(response.headers);
    debug(
      `Last modification date: ${
        headers.filter((row) => row[0] === 'last-modified')[0]
      }`,
    );
    const modificationDate = new Date(
      headers.filter((row) => row[0] === 'last-modified')[0][1],
    )
      .toISOString()
      .substring(0, 10);
    const targetFile = join(
      targetFolder,
      file.url
        .replace(/^.*\//, '')
        .replace(/(\.[^.]*$)/, `.${modificationDate}$1`),
    );
    debug(`targetFile: ${targetFile}`);
    if (existsSync(targetFile)) {
      debug('file already exists, no need to fetch');
      return targetFile;
    }
    const arrayBuffer = await response.arrayBuffer();

    writeFileSync(targetFile, new Uint8Array(arrayBuffer));

    if (file.epoch) utimesSync(targetFile, file.epoch, file.epoch);

    debug(`Downloading: ${file.name}`);
    return targetFile;
  } catch (e) {
    debug(`ERROR downloading: ${file.url}`);
    throw e;
  }
}

export default getFileIfNew;
