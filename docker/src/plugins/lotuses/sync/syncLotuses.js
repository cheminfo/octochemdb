import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';
import { taxonomySynonyms } from '../../activesOrNaturals/utils/utilsTaxonomies/taxonomySynonyms.js';

import { getTaxonomiesForLotuses } from './utils/getTaxonomiesForLotuses.js';
import { parseLotuses } from './utils/parseLotuses.js';

/**
 * Synchronises the `lotuses` MongoDB collection with the latest upstream
 * LOTUS BSON dump (served as a ZIP archive).
 *
 * The function:
 *  1. Downloads (or locates in test mode) the LOTUS ZIP file.
 *  2. Calls `shouldUpdate` to decide whether a re-import is needed based on
 *     elapsed time, source-file checksums, and the last imported document.
 *  3. When an update is needed, iterates over every entry yielded by
 *     `parseLotuses`, enriches taxonomy data via `getTaxonomiesForLotuses`,
 *     and upserts each document into a temporary collection (`lotuses_tmp`).
 *  4. Atomically replaces the live `lotuses` collection with the temporary
 *     one via `rename`.
 *  5. Creates the required compound indexes and marks progress as `'updated'`.
 *
 * Errors are persisted to the admin MongoDB collection via `debug.fatal` and
 * are not re-thrown.
 *
 * @param {OctoChemConnection} connection - Active database connection wrapper.
 * @returns {Promise<void>}
 */
export async function sync(connection) {
  const debug = debugLibrary('syncLotuses');

  /** @type {LotusSyncOptions} */
  const options = {
    collectionSource: 'https://lotus.naturalproducts.net/download/mongo',
    destinationLocal: `../originalData//lotuses/full`,
    collectionName: 'lotuses',
    filenameNew: 'lotuses',
    extensionNew: 'zip',
  };
  try {
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `../docker/src/plugins/lotuses/sync/utils/__tests__/data/`;
      sources = [lastFile];
    } else {
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`../originalData/`, '')];
    }
    const progress = await connection.getProgress('lotuses');
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    const isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.LOTUS_UPDATE_INTERVAL,
      connection,
    );

    // define counter
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (isTimeToUpdate) {
      const collection = await connection.getCollection('lotuses');
      // Get old-to-new taxonomy ID mapping
      /** @type {any} */
      const taxonomySynonymsRaw = await taxonomySynonyms();
      /** @type {DeprecatedTaxIdMap} */
      const oldToNewTaxIDs = taxonomySynonymsRaw;
      const collectionTaxonomies = await connection.getCollection('taxonomies');

      // BSON file inside the ZIP archive to import
      const fileName = 'lotusUniqueNaturalProduct.bson';
      // Create temporary collection to avoid dropping live data before new data is ready
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      debug.info(`Start importing Lotus`);
      // Set progress state to updating
      progress.state = 'updating';
      await connection.setProgress(progress);
      // Parse and import LOTUS entries
      for await (const entry of parseLotuses(lastFile, fileName, connection)) {
        counter++;
        if (process.env.NODE_ENV === 'test' && counter > 20) break;

        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }
        /// Normalise taxonomies
        if (entry.data.taxonomies) {
          const taxonomies = await getTaxonomiesForLotuses(
            entry,
            collectionTaxonomies,
            oldToNewTaxIDs,
          );
          entry.data.taxonomies = taxonomies;
        }
        entry._seq = ++progress.seq;
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );
        imported++;
      }
      // Atomically replace the live collection with the temporary one
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });

      // Update progress in admin collection
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // Create indexes on collection properties
      await createIndexes(collection, [
        { 'data.ocl.noStereoTautomerID': 1 },
        { _seq: 1 },
      ]);

      debug.info(`Lotus importation done`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'lotuses',
        connection,
        stack: err.stack,
      });
    }
  }
}
