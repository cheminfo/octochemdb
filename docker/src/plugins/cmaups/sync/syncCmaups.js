import md5 from 'md5';

import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';
import { getTaxonomiesForCmaupsAndNpasses } from '../../activesOrNaturals/utils/utilsTaxonomies/getTaxonomiesForCmaupsAndNpasses.js';
import { taxonomySynonyms } from '../../activesOrNaturals/utils/utilsTaxonomies/taxonomySynonyms.js';

import cmaupsStartSync from './utils/cmaupsStartSync.js';
import { getNormalizedActivities } from './utils/getNormalizedActivities.js';
import { parseCmaups } from './utils/parseCmaups.js';

const debug = debugLibrary('syncCmaups');
/**
 * Synchronises the `cmaups` MongoDB collection with the latest upstream
 * CMAUP database files.
 *
 * The function:
 *  1. Calls `cmaupsStartSync` to download (or locate cached) source files and
 *     retrieve the current sync-progress document.
 *  2. Calls `shouldUpdate` to decide whether a re-import is needed based on
 *     elapsed time, source-file checksums, and the last imported document.
 *  3. When an update is needed, iterates over every entry yielded by
 *     `parseCmaups`, normalises taxonomy and activity data, and upserts each
 *     document into a temporary collection (`cmaups_tmp`).
 *  4. Atomically replaces the live `cmaups` collection with the temporary one
 *     via `rename`.
 *  5. Creates the required compound indexes and marks progress as `'updated'`.
 *
 * Errors are persisted to the admin MongoDB collection via `debug.fatal` and
 * are monitored externally; they are not re-thrown.
 *
 * @param {OctoChemConnection} connection - Active database connection wrapper.
 * @returns {Promise<void>}
 */
export async function sync(connection) {
  try {
    // Read files to be parsed, get last document imported, progress, sources and logs
    /** @type {any} */
    const startSyncRaw = await cmaupsStartSync(connection);
    /** @type {CmaupsStartSyncResult} */
    const [
      lastDocumentImported,
      progress,
      sources,
      collection,
      general,
      activities,
      speciesPair,
      speciesInfo,
      targetInfo,
    ] = startSyncRaw;
    // Define counters
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    let isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.CMAUP_UPDATE_INTERVAL,
      connection,
    );
    // Reimport collection again only if lastDocument imported changed or importation was not completed
    if (isTimeToUpdate) {
      // get old to new taxonomies ids and taxonomies collection
      /** @type {any} */
      const taxonomySynonymsRaw = await taxonomySynonyms();
      /** @type {DeprecatedTaxIdMap} */
      const oldToNewTaxIDs = taxonomySynonymsRaw;
      const collectionTaxonomies = await connection.getCollection('taxonomies');
      // Define stat updating because in case of failure Cron will retry importation in 24h
      progress.state = 'updating';
      await connection.setProgress(progress);
      // Create a temporaty collection to avoid to drop the data already imported before the new ones are ready
      const temporaryCollection = await connection.getCollection('cmaups_tmp');
      debug.info(`Start parsing cmaup`);
      for await (const entry of parseCmaups(
        general,
        activities,
        speciesPair,
        speciesInfo,
        targetInfo,
        connection,
      )) {
        counter++;
        // If cron launched in mode test, the importation will be stopped after 20 iteration
        if (process.env.NODE_ENV === 'test' && counter > 20) break;

        // Debug the processing progress every 10s or the defined time in process env
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }
        /// Normalize Taxonomies
        if (entry.data.taxonomies) {
          const taxonomies = await getTaxonomiesForCmaupsAndNpasses(
            entry,
            collectionTaxonomies,
            oldToNewTaxIDs,
            'cmaups',
          );
          entry.data.taxonomies = taxonomies;
        }
        // Normalize activities
        if (entry.data.activities) {
          const activities = await getNormalizedActivities(
            entry,
            collectionTaxonomies,
            oldToNewTaxIDs,
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

      // Define new informations and set state to updated in admin collection
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // Indexing of properties in collection
      await createIndexes(collection, [
        { 'data.ocl.noStereoTautomerID': 1 },
        { _seq: 1 },
      ]);

      debug.info(`${imported} compounds processed`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    // If error is caught, persist it to the admin collection for external monitoring
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'cmaups',
        connection,
        stack: err.stack,
      });
    }
  }
}
