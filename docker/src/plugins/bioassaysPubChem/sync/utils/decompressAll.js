import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
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
  try {
    const fileCollection = await fileCollectionFromPath(zipPath);
    // create a directory with the same name as the zip file
    if (!existsSync(zipPath.replace('.zip', ''))) {
      mkdirSync(zipPath.replace('.zip', ''));
    }
    for (const file of fileCollection.files) {
      const outputFilePath = join(zipPath.replace('.zip', ''), file.name);
      extractedFiles.push(outputFilePath);
      const json = JSON.parse(await file.text());
      writeFileSync(outputFilePath, JSON.stringify(json, null, 2));
    }
    /*  if (process.env.NODE_ENV === 'test') {
      rmSync(zipPath.replace('.zip', ''), { recursive: true });
    } else if (existsSync(zipPath)) {
      rmSync(zipPath);
    }*/
    return extractedFiles;
  } catch (e) {
    debug.error(e);
  }
}
