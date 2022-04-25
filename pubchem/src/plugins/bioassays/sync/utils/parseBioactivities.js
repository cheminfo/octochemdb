import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import Debug from '../../../../utils/Debug.js';

import getBioassays from './getBioassays.js';

const debug = Debug('parseBioactivities');

async function* parseBioactivities(
  bioactivitiesExtracted,
  bioassaysExtracted,
  parseSkip,
  connection,
) {
  try {
    const readStream = createReadStream(bioactivitiesExtracted);
    const stream = readStream.pipe(createGunzip());
    const lines = createInterface({ input: stream });
    const compounds = {};
    let last = Date.now();
    let counter = 0;
    for await (let line of lines) {
      const parts = line.split('\t');
      const aid = Number(parts[0]);
      const cid = parts[3];
      const activity = parts[4];
      counter++;
      if (activity !== 'Active') continue;
      if (!cid) continue;
      if (!compounds[cid]) compounds[cid] = [];
      if (!compounds[cid].includes(aid)) compounds[cid].push(aid);
      if (Date.now() > last + 10000) {
        last = Date.now();
        debug(`${counter} lines parsed`);
      }
      if (process.env.TEST === 'true' && counter > 1e6) break;
    }

    const bioassays = await getBioassays(bioassaysExtracted, connection);

    debug(`Start parsing AIDs`);
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
        if (bioassays[aid].targetsTaxonomies) {
          result.data.push({
            aid: aid,
            assay: bioassays[aid].name,
            activeAgainsTaxIDs: bioassays[aid].targetsTaxonomies,
          });
        } else {
          result.data.push({ aid: aid, assay: bioassays[aid].name });
        }
      }
      yield result;
    }
  } catch (e) {
    const optionsDebug = { collection: 'bioassays', connection };
    debug(e, optionsDebug);
  }
}

export default parseBioactivities;
