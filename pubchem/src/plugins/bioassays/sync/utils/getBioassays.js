/* eslint-disable no-unused-vars */
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import Debug from '../../../../utils/Debug.js';

const debug = Debug('getBioassays');

async function getBioassays(bioassaysExtracted, connection) {
  try {
    const readStream = createReadStream(bioassaysExtracted);
    const stream = readStream.pipe(createGunzip());

    const lines = createInterface({ input: stream });

    const bioassays = {};
    for await (let line of lines) {
      const [
        aid,
        name,
        depositDate,
        modifyDate,
        sourceName,
        sourceId,
        substanceType,
        outcomeType,
        projectCategory,
        bioAssayGroup,
        bioAssayTypes,
        proteinAccessions,
        uniProtsIDs,
        geneIDs,
        targetTaxIDs,
        taxonomyIDs,
      ] = line.split('\t');
      if (aid === 'AID') continue;
      bioassays[aid] = { name: name };
      let targetsTaxonomy = {};
      if (taxonomyIDs) {
        if (taxonomyIDs.includes('|')) {
          taxonomyIDs.split('|').forEach((entry) => {
            targetsTaxonomy[entry] = [];
          });
        } else {
          targetsTaxonomy[taxonomyIDs] = [];
        }
      }
      if (targetTaxIDs) {
        if (targetTaxIDs.includes('|')) {
          targetTaxIDs.split('|').forEach((entry) => {
            targetsTaxonomy[entry] = [];
          });
        } else {
          targetsTaxonomy[targetTaxIDs] = [];
        }
      }
      if (Object.keys(targetsTaxonomy).length > 0) {
        bioassays[aid].targetsTaxonomies = Object.keys(targetsTaxonomy);
      }
    }
    return bioassays;
  } catch (e) {
    const optionsDebug = { collection: 'bioassays', connection };
    debug(e, optionsDebug);
  }
}

export default getBioassays;
