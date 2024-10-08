import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import debugLibrary from '../../../../utils/Debug.js';

import getBioassays from './getBioassays.js';

const debug = debugLibrary('parseBioactivities');

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
    // Define variables
    let counter = 0;
    let compoundData = {
      id: '',
      cid: 0,
    };
    // Start parsing line by line the bioActivities file
    const lines = createInterface({ input: stream });
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
        if (compound !== null) {
          compoundData.cid = cid;
          compoundData.idCode = compound.data.ocl.idCode;
          compoundData.noStereoTautomerID =
            compound.data.ocl.noStereoTautomerID;
          compoundData.coordinates = compound.data.ocl.coordinates;
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
            coordinates: compoundData.coordinates,
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
        if (process.env.NODE_ENV === 'test' && counter > 50) break;
      }
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'bioassays',
        connection,
        stack: e.stack,
      });
    }
  }
}

export default parseBioactivities;
