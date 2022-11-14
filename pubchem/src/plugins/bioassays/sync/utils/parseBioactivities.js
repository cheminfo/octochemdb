import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import Debug from '../../../../utils/Debug.js';

import getBioassays from './getBioassays.js';

const debug = Debug('parseBioactivities');

/**
 * @description  function to parse the bioactivities file and return the bioassays objects to be inserted in the database
 * @param {*} bioActivitiesFilePath the path to the bioactivities file
 * @param {*} bioassaysFilePath the path to the bioassays file
 * @param {*} connection the connection to the database
 * @param {*} collectionCompounds the collection of compounds
 * @param {*} collectionTaxonomies the collection of taxonomies
 * @param {*} oldToNewTaxIDs the newId to oldId map
 * @yields {Promise} returns the array of bioassays objects to be inserted in the database
 */
async function* parseBioactivities(
  bioActivitiesFilePath,
  bioassaysFilePath,
  connection,
  collectionCompounds,
  collectionTaxonomies,
  oldToNewTaxIDs,
) {
  try {
    // parse the bioassays file and get the bioassay information
    const bioassays = await getBioassays(
      bioassaysFilePath,
      connection,
      collectionTaxonomies,
      oldToNewTaxIDs,
    );
    // Read stream of target file without unzip it
    const readStream = createReadStream(bioActivitiesFilePath);
    const stream = readStream.pipe(createGunzip());
    const lines = createInterface({ input: stream });
    // Define variables
    let counter = 0;
    let compoundData = {
      noStereoID: '',
      id: '',
      cid: 0,
    };
    // Start parsing line by line the bioActivities file
    for await (let line of lines) {
      const parts = line.split('\t');
      const aid = Number(parts[0]);
      const cid = Number(parts[3]);
      const activity = parts[4];
      // Only active molecules whit defined CID are kept
      if (activity !== 'Active' || !cid) {
        continue;
      }
      // If the compound was already parsed, just add the bioassay and the taxonomies
      if (compoundData.cid !== cid) {
        let compound = await collectionCompounds.findOne({ _id: cid });
        if (compound) {
          compoundData.cid = cid;
          compoundData.idCode = compound.data.ocl.idCode;
          compoundData.noStereoTautomerID =
            compound.data.ocl.noStereoTautomerID;
        }
      }

      let result = {
        _id: `${cid}_${aid}`,
        data: {
          cid,
          aid,
          assay: bioassays[aid].name,
          ocl: {
            idCode: compoundData.idCode,
            noStereoTautomerID: compoundData.noStereoTautomerID,
          },
        },
      };
      if (bioassays[aid].targetTaxonomies) {
        result.data.targetTaxonomies = bioassays[aid].targetTaxonomies;
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
      debug(e.message, { collection: 'bioassays', connection, stack: e.stack });
    }
  }
}

export default parseBioactivities;
