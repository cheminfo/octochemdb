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

/**
 * Decompresses a `.gz` file to the same path without the `.gz` extension.
 *
 * If the output file already exists the decompression step is skipped
 * (idempotent).  Uses Node streams so that arbitrarily large files can
 * be decompressed without loading the entire contents into memory.
 *
 * @param {string} inputFilename - Absolute or relative path to the `.gz` file.
 * @returns {Promise<string>} Resolved path of the decompressed output file.
 */
export async function decompressGziped(inputFilename) {
  const outputFilename = inputFilename.replace('.gz', '');
  if (!existsSync(outputFilename)) {
    debug.trace(`decompress ${inputFilename}`);
    const gzip = createGunzip();
    const source = createReadStream(inputFilename);
    const destination = createWriteStream(join(`${outputFilename}`));
    await pipe(source, gzip, destination).catch(() => {
      process.exitCode = 1;
    });
  } else {
    debug.trace(`${outputFilename} already exists`);
  }

  return join(`${outputFilename}`);
}
