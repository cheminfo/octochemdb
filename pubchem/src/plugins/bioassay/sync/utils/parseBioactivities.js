import { createReadStream, readFileSync } from 'fs';
import { createInterface } from 'readline';

import Debug from '../../../../utils/Debug.js';
import { createGunzip } from 'zlib';
import getBioassays from './getBioassays.js';

const debug = Debug('parseBioactivities');

async function* parseBioactivities(
  bioactivitiesExtracted,
  bioassaysExtracted,
  parseSkip,
) {
  const readStream = createReadStream(bioactivitiesExtracted);
  const stream = readStream.pipe(createGunzip());
  const lines = createInterface({ input: stream });
  const compounds = {};
  let last = Date.now();
  let counter = 0;
  for await (let line of lines) {
    const [aid, sid, sidGroup, cid, activity] = line.split('\t');
    counter++;
    if (activity !== 'Active') continue;
    if (!cid) continue;
    if (!compounds[cid]) compounds[cid] = [];
    compounds[cid].push(aid);
    if (Date.now() > last + 10000) {
      last = Date.now();
      debug(`${counter} lines parsed`);
    }
  }

  const bioassays = await getBioassays(bioassaysExtracted);

  debug(`lines parsed`);
  let skipping = true;
  for await (let cid of Object.keys(compounds)) {
    let result = {
      _id: cid,
      data: [],
    };

    if (skipping && parseSkip !== undefined) {
      if (parseSkip === cid) {
        skipping = false;
        debug(`Skipping compound till:${cid}`);
      } else {
        continue;
      }
    }

    for (let aid of compounds[cid]) {
      result.data.push({ aid: aid, assay: bioassays[aid] });
    }
    yield result;
  }
}

export default parseBioactivities;
