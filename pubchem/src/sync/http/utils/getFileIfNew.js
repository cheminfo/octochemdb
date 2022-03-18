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
    const modificationDate = [];
    if (
      response.url !== process.env.COCONUT_SOURCE &&
      response.url !== process.env.LOTUS_SOURCE
    ) {
      debug(
        `Last modification date: ${
          headers.filter((row) => row[0] === 'last-modified')[0]
        }`,
      );
      modificationDate.push(
        new Date(headers.filter((row) => row[0] === 'last-modified')[0][1])
          .toISOString()
          .substring(0, 10),
      );
    } else {
      modificationDate.push(
        new Date(headers.filter((row) => row[0] === 'date')[0][1])
          .toISOString()
          .substring(0, 10),
      );
      debug(`Last modification date: ${modificationDate}`);
    }

    if (
      response.url !== process.env.COCONUT_SOURCE &&
      response.url !== process.env.LOTUS_SOURCE
    ) {
      const targetFile = join(
        targetFolder,
        file.url
          .replace(/^.*\//, '')
          .replace(/(\.[^.]*$)/, `.${modificationDate[0]}$1`),
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
    } else {
      const targetFile = join(
        targetFolder,
        headers
          .filter((row) => row[0] === 'content-disposition')[0][1]
          .split('=')[1]
          .replace(/^.*\//, '')
          .replace(/(\.[^.]*$)/, `.${modificationDate[0]}$1`),
      );
      debug(`targetFile: ${targetFile}`);
      if (existsSync(targetFile)) {
        debug('file already exists, no need to fetch');
        return targetFile;
      }
      const arrayBuffer = await response.arrayBuffer();
      writeFileSync(targetFile, new Uint8Array(arrayBuffer));

      if (file.epoch) utimesSync(targetFile, file.epoch, file.epoch);

      return targetFile;
    }
  } catch (e) {
    debug(`ERROR downloading: ${file.url}`);
    throw e;
  }
}

export default getFileIfNew;
