import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function getBioassays(bioassaysExtracted) {
  const stream = createReadStream(bioassaysExtracted);
  const lines = createInterface({ input: stream });
  const bioassays = {};
  for await (let line of lines) {
    const [aid, name] = line.split('\t');
    bioassays[aid] = name;
  }
  return bioassays;
}

export default getBioassays;
