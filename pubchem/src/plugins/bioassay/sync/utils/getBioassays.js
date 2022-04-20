import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';
async function getBioassays(bioassaysExtracted) {
  const readStream = createReadStream(bioassaysExtracted);
  const stream = readStream.pipe(createGunzip());

  const lines = createInterface({ input: stream });
  const bioassays = {};
  for await (let line of lines) {
    const [aid, name] = line.split('\t');
    bioassays[aid] = name;
  }
  return bioassays;
}

export default getBioassays;
