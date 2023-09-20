import { existsSync, mkdirSync, rmSync, createWriteStream } from 'fs';
import { join } from 'path';

import { fileCollectionFromPath } from 'filelist-utils';

import debugLibrary from '../../../../utils/Debug.js';

/**
 * @description recursively unzip all zip and gzip files
 * @param {string} zipPath - path to the zip file
 * @returns {Promise} - returns the array of extracted files
 */
export async function decompressAll(zipPath) {
  const debug = debugLibrary('decompressAll');
  let extractedFiles = [];
  const writePromises = []; // Array to store the write stream promises

  try {
    const fileCollection = await fileCollectionFromPath(zipPath);
    // create a directory with the same name as the zip file
    if (!existsSync(zipPath.replace('.zip', ''))) {
      mkdirSync(zipPath.replace('.zip', ''));
    }

    for (const file of fileCollection.files) {
      const outputFilePath = join(zipPath.replace('.zip', ''), file.name);
      extractedFiles.push(outputFilePath);

      // write stream using array buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create a promise for the write stream and store it in the array
      const writePromise = new Promise((resolve, reject) => {
        const stream = createWriteStream(outputFilePath);
        stream.write(buffer);
        stream.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      writePromises.push(writePromise);
    }

    // Wait for all write stream promises to resolve
    await Promise.all(writePromises);

    if (process.env.NODE_ENV !== 'test' && existsSync(zipPath)) {
      rmSync(zipPath);
    }

    return extractedFiles;
  } catch (e) {
    debug.error(e);
  }
}
