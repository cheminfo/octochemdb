import { readFileSync } from 'fs';

import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import { checkMassBankLink } from './utils/checkMassBankLink.js';
import { parseMassBank } from './utils/parseMassBank.js';

const debug = debugLibrary('syncMassBank');
const massBankTestSource =
  '../docker/src/plugins/massBank/sync/utils/__tests__/data/massBank.msp';
const massBankSource =
  'https://github.com/MassBank/MassBank-data/releases/download/2025.10/MassBank_NISTformat.msp';

/**
 * Synchronises the `massBank` MongoDB collection with the latest MassBank
 * MSP release.  Downloads (or reads the local test fixture), parses every
 * MSP record via {@link parseMassBank}, upserts into a temporary collection,
 * then atomically renames it and rebuilds indexes.
 *
 * @param {OctoChemConnection} connection - Database connection instance
 * @returns {Promise<void>}
 */
export async function sync(connection) {
  try {
    /** @type {MassBankSyncOptions} */
    const options = {
      collectionSource: massBankSource,
      destinationLocal: `../originalData/massBank/full`,
      collectionName: 'massBank',
      filenameNew: 'massBank_full',
      extensionNew: 'msp',
    };
    const collection = await connection.getCollection(options.collectionName);
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = massBankTestSource;
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
    const isTimeToUpdate = await shouldUpdate(
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
        entry._seq = ++progress.seq;
        await temporaryCollection.updateOne(
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
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'massBank',
        connection,
        stack: err.stack,
      });
    }
  }
}
