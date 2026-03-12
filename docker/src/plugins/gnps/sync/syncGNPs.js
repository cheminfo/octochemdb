import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import { checkGNPSLink } from './utils/checkGNPSLink.js';
import { parseGNPs } from './utils/parseGNPs.js';

const debug = debugLibrary('syncGNPs');

/**
 * Synchronises the `gnps` MongoDB collection with the latest upstream
 * GNPS JSON library dump.
 *
 * The function:
 *  1. Downloads (or locates in test mode) the GNPS JSON file.
 *  2. Calls `shouldUpdate` to decide whether a re-import is needed based on
 *     elapsed time, source-file checksums, and the last imported document.
 *  3. When an update is needed, iterates over every entry yielded by
 *     `parseGNPs` and upserts each document into a temporary collection
 *     (`gnps_tmp`).
 *  4. Atomically replaces the live `gnps` collection with the temporary one
 *     via `rename`.
 *  5. Creates the required compound indexes and marks progress as `'updated'`.
 *
 * Errors are persisted to the admin MongoDB collection via `debug.fatal` and
 * are not re-thrown.
 *
 * @param {OctoChemConnection} connection - Active database connection wrapper.
 * @returns {Promise<void>}
 */
export async function sync(connection) {
  try {
    /** @type {GnpsSyncOptions} */
    const options = {
      collectionSource:
        'https://external.gnps2.org/gnpslibrary/ALL_GNPS_NO_PROPOGATED.json',
      destinationLocal: `../originalData/gnps/full`,
      collectionName: 'gnps',
      filenameNew: 'gnps_full',
      extensionNew: 'json',
    };
    // Resolve source file paths and determine the latest file
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `../docker/src/plugins/gnps/sync/utils/__tests__/data/gnpsTest.json`;
      sources = [
        '../docker/src/plugins/gnps/sync/utils/__tests__/data/gnpsTest.json',
      ];
    } else {
      await checkGNPSLink([options.collectionSource], connection);
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`../originalData/`, '')];
    }

    const progress = await connection.getProgress(options.collectionName);

    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    const isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.GNPS_UPDATE_INTERVAL,
      connection,
    );
    // Define counters
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (isTimeToUpdate) {
      const collection = await connection.getCollection(options.collectionName);

      // Create temporary collection to avoid dropping live data before new data is ready
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      debug.info(`Start importing GNPs`);
      // Set progress to updating
      progress.state = 'updating';
      await connection.setProgress(progress);
      // Parse and import GNPS entries
      for await (const entry of parseGNPs(lastFile, connection)) {
        counter++;
        // In test mode, stop after 20 entries
        if (process.env.NODE_ENV === 'test' && counter > 20) break;

        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }
        // Upsert entry into temporary collection
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
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // Create indexes on the collection
      await createIndexes(collection, [
        { 'data.ocl.idCode': 1 },
        { 'data.ocl.noStereoTautomerID': 1 },
        { 'data.spectrum.msLevel': 1 },
        { 'data.spectrum.ionSource': 1 },
        { 'data.spectrum.precursorMz': 1 },
        { 'data.spectrum.adduct': 1 },
        { 'data.spectrum.ionMode': 1 },
        { 'data.spectrum.data.x': 1 },
        { 'data.spectrum.data.y': 1 },
        { 'data.spectrum.numberOfPeaks': 1 },
        { 'data.em': 1 },
        { 'data.mf': 1 },
        { _seq: 1 },
      ]);
      debug.trace(`${imported} compounds processed`);
      debug.info(`GNPs imported`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'gnps',
        connection,
        stack: err.stack,
      });
    }
  }
}
