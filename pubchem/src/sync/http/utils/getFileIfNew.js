import { utimesSync, existsSync, createWriteStream, rmSync } from 'fs';
import { join } from 'path';

import fetch from 'cross-fetch';
import { fileListFromPath } from 'filelist-from';
import FSExtra from 'fs-extra';

import Debug from '../../../utils/Debug.js';

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
    setTimeout(() => controller.abort(), 1800 * 1000);
    mkdirpSync(targetFolder);
    const response = await fetch(file.url, { signal: controller.signal });

    const headers = Array.from(response.headers);
    let lastMofidied =
      headers.filter((row) => row[0] === 'last-modified')[0] ||
      headers.filter((row) => row[0] === 'date')[0];

    let newFileSize = Number(
      headers.filter((row) => row[0] === 'content-length')[0][1],
    );
    let fileList = fileListFromPath(targetFolder).filter((file) =>
      file.name.includes(('.zip' || '.txt' || '.json' || '.gz') && filename),
    );

    let lastFilesSize;
    let lastFileTargetLocal;
    if (fileList.length > 0) {
      lastFilesSize = fileList.sort((a, b) => a.size - b.size)[0].size;
      lastFileTargetLocal = fileList.filter(
        (file) => file.size === lastFilesSize,
      )[0].name;
    } else {
      lastFilesSize = 0;
    }

    if (lastFilesSize !== newFileSize) {
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

      debug(
        `New file size do not match local one:${newFileSize}/${lastFilesSize}`,
      );
      const body = response.body;
      const encoding = body._readableState.defaultEncoding;
      const writeStream = createWriteStream(targetFile, encoding);
      for await (let part of body) {
        writeStream.write(part);
      }
      writeStream.close();
      if (file.epoch) utimesSync(targetFile, file.epoch, file.epoch);

      debug(`Downloaded: ${options.filename}`);

      return targetFile;
    } else {
      const targetFile = join(targetFolder, lastFileTargetLocal);
      debug(
        `New file size match local one (no need to fetch):${newFileSize}/${lastFilesSize}`,
      );
      return targetFile;
    }
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
