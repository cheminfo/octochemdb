import { createGunzip } from 'zlib';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { join } from 'path';
import Debug from '../../../../utils/Debug.js';

const pipe = promisify(pipeline);
const debug = Debug('gunzipStream');
async function gunzipStream(input, output) {
  if (!existsSync(output)) {
    debug(`decompress ${input}`);
    const gzip = createGunzip();
    const source = createReadStream(input);
    const destination = createWriteStream(join(`${output}`));
    await pipe(source, gzip, destination).catch((err) => {
      console.error('An error occurred:', err);
      process.exitCode = 1;
    });
  } else {
    debug('file already decompressed');
  }

  return join(`${output}`);
}

export default gunzipStream;
