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
 * Main entry-point for the NPASS synchronisation job.
 *
 * High-level workflow:
 * 1. Bootstrap all prerequisites via {@link npassesStartSync} (download/
 *    resolve TSV files, parse them into lookup maps, fetch the target
 *    collection and the last-imported document).
 * 2. Determine whether an update is necessary using `shouldUpdate` which
 *    compares the md5 fingerprint of the current source file-set against
 *    the one stored in the progress document.
 * 3. If an update **is** needed:
 *    a. Load the deprecated-to-current taxonomy-ID map via
 *       `taxonomySynonyms`.
 *    b. Create a temporary collection (`npasses_tmp`).
 *    c. Iterate over every compound yielded by {@link parseNpasses},
 *       enriching taxonomy and activity data with standardised identifiers.
 *    d. Upsert each enriched document into the temporary collection.
 *    e. Atomically rename `npasses_tmp` → `npasses` (dropping the old one).
 *    f. Persist the updated progress document and rebuild indexes.
 * 4. If the data is already up-to-date the function exits early.
 *
 * @param {OctoChemConnection} connection - Active database connection
 *   providing access to collections, progress documents, and error logging.
 * @returns {Promise<void>}
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
    } = /** @type {NpassesStartSyncResult} */ (
      await npassesStartSync(connection)
    );
    // Check whether the source fingerprint has changed since the last run
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
    // Reimport only when source files changed or the last import was incomplete
    if (isTimeToUpdate) {
      // Load deprecated → current taxonomy-ID mapping for normalisation
      const oldToNewTaxIDs = /** @type {DeprecatedTaxIdMap} */ (
        await taxonomySynonyms()
      );
      const collectionTaxonomies = await connection.getCollection('taxonomies');
      // Create a temporary collection to write into; will be renamed atomically later
      const temporaryCollection = await connection.getCollection('npasses_tmp');
      debug.info(`Start parsing npasses`);
      // Mark progress as "updating" so partial runs can be detected
      progress.state = 'updating';
      await connection.setProgress(progress);
      // Iterate over all parsed compounds from the NPASS dataset
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
        // In test mode, cap at 20 entries for fast unit test runs
        if (process.env.NODE_ENV === 'test' && counter > 20) break;

        // Throttled progress logging to avoid flooding the log output
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }
        // Enrich taxonomy data with standardised IDs from the taxonomies collection
        if (entry.data.taxonomies) {
          const taxonomies = await getTaxonomiesForCmaupsAndNpasses(
            entry,
            collectionTaxonomies,
            oldToNewTaxIDs,
            'npasses',
          );
          entry.data.taxonomies = taxonomies;
        }
        // Normalise activity data (resolve deprecated target tax IDs, etc.)
        if (entry.data.activities) {
          const activities = await getNormalizedActivities(
            /** @type {any} */ (entry),
            collectionTaxonomies,
            oldToNewTaxIDs,
          );
          entry.data.activities = activities;
        }
        // Stamp a monotonically increasing sequence number
        entry._seq = ++progress.seq;
        // Upsert the enriched document into the temporary collection
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );

        imported++;
      }
      // Atomic swap: rename temp collection → final (drops the old npasses)
      await temporaryCollection.rename('npasses', {
        dropTarget: true,
      });
      // Persist updated progress: new source hash, end timestamp, state = updated
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);

      // Rebuild indexes on the freshly-swapped collection
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
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'npasses',
        connection,
        stack: err.stack,
      });
    }
  }
}
