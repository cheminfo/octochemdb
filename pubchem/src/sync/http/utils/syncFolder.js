import { join } from 'path';

import FSExtra from 'fs-extra';
import { fileListFromPath } from 'filelist-from';
import Debug from '../../../utils/Debug.js';

import getFile from './getFile.js';
import getFilesList from './getFilesList.js';
import fetch from 'cross-fetch';
const { mkdirpSync, existsSync, statSync, rmSync } = FSExtra;
const debug = Debug('syncFolder');

async function syncFolder(source, destinationFolder, options = {}) {
  if (!existsSync(destinationFolder)) {
    mkdirpSync(destinationFolder);
  }

  const limit = process.env.TEST === 'true' ? 5 : undefined;

  let allFiles = await getFilesList(source, options);
  if (limit) allFiles = allFiles.slice(0, limit);
  const newFiles = [];
  let start = Date.now();
  let fileList = fileListFromPath(destinationFolder).sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
  let lastFileImported = fileList.slice(-1)[0];
  let skipping = true;
  for (const file of allFiles) {
    const targetFile = join(destinationFolder, file.name);
    file.path = targetFile;
    if (skipping) {
      if (file.name !== lastFileImported.name) {
        continue;
      } else {
        skipping = false;
        const fileInfo = statSync(targetFile);
        let trueFileSize = await fileSize(file);
        debug(
          `Skipped till: ${file.name} Size: ${trueFileSize}/${fileInfo.size}`,
        );
        if (fileInfo.size !== trueFileSize) {
          rmSync(targetFile, { recursive: true });
        }
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
