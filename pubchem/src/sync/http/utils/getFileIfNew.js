import { utimesSync, existsSync, createWriteStream, rmSync } from 'fs';
import { join } from 'path';

import fetch from 'cross-fetch';
import Debug from '../../../utils/Debug.js';
import FSExtra from 'fs-extra';

const { mkdirpSync } = FSExtra;

const debug = Debug('getFileIfNew');

/**
 * We will extract the date of last modification of the file and only copy if new.
 * We will also append the date in the filename
 * @param {*} file
 * @param {*} targetFolder
 */
async function getFileIfNew(file, targetFolder, options = {}) {
  const { filename, extension } = options;
  if (!filename || !extension) {
    throw new Error('options filename and extension are mandatory');
  }
  let target;
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 300000);
    mkdirpSync(targetFolder);
    const response = await fetch(file.url, { signal: controller.signal });

    const headers = Array.from(response.headers);

    let lastMofidied =
      headers.filter((row) => row[0] === 'last-modified')[0] ||
      headers.filter((row) => row[0] === 'date')[0];

    let modificationDate = new Date(lastMofidied[1])
      .toISOString()
      .substring(0, 10);
    debug(`Last modification date: ${modificationDate}`);

    const targetFile = join(
      targetFolder,
      `${filename}.${modificationDate}.${extension}`,
    );
    target = targetFile;
    debug(`targetFile: ${targetFile}`);
    if (existsSync(targetFile)) {
      debug('file already exists, no need to fetch');
      return targetFile;
    }
    const body = response.body;
    const encoding = body._readableState.defaultEncoding;
    const writeStream = createWriteStream(targetFile, encoding);
    for await (let part of body) {
      writeStream.write(part);
    }
    writeStream.close();
    if (file.epoch) utimesSync(targetFile, file.epoch, file.epoch);

    debug(`Downloading: ${options.filename}`);
    return targetFile;
  } catch (e) {
    debug(`ERROR downloading: ${options.filename}`);
    debug(target);
    if (existsSync(target)) {
      rmSync(target, { recursive: true });
    }
    throw e;
  }
}

export default getFileIfNew;
