import { createReadStream, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { createGunzip } from 'node:zlib';

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
 * @param inputFilename - Absolute or relative path to the `.gz` file.
 * @returns Resolved path of the decompressed output file.
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
