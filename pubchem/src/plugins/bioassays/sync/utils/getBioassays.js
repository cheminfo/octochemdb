/* eslint-disable no-unused-vars */
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('getBioassays');

/**
 * @name getBioassays
 * @param {string} bioassaysFilePath
 * @param {*} connection
 * @returns bioassays object containing AIDs, Target IDs
 */
async function getBioassays(bioassaysFilePath, connection) {
  try {
    // Read stream of bioassay file
    const readStream = createReadStream(bioassaysFilePath);
    const stream = readStream.pipe(createGunzip());
    const lines = createInterface({ input: stream });

    // Parse file line by line
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
      if (aid === 'AID') continue; // avoid to import headers
      // For each aid (assay ID), save the name of the bioassay
      bioassays[aid] = { name: name };
      let targetsTaxonomy = {};
      // Taxonomies IDs can be either in targetTaxIDs or taxonomyIDs
      // The difference between the two is that taxonomyIDs contains identifiers derived from targetTaxIDs and links provided by depositor
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
    // If error is chatched, debug it on telegram
    const optionsDebug = { collection: 'bioassays', connection };
    debug(e, optionsDebug);
  }
}

export default getBioassays;
