import { createReadStream, readFileSync } from 'fs';
import { createInterface } from 'readline';
import getBioassays from './getBioassays.js';
import Debug from '../../../../utils/Debug.js';
const debug = Debug('parseBioactivities');
async function* parseBioactivities(
  bioactivitiesExtracted,
  bioassaysExtracted,
  parseSkip,
) {
  const stream = createReadStream(bioactivitiesExtracted);
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
    if (counter > 1e6) break;
  }

  const bioassays = await getBioassays(bioassaysExtracted);
  debug(`lines parsed`);
  let skipping = true;
  for (let cid in compounds) {
    let result = {
      _id: cid,
      _bioassays: [],
    };

    if (skipping && parseSkip !== undefined) {
      if (parseSkip === cid) {
        skipping = false;
      }
      yield result;
      continue;
    }
    let aids = compounds[cid];
    for (let aid in bioassays) {
      if (aids.includes(aid)) {
        result._bioassays.push({ aid: aid, assay: bioassays[aid] });
      }
    }
    yield result;
  }
}

export default parseBioactivities;
