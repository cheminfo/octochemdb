import { join } from 'path';

import Debug from 'debug';
import FSExtra from 'fs-extra';

import getFile from './getFile.js';
import getFilesList from './getFilesList.js';

const { mkdirpSync, existsSync, statSync } = FSExtra;
const debug = Debug('syncFolder');

async function syncFolder(source, destinationFolder, options = {}) {
  if (!existsSync(destinationFolder)) {
    mkdirpSync(destinationFolder);
  }

  const limit = process.env.TEST === 'true' ? 5 : undefined;

  let allFiles = await getFilesList(source, options);
  if (limit) allFiles = allFiles.slice(0, limit);
  const newFiles = [];
  for (const file of allFiles) {
    const targetFile = join(destinationFolder, file.name);
    file.path = targetFile;
    if (existsSync(targetFile)) {
      const fileInfo = statSync(targetFile);
      debug(`Skipping: ${file.name} Size: ${file.size}/${fileInfo.size}`);
      continue;
    }
    await getFile(file, targetFile);
    newFiles.push(file);
  }
  return { allFiles, newFiles };
}

export default syncFolder;
