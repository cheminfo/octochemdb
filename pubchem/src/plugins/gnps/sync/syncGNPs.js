import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';

import { parseGNPs } from './utils/parseGNPs.js';

const debug = Debug('syncGNPs');
/**
 * @description Synchronize GNPS collection with the GNPS database
 * @param {*} connection MongoDB connection
 * @returns {Promise} returns gnps collections
 */
export async function sync(connection) {
  try {
    let options = {
      collectionSource: process.env.GNPS_SOURCE,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/gnps/full`,
      collectionName: 'gnps',
      filenameNew: 'gnps_full',
      extensionNew: 'json',
    };
    // Get lastFile (path), sources, progress, logs,lastDocumentImported and collection gnps
    const lastFile = await getLastFileSync(options);
    const sources = [lastFile.replace(process.env.ORIGINAL_DATA_PATH, '')];

    const progress = await connection.getProgress(options.collectionName);
    const collection = await connection.getCollection(options.collectionName);

    const logs = await connection.getImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });

    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );
    // define counters
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (
      lastDocumentImported === null ||
      md5(JSON.stringify(sources)) !== progress.sources ||
      progress.state !== 'updated'
    ) {
      // create temporary collection
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}`,
      );
      debug(`Start parsing: ${lastFile}`);
      // set progress to updating
      progress.state = 'updating';
      await connection.setProgress(progress);
      // parse GNPs
      for await (const entry of parseGNPs(lastFile, connection)) {
        counter++;
        // if test mode is enabled, stop after 20 entries
        if (process.env.TEST === 'true' && counter > 20) break;

        if (
          Date.now() - start >
          Number(process.env.DEBUG_THROTTLING || 10000)
        ) {
          debug(`Processing: counter: ${counter} - imported: ${imported}`);
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
      // update the logs and progress
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // create indexes on the collection
      await collection.createIndex({ _id: 1 });
      await collection.createIndex({ 'data.ocl.id': 1 });
      await collection.createIndex({ 'data.ocl.noStereoID': 1 });
      await collection.createIndex({ 'spectralData.msLevel': 1 });
      await collection.createIndex({ 'spectralData.ionSource': 1 });
      await collection.createIndex({ 'spectralData.precursorMz': 1 });
      await collection.createIndex({ 'spectralData.adduct': 1 });
      await collection.createIndex({ 'spectralData.ionMode': 1 });
      await collection.createIndex({ 'spectralData.spectrum': 1 });

      debug(`${imported} compounds processed`);
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'gnps', connection });
    }
  }
}
