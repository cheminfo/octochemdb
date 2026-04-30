import md5 from 'md5';

import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';

import { getTaxonomiesForLotusesV2 } from './utils/getTaxonomiesForLotusesV2.js';
import { parseLotusesV2 } from './utils/parseLotusesV2.js';

/**
 * Synchronises the `lotusesV2` MongoDB collection with the latest
 * LOTUS data from Wikidata via SPARQL queries.
 *
 * The function:
 *  1. Queries the Wikidata SPARQL endpoint for compounds, taxa, references,
 *     and their relationships (reproducing the lotus-wikidata-interact logic).
 *  2. For each compound, computes OCL structures from SMILES and enriches
 *     taxonomy data via `getTaxonomiesForLotusesV2`.
 *  3. Upserts each document into a temporary collection (`lotusesV2_tmp`).
 *  4. Atomically replaces the live `lotusesV2` collection with the temporary
 *     one via `rename`.
 *  5. Creates the required indexes and marks progress as `'updated'`.
 *
 * In test mode, pre-built test data is used instead of querying Wikidata.
 *
 * Errors are persisted to the admin MongoDB collection via `debug.fatal` and
 * are not re-thrown.
 *
 * @param {OctoChemConnection} connection - Active database connection wrapper.
 * @returns {Promise<void>}
 */
export async function sync(connection) {
  const debug = debugLibrary('syncLotusesV2');
  const collectionName = 'lotusesV2';

  try {
    const progress = await connection.getProgress(collectionName);

    // In test mode we check if we already imported
    if (process.env.NODE_ENV === 'test' && progress.state === 'updated') {
      debug.info('Already imported in test mode');
      return;
    }

    // In production, check update interval
    if (
      process.env.NODE_ENV !== 'test' &&
      progress.state === 'updated' &&
      progress.dateEnd
    ) {
      const updateInterval = Number(process.env.LOTUSESV2_UPDATE_INTERVAL) || 7;
      const daysSinceLastUpdate =
        (Date.now() - progress.dateEnd) / (1000 * 60 * 60 * 24);
      if (daysSinceLastUpdate < updateInterval) {
        debug.info(
          `Last update was ${daysSinceLastUpdate.toFixed(1)} days ago, skipping (interval: ${updateInterval} days)`,
        );
        return;
      }
    }

    let counter = 0;
    let imported = 0;
    let start = Date.now();

    debug.info('Start syncing lotusesV2 from Wikidata SPARQL');

    const collection = await connection.getCollection(collectionName);
    const collectionTaxonomies = await connection.getCollection('taxonomies');
    const temporaryCollection = await connection.getCollection(
      `${collectionName}_tmp`,
    );

    progress.state = 'updating';
    await connection.setProgress(progress);

    // Build parser options — in test mode, load test data
    const parserOptions = {};
    if (process.env.NODE_ENV === 'test') {
      const { getTestData } = await import(
        './utils/__tests__/data/testData.js'
      );
      parserOptions.testData = getTestData();
    }

    for await (const entry of parseLotusesV2(connection, parserOptions)) {
      counter++;
      if (process.env.NODE_ENV === 'test' && counter > 20) break;

      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
        debug.trace(`Processing: counter: ${counter} - imported: ${imported}`);
        start = Date.now();
      }

      if (entry.data.taxonomies) {
        const taxonomies = await getTaxonomiesForLotusesV2(
          entry,
          collectionTaxonomies,
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

    await temporaryCollection.rename(collectionName, {
      dropTarget: true,
    });

    progress.sources = md5(JSON.stringify(['wikidata-sparql']));
    progress.dateEnd = Date.now();
    progress.state = 'updated';

    await connection.setProgress(progress);
    await createIndexes(collection, [
      { 'data.ocl.noStereoTautomerID': 1 },
      { _seq: 1 },
    ]);
    debug.info(`${imported} compounds processed`);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: collectionName,
        connection,
        stack: err.stack,
      });
    }
  }
}
