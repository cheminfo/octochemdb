import { createReadStream, createWriteStream, existsSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createGunzip } from 'zlib';

import Debug from '../../../../utils/Debug.js';

const pipe = promisify(pipeline);
const debug = Debug('gunzipStream');

async function gunzipStream(inputFilename, outputFilename) {
  if (!existsSync(outputFilename)) {
    debug(`decompress ${inputFilename}`);
    const gzip = createGunzip();
    const source = createReadStream(inputFilename);
    const destination = createWriteStream(join(`${outputFilename}`));
    await pipe(source, gzip, destination).catch((err) => {
      console.error('An error occurred:', err);
      process.exitCode = 1;
    });
  } else {
    debug('file already decompressed');
  }

  return join(`${outputFilename}`);
}

export default gunzipStream;
