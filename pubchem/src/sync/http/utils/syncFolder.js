import { join } from 'path';

import FSExtra from 'fs-extra';

import Debug from '../../../utils/Debug.js';

import getFile from './getFile.js';
import getFilesList from './getFilesList.js';
import fetch from 'cross-fetch';
const { mkdirpSync, existsSync, statSync } = FSExtra;
const debug = Debug('syncFolder');

async function syncFolder(source, destinationFolder, options = {}) {
  if (!existsSync(destinationFolder)) {
    mkdirpSync(destinationFolder);
  }

  const limit = process.env.TEST === 'true' ? 5 : undefined;
  let start = Date.now();
  let allFiles = await getFilesList(source, options);
  if (limit) allFiles = allFiles.slice(0, limit);
  const newFiles = [];
  for (const file of allFiles) {
    const targetFile = join(destinationFolder, file.name);
    file.path = targetFile;
    let trueFileSize = await fileSize(file);
    if (existsSync(targetFile)) {
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
        const fileInfo = statSync(targetFile);
        debug(
          `Skipped till: ${file.name} Size: ${trueFileSize}/${fileInfo.size}`,
        );
        start = Date.now();
        continue;
      }
    }
    await getFile(file, targetFile);
    newFiles.push(file);
  }
  return { allFiles, newFiles };
}

export default syncFolder;

async function fileSize(file) {
  const response = await fetch(file.url);

  const headers = Array.from(response.headers);
  let newFileSize = Number(
    headers.filter((row) => row[0] === 'content-length')[0][1],
  );
  return newFileSize;
}
