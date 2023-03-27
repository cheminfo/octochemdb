import debugLibrary from '../../../utils/Debug.js';
import { getTaxonomiesForCmaupsAndNpasses } from '../../activesOrNaturals/utils/utilsTaxonomies/getTaxonomiesForCmaupsAndNpasses.js';
import { taxonomySynonyms } from '../../activesOrNaturals/utils/utilsTaxonomies/taxonomySynonyms.js';

import cmaupsStartSync from './utils/cmaupsStartSync.js';
import { getNormalizedActivities } from './utils/getNormalizedActivities.js';
import { parseCmaups } from './utils/parseCmaups.js';

const debug = debugLibrary('syncCmaups');
/**
 * @description sync the cmaups collection
 * @param {*} connection the connection to the database
 * @return {Promise} returns cmaups collection
 */
export async function sync(connection) {
  try {
    // Read files to be parsed, get last document imported, progress, sources and logs
    const [
      lastDocumentImported,
      progress,
      sources,
      collection,
      general,
      activities,
      speciesPair,
      speciesInfo,
      logs,
    ] = await cmaupsStartSync(connection);
    // Define counters
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    let isTimeToUpdate = false;
    if (
      progress.dateEnd !== 0 &&
      Date.now() - progress.dateEnd >
        Number(process.env.CMAUP_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
      JSON.stringify(sources) !== progress.sources
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
      isTimeToUpdate = true;
    }
    // Reimport collection again only if lastDocument imported changed or importation was not completed
    if (
      lastDocumentImported === null ||
      ((JSON.stringify(sources) !== progress.sources ||
        progress.state !== 'updated') &&
        isTimeToUpdate)
    ) {
      // get old to new taxonomies ids and taxonomies collection
      const oldToNewTaxIDs = await taxonomySynonyms();
      const collectionTaxonomies = await connection.getCollection('taxonomies');
      // Define stat updating because in case of failure Cron will retry importation in 24h
      progress.state = 'updating';
      await connection.setProgress(progress);
      // Create a temporaty collection to avoid to drop the data already imported before the new ones are ready
      const temporaryCollection = await connection.getCollection('cmaups_tmp');
      debug(`Start parsing cmaup`);
      for await (const entry of parseCmaups(
        general,
        activities,
        speciesPair,
        speciesInfo,
        connection,
      )) {
        counter++;
        // If cron launched in mode test, the importation will be stopped after 20 iteration
        if (process.env.NODE_ENV === 'test' && counter > 20) break;

        // Debug the processing progress every 10s or the defined time in process env
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug(`Processing: counter: ${counter} - imported: ${imported}`);
          start = Date.now();
        }
        /// Normalize Taxonomies
        if (entry.data.taxonomies) {
          let taxonomies = await getTaxonomiesForCmaupsAndNpasses(
            entry,
            collectionTaxonomies,
            oldToNewTaxIDs,
            'cmaups',
          );
          entry.data.taxonomies = taxonomies;
        }
        // Normalize activities
        if (entry.data.activities) {
          let activities = await getNormalizedActivities(
            entry,
            collectionTaxonomies,
            oldToNewTaxIDs,
            'cmaups',
          );
          entry.data.activities = activities;
        }
        // Insert the entry(i) in the temporary collection
        entry._seq = ++progress.seq;
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );
        imported++;
      }
      // Once it is finished, the temporary collection replace the old collection
      await temporaryCollection.rename('cmaups', {
        dropTarget: true,
      });
      // Define logs informations in collection importationLogs
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      // Define new informations and set state to updated in admin collection
      progress.sources = sources;
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // Indexing of properties in collection
      await collection.createIndex({ 'data.ocl.noStereoTautomerID': 1 });
      await collection.createIndex({ _seq: 1 });

      debug(`${imported} compounds processed`);
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    // If error is catch, debug it on telegram
    if (connection) {
      debug(e.message, { collection: 'cmaups', connection, stack: e.stack });
    }
  }
}
