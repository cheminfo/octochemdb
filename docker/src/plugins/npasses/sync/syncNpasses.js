import md5 from 'md5';

import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';
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
  const debug = debugLibrary('syncNpasses');
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
      targetInfo,
      logs,
    } = await npassesStartSync(connection);
    let isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.NPASS_UPDATE_INTERVAL,
      connection,
    );
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    // Reimport collection again only if lastDocument imported changed or importation was not completed
    if (isTimeToUpdate) {
      const oldToNewTaxIDs = await taxonomySynonyms();
      const collectionTaxonomies = await connection.getCollection('taxonomies');
      // create temporary collection
      const temporaryCollection = await connection.getCollection('npasses_tmp');
      debug.info(`Start parsing npasses`);
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
        targetInfo,
        connection,
      )) {
        counter++;
        // if test mode, stop after 20 entries
        if (process.env.NODE_ENV === 'test' && counter > 20) break;

        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
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
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // set logs
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      // create indexes
      await createIndexes(collection, [
        { 'data.ocl.noStereoTautomerID': 1 },
        { _seq: 1 },
      ]);

      debug.info(`npasses collection updated`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'npasses',
        connection,
        stack: e.stack,
      });
    }
  }
}
