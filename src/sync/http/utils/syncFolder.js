import { join } from 'node:path';

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
    lastFileImported = fileList.at(-1);
  }
  let skipping = false;
  if (lastFileImported) {
    skipping = true;
  }
  let lastFileName = 'Start Import';
  let start = Date.now();
  for (const file of allFiles) {
    if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
      debug.trace(`Downloaded from: ${lastFileName} till ${file.name}`);
      start = Date.now();
      lastFileName = file.name;
    }
    const targetFile = join(destinationFolder, file.name);
    file.path = targetFile;
    if (existsSync(targetFile)) {
      const fileInfo = statSync(targetFile);
      let trueFileSize = await fileSize(file);
      // If the server didn't expose a size, keep what we already have:
      // discarding the local file on hearsay would waste bandwidth and
      // restart partial imports we already paid for.
      if (Number.isFinite(trueFileSize) && fileInfo.size !== trueFileSize) {
        if (process.env.NODE_ENV === 'test') {
          continue;
        }
        rmSync(targetFile, { recursive: true });
        await getFile(file, targetFile);
        newFiles.push(file);
      }
    }

    if (skipping) {
      if (!existsSync(targetFile)) {
        await getFile(file, targetFile);
        newFiles.push(file);
      }
      if (file.name !== lastFileImported.name && fileList.length > 0) {
        if (!file.name.includes('killed')) {
          continue;
        }
      } else {
        skipping = false;
        const fileInfo = statSync(targetFile);
        let trueFileSize = await fileSize(file);
        debug.trace(
          `Skipped till: ${file.name} Size: ${trueFileSize}/${fileInfo.size}`,
        );
        continue;
      }
    }
    try {
      await getFile(file, targetFile);
    } catch (error) {
      debug.warn(`Error downloading ${file.name}: ${error.message}`);
      try {
        debug.trace(`trying again`);
        await getFile(file, targetFile);
      } catch (error) {
        debug.error(`Error downloading ${file.name}: ${error.message}`);
        continue;
      }
    }
    newFiles.push(file);
  }

  return { allFiles, newFiles };
}

export default syncFolder;

export async function fileSize(file) {
  // Use HEAD to avoid downloading the whole file just for its size.
  let response = await fetch(file.url, { method: 'HEAD' });
  // Some servers (or some files) don't expose content-length on HEAD;
  // fall back to a GET in that case.
  let contentLength = response.headers.get('content-length');
  if (contentLength === null) {
    response = await fetch(file.url);
    contentLength = response.headers.get('content-length');
  }
  if (contentLength === null) {
    debug.warn(`No content-length header for ${file.url}`);
    return Number.NaN;
  }
  return Number(contentLength);
}
