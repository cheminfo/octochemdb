import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import Debug from '../../../../utils/Debug.js';

import getBioassays from './getBioassays.js';

const debug = Debug('parseBioactivities');

/**
 * @name parseBioactivities
 * @param {string} bioActivitiesFilePath
 * @param {string} bioassaysFilePath
 * @param {*} connection
 */
async function* parseBioactivities(
  bioActivitiesFilePath,
  bioassaysFilePath,
  connection,
) {
  try {
    // Read stream of target file without unzip it
    const readStream = createReadStream(bioActivitiesFilePath);
    const stream = readStream.pipe(createGunzip());
    const lines = createInterface({ input: stream });
    // Get Bioassays data available in bioassays file
    const bioassays = await getBioassays(bioassaysFilePath, connection);
    // Define variables
    let counter = 0;
    // Start parsing line by line the bioActivities file
    for await (let line of lines) {
      const parts = line.split('\t');
      const aid = Number(parts[0]);
      const cid = parts[3];
      const activity = parts[4];
      // Only active molecules whit defined CID are kept
      if (activity !== 'Active' || !cid) {
        continue;
      }

      let result = {
        _id: `${cid}_${aid}`,
        data: {
          cid,
          aid,
          assay: bioassays[aid].name,
        },
      };

      if (bioassays[aid].targetsTaxonomies) {
        result.data.activeAgainstTaxIDs = bioassays[aid].targetsTaxonomies;
      }

      yield result;
      counter++;

      // If cron is launched in test mode, loop breaks after 1e6 lines parsed
      if (process.env.TEST === 'true' && counter > 1e6) break;
    }
  } catch (e) {
    // If error is catched, debug it on telegram
    const optionsDebug = { collection: 'bioassays', connection };
    debug(e, optionsDebug);
  }
}

export default parseBioactivities;
