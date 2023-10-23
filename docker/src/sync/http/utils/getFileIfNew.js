import {
  utimesSync,
  existsSync,
  createWriteStream,
  rmSync,
  renameSync,
} from 'fs';
import { join } from 'path';

import { fileCollectionFromPath } from 'filelist-utils';
import pkg from 'fs-extra';
import fetch from 'node-fetch'; //ATTENTION: node-fetch is not the same as fetch

import debugLibrary from '../../../utils/Debug.js';

const { mkdirpSync } = pkg;
const debug = debugLibrary('getFileIfNew');

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
    setTimeout(() => controller.abort(), 1800 * 1000); // 30 minutes
    if (process.env.NODE_ENV !== 'test') {
      mkdirpSync(targetFolder);
    }
    const response = await fetch(file.url, { signal: controller.signal });
    if (response.status !== 200) {
      throw new Error(`Could not fetch file: ${file.url}`);
    }
    const headers = Array.from(response.headers);
    let lastMofidied =
      headers.filter((row) => row[0] === 'last-modified')[0] ||
      headers.filter((row) => row[0] === 'date')[0];

    let newFileSize = Number(
      headers.filter((row) => row[0] === 'content-length')[0],
    );
    newFileSize = newFileSize ? newFileSize[1] : -1;
    let fileList = (
      await fileCollectionFromPath(targetFolder, {
        ungzip: { gzipExtensions: [] },
        unzip: { zipExtensions: [] },
      })
    ).files.filter(
      (file) =>
        (file.name.includes('.zip') ||
          file.name.includes('.txt') ||
          file.name.includes('.json') ||
          file.name.includes('.gz') ||
          file.name.includes('.msp') ||
          file.name.includes('.tsv.gz')) &&
        file.name.includes(filename) &&
        !file.relativePath.includes('old'),
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
      debug.trace(`Last modification date: ${modificationDate}`);
      // in case of test we do not want to write to disk
      if (process.env.NODE_ENV === 'test') {
        return `${filename}.${modificationDate}.${extension}`;
      }
      if (
        !existsSync(join(targetFolder, 'old', modificationDate)) &&
        process.env.NODE_ENV !== 'test'
      ) {
        mkdirpSync(join(targetFolder, 'old', modificationDate));
      }
      fileList.forEach((file) => {
        renameSync(
          join(targetFolder, file.name),
          join(targetFolder, 'old', `${modificationDate}`, file.name),
        );
      });

      const targetFile = join(
        targetFolder,
        `${filename}.${modificationDate}.${extension}`,
      );
      target = targetFile;
      debug.trace(`targetFile: ${targetFile}`);

      debug.trace(
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

      debug.trace(`Downloaded: ${options.filename}`);

      return targetFile;
    } else {
      const targetFile = join(targetFolder, lastFileTargetLocal);
      debug.trace(
        `New file size match local one (no need to fetch):${
          newFileSize === 0 ? 'undefined' : newFileSize
        }/${lastFilesSize}`,
      );
      return targetFile;
    }
  } catch (e) {
    debug.fatal(`ERROR downloading: ${filename}`);
    debug.fatal(e);
    if (existsSync(target)) {
      rmSync(target, { recursive: true });
    }
    throw e;
  }
}

export default getFileIfNew;
