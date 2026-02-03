import { readFileSync } from 'fs';

import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import { parseMassBank } from './utils/parseMassBank.js';
import { checkMassBankLink } from './utils/checkMassBankLink.js';
const debug = debugLibrary('syncMassBank');
const massBankTestSource =
  '../docker/src/plugins/massBank/sync/utils/__tests__/data/massBank.msp';
const massBankSource =
  'https://github.com/MassBank/MassBank-data/releases/download/2025.10/MassBank_NISTformat.msp';

/**
 * Synchronizes MassBank collection with the latest MassBank database
 *
 * This function orchestrates the complete synchronization workflow for MassBank data:
 * 1. Checks if an update is needed based on progress tracking and update interval
 * 2. Downloads or uses local test data if applicable
 * 3. Parses the MassBank MSP format file
 * 4. Upserts entries into a temporary collection
 * 5. Renames the temporary collection to replace the main collection
 * 6. Creates necessary database indexes for optimal query performance
 *
 * @async
 * @function sync
 * @param {Object} connection - MongoDB connection instance with methods for collection management
 * @param {Function} connection.getCollection - Retrieves or creates a MongoDB collection
 * @param {Function} connection.getProgress - Retrieves progress tracking document
 * @param {Function} connection.setProgress - Updates progress tracking document
 * @returns {Promise<void>} Resolves when synchronization is complete
 * @throws {Error} Logs fatal error to debug system if connection fails
 * @note
 * - Skips synchronization if file already processed (determined by shouldUpdate)
 */

export async function sync(connection) {
  try {
    let options = {
      collectionSource: massBankSource,
      destinationLocal: `../originalData//massBank/full`,
      collectionName: 'massBank',
      filenameNew: 'massBank_full',
      extensionNew: 'msp',
    };
    const collection = await connection.getCollection(options.collectionName);
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `${massBankTestSource}`;
      sources = [massBankTestSource];
    } else {
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`../originalData/`, '')];
    }
    await checkMassBankLink(massBankSource, connection);
    const progress = await connection.getProgress(options.collectionName);
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    let isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.MASSBANK_UPDATE_INTERVAL,
      connection,
    );

    // define counters
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (isTimeToUpdate) {
      // create temporary collection
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );

      // set progress to updating
      progress.state = 'updating';
      await connection.setProgress(progress);
      debug.info(`Start importing MassBank`);
      const blob = readFileSync(lastFile);
      for await (const entry of parseMassBank(blob, connection)) {
        counter++;
        // if test mode is enabled, stop after 20 entries
        if (process.env.NODE_ENV === 'test' && counter > 20) break;

        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }

        // insert entry in temporary collection
        // @ts-ignore
        entry._seq = ++progress.seq;
        await temporaryCollection.updateOne(
          // @ts-ignore
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );
        imported++;
      }
      // rename the temporary collection to the final collection
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });

      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // create indexes on the collection
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
      debug.info(`MassBank collection imported`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      // @ts-ignore
      await debug.fatal(e.message, {
        collection: 'massBank',
        connection,
        // @ts-ignore
        stack: e.stack,
      });
    }
  }
}
