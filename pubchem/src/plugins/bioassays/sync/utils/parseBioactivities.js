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
  collectionCompounds,
  collectionTaxonomies,
  synonyms,
) {
  try {
    // Get Bioassays data available in bioassays file
    const bioassays = await getBioassays(
      bioassaysFilePath,
      connection,
      collectionTaxonomies,
      synonyms,
    );
    // Read stream of target file without unzip it

    const readStream = createReadStream(bioActivitiesFilePath);
    const stream = readStream.pipe(createGunzip());
    const lines = createInterface({ input: stream });
    // Define variables
    let counter = 0;
    // Start parsing line by line the bioActivities file
    let compoundData = {
      noStereoID: '',
      id: '',
      cid: 0,
    };
    for await (let line of lines) {
      const parts = line.split('\t');
      const aid = Number(parts[0]);
      const cid = Number(parts[3]);
      const activity = parts[4];
      // Only active molecules whit defined CID are kept
      if (activity !== 'Active' || !cid) {
        continue;
      }
      if (compoundData.cid !== cid) {
        let compound = await collectionCompounds.findOne({ _id: cid });
        if (compound) {
          compoundData.cid = cid;
          compoundData.id = compound.data.ocl.noStereoID;
          compoundData.noStereoID = compound.data.ocl.noStereoID;
        }
      }

      let result = {
        _id: `${cid}_${aid}`,
        data: {
          cid,
          aid,
          assay: bioassays[aid].name,
          ocl: {
            id: compoundData.id,
            noStereoID: compoundData.noStereoID,
          },
        },
      };
      if (bioassays[aid].targetsTaxonomies) {
        result.data.targetTaxonomies = bioassays[aid].targetsTaxonomies;
      }
      yield result;
      counter++;

      // If cron is launched in test mode, loop breaks after 1e6 lines parsed
      if (connection) {
        if (process.env.TEST === 'true' && counter > 50) break;
      }
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'bioassays', connection });
    }
  }
}

export default parseBioactivities;
