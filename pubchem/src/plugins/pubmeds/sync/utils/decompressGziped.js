/**
 * decompress a gziped file and return the path to the unzipped file with the same name
 * @param {string} inputFilename path to the gziped file
 * @returns {string} path to the unzipped file
 */

import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createGunzip } from 'zlib';

import pkg from 'fs-extra';

import debugLibrary from '../../../../utils/Debug.js';

const { existsSync } = pkg;

const pipe = promisify(pipeline);
const debug = debugLibrary('extractGziped');

export async function decompressGziped(inputFilename) {
  const outputFilename = inputFilename.replace('.gz', '');
  if (!existsSync(outputFilename)) {
    debug(`decompress ${inputFilename}`);
    const gzip = createGunzip();
    const source = createReadStream(inputFilename);
    const destination = createWriteStream(join(`${outputFilename}`));
    await pipe(source, gzip, destination).catch(() => {
      process.exitCode = 1;
    });
  } else {
    debug(`${outputFilename} already exists`);
  }

  return join(`${outputFilename}`);
}
