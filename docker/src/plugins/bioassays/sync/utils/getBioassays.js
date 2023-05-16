/* eslint-disable no-unused-vars */
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('getBioassays');

/**
 * @description  function to parse bioassays file and return the bioassays objects to be inserted in the database
 * @param {*} bioassaysFilePath the path to the bioassays file
 * @param {*} connection the connection to the database
 * @param {*} collectionTaxonomies the collection of taxonomies
 * @param {*} oldToNewTaxIDs the newId to oldId map
 * @returns {Promise} returns the array of bioassays objects to be inserted in the database
 */
export default async function getBioassays(
  bioassaysFilePath,
  connection,
  collectionTaxonomies,
  oldToNewTaxIDs,
) {
  try {
    // Read stream of bioassay file
    const readStream = createReadStream(bioassaysFilePath);
    const stream = readStream.pipe(createGunzip());
    const lines = createInterface({ input: stream });
    // Parse file line by line
    const bioassays = {};
    debug.trace('Start parsing bioassays file');
    let counter = 0;
    let start = Date.now();
    let oldIDs = Object.keys(oldToNewTaxIDs);
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
      bioassays[aid] = { name };
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
      // For each taxonomy ID, get the taxonomy and add it to the bioassays[aid].targetTaxonomies object
      if (Object.keys(targetTaxonomies).length > 0) {
        let taxonomies = [];
        for (const taxId of Object.keys(targetTaxonomies)) {
          let idToUse = Number(taxId);
          if (oldIDs.includes(taxId)) {
            idToUse = Number(oldToNewTaxIDs[taxId]);
          }
          let taxonomy = await collectionTaxonomies.findOne({ _id: idToUse });
          if (taxonomy) {
            if (taxonomy.data !== undefined) {
              taxonomies.push(taxonomy.data);
            }
          }
        }
        if (taxonomies.length > 0) {
          bioassays[aid].targetTaxonomies = taxonomies;
        }
      }
      // Debug the progress every 30000 bioassays
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
        debug.trace(`Processed: ${counter} assays`);
        start = Date.now();
      }
      counter++;
    }
    return bioassays;
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
