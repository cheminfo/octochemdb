import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream';
import { unzip } from 'zlib';

import pkg from 'fs-extra';

import Debug from '../../../../utils/Debug.js';

const { existsSync } = pkg;

const debug = Debug('extractGziped');

export async function unzipFile(inputFilename) {
  const outputFilename = inputFilename.replace('.zip', '');
  if (!existsSync(outputFilename)) {
    debug(`decompress ${inputFilename}`);
    const gzip = unzip.Extract({ path: outputFilename });
    const source = createReadStream(inputFilename);
    const destination = createWriteStream(join(`${outputFilename}`));
    await pipeline(source, gzip, destination).catch(() => {
      process.exitCode = 1;
    });
  } else {
    debug(`${outputFilename} already exists`);
  }

  return join(`${outputFilename}`);
}
