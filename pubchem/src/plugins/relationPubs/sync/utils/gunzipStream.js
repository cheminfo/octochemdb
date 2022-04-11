import { createGunzip } from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { join } from 'path';
const pipe = promisify(pipeline);

async function gunzipStream(input, output) {
  const gzip = createGunzip();
  const source = createReadStream(input);
  const destination = createWriteStream(join(`${output}.txt`));
  await pipe(source, gzip, destination).catch((err) => {
    console.error('An error occurred:', err);
    process.exitCode = 1;
  });

  return join(`${output}.txt`);
}

export default gunzipStream;
