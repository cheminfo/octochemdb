import { join } from 'path';

import { fileCollectionFromPath } from 'filelist-utils';
import FSExtra from 'fs-extra';

import debugLibrary from '../../../utils/Debug.js';

import getFile from './getFile.js';
import getFilesList from './getFilesList.js';

const { mkdirpSync, existsSync, statSync, rmSync } = FSExtra;
const debug = debugLibrary('syncFolder');

async function syncFolder(source, destinationFolder, options = {}) {
  if (!existsSync(destinationFolder)) {
    mkdirpSync(destinationFolder);
  }

  const limit = process.env.NODE_ENV === 'test' ? 5 : undefined;

  let allFiles = await getFilesList(source, options);
  if (limit) {
    allFiles = allFiles.slice(0, limit);
  }
  const newFiles = [];
  let fileList = (
    await fileCollectionFromPath(destinationFolder, {
      ungzip: { gzipExtensions: [] },
    })
  ).files.sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
  let lastFileImported;
  if (fileList.length > 0) {
    lastFileImported = fileList.slice(-1)[0];
    lastFileImported.name = lastFileImported.name.replace('.sdf', '.sdf.gz');
  }
  let skipping = false;
  if (lastFileImported) {
    skipping = true;
  }

  for (const file of allFiles) {
    const targetFile = join(destinationFolder, file.name);
    file.path = targetFile;
    if (skipping) {
      if (file.name !== lastFileImported.name && fileList.length !== 0) {
        if (!file.name.includes('killed')) {
          continue;
        }
      } else {
        skipping = false;
        if (existsSync(targetFile)) {
          const fileInfo = statSync(targetFile);
          let trueFileSize = await fileSize(file);
          debug.trace(
            `Skipped till: ${file.name} Size: ${trueFileSize}/${fileInfo.size}`,
          );
          if (fileInfo.size !== trueFileSize) {
            if (process.env.NODE_ENV === 'test') {
              continue;
            }
            rmSync(targetFile, { recursive: true });
            await getFile(file, targetFile);
            newFiles.push(file);
          }
        }
        continue;
      }
    }
    try {
      await getFile(file, targetFile);
    } catch (e) {
      debug.warn(`Error downloading ${file.name}: ${e.message}`);
      try {
        debug.trace(`trying again`);
        await getFile(file, targetFile);
      } catch (e2) {
        debug.error(`Error downloading ${file.name}: ${e2.message}`);
        continue;
      }
    }
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
