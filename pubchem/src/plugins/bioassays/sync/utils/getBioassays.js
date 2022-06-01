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
export default async function getBioassays(
  bioassaysFilePath,
  connection,
  collectionTaxonomies,
  synonyms,
) {
  try {
    // Read stream of bioassay file
    const readStream = createReadStream(bioassaysFilePath);
    const stream = readStream.pipe(createGunzip());
    const lines = createInterface({ input: stream });
    // Parse file line by line
    const bioassays = {};
    debug('Start parsing bioassays file');
    let counter = 0;
    let start = Date.now();
    let oldIDs = Object.keys(synonyms);
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
      let targetTaxonomies = {};
      // Taxonomies IDs can be either in targetTaxIDs or taxonomyIDs
      // The difference between the two is that taxonomyIDs contains identifiers derived from targetTaxIDs and links provided by depositor
      if (taxonomyIDs) {
        if (taxonomyIDs.includes('|')) {
          taxonomyIDs.split('|').forEach((entry) => {
            targetTaxonomies[entry] = [];
          });
        } else {
          targetTaxonomies[taxonomyIDs] = [];
        }
      }
      if (targetTaxIDs) {
        if (targetTaxIDs.includes('|')) {
          targetTaxIDs.split('|').forEach((entry) => {
            targetTaxonomies[entry] = [];
          });
        } else {
          targetTaxonomies[targetTaxIDs] = [];
        }
      }
      if (Object.keys(targetTaxonomies).length > 0) {
        let taxonomies = [];
        for (const taxId of Object.keys(targetTaxonomies)) {
          let idToUse = Number(taxId);
          if (oldIDs.includes(taxId)) {
            idToUse = Number(synonyms[taxId]);
          }
          let taxonomy = await collectionTaxonomies.findOne({ _id: idToUse });
          if (taxonomy) {
            if (taxonomy.data !== {}) {
              taxonomies.push(taxonomy.data);
            }
          }
        }
        if (taxonomies.length > 0) {
          bioassays[aid].targetTaxonomies = taxonomies;
        }
      }
      if (Date.now() - start > Number(30000)) {
        debug(`Processed: ${counter} assays`);
        start = Date.now();
      }
      counter++;
    }
    return bioassays;
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'bioassays', connection });
    }
  }
}
