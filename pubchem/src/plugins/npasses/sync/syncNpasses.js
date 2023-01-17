import Debug from '../../../utils/Debug.js';
import { getTaxonomiesForCmaupsAndNpasses } from '../../activesOrNaturals/utils/utilsTaxonomies/getTaxonomiesForCmaupsAndNpasses.js';
import { taxonomySynonyms } from '../../activesOrNaturals/utils/utilsTaxonomies/taxonomySynonyms.js';
import { getNormalizedActivities } from '../../cmaups/sync/utils/getNormalizedActivities.js';

import npassesStartSync from './utils/npassesStartSync.js';
import { parseNpasses } from './utils/parseNpasses.js';
/**
 * @description Synchronizes the npasses collection with the NPASS database
 * @param {*} connection - mongo connection
 * @returns {Promise} returns npasses collection
 */
export async function sync(connection) {
  const debug = Debug('syncNpasses');
  try {
    const {
      lastDocumentImported,
      progress,
      sources,
      collection,
      general,
      activities,
      properties,
      speciesPair,
      speciesInfo,
      logs,
    } = await npassesStartSync(connection);
    let isTimeToUpdate = false;
    if (
      progress.dateEnd !== 0 &&
      Date.now() - progress.dateEnd >
        Number(process.env.NPASS_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
      JSON.stringify(sources) !== JSON.stringify(progress.sources)
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
      isTimeToUpdate = true;
    }
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    // Reimport collection again only if lastDocument imported changed or importation was not completed
    if (
      lastDocumentImported === null ||
      ((JSON.stringify(sources) !== progress.sources ||
        progress.state !== 'updated') &&
        isTimeToUpdate)
    ) {
      const oldToNewTaxIDs = await taxonomySynonyms();
      const collectionTaxonomies = await connection.getCollection('taxonomies');
      // create temporary collection
      const temporaryCollection = await connection.getCollection('npasses_tmp');
      debug(`Start parsing npasses`);
      // set progress to updating
      progress.state = 'updating';
      await connection.setProgress(progress);
      // parse npasses
      for await (const entry of parseNpasses(
        general,
        activities,
        properties,
        speciesPair,
        speciesInfo,
        connection,
      )) {
        counter++;
        // if test mode, stop after 20 entries
        if (process.env.TEST === 'true' && counter > 20) break;

        if (
          Date.now() - start >
          Number(process.env.DEBUG_THROTTLING || 10000)
        ) {
          debug(`Processing: counter: ${counter} - imported: ${imported}`);
          start = Date.now();
        }
        /// Normalize Taxonomies
        if (entry.data.taxonomies) {
          let taxonomies = await getTaxonomiesForCmaupsAndNpasses(
            entry,
            collectionTaxonomies,
            oldToNewTaxIDs,
            'npasses',
          );
          entry.data.taxonomies = taxonomies;
        }
        // Normalize activities
        if (entry.data.activities) {
          let activities = await getNormalizedActivities(
            entry,
            collectionTaxonomies,
            oldToNewTaxIDs,
            'npasses',
          );
          entry.data.activities = activities;
        }
        entry._seq = ++progress.seq;
        // import entry to temporary collection
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );

        imported++;
      }
      // rename temporary collection to npasses
      await temporaryCollection.rename('npasses', {
        dropTarget: true,
      });
      // set progress to updated
      progress.sources = sources;
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // set logs
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      // create indexes
      await collection.createIndex({ 'data.ocl.noStereoTautomerID': 1 });
      await collection.createIndex({ _seq: 1 });

      debug(`${imported} compounds processed`);
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'npasses', connection, stack: e.stack });
    }
  }
}
