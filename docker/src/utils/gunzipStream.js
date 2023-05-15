import { createReadStream, createWriteStream, existsSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createGunzip } from 'zlib';

import debugLibrary from './Debug.js';

const pipe = promisify(pipeline);
const debug = debugLibrary('gunzipStream');

async function gunzipStream(inputFilename, outputFilename) {
  if (!existsSync(outputFilename)) {
    debug.trace(`decompress ${inputFilename}`);
    const gzip = createGunzip();
    const source = createReadStream(inputFilename);
    const destination = createWriteStream(join(`${outputFilename}`));
    await pipe(source, gzip, destination).catch(() => {
      process.exitCode = 1;
    });
  } else {
    debug.trace('file already decompressed');
  }

  return join(`${outputFilename}`);
}

export default gunzipStream;
