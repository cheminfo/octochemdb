import { readFileSync } from 'fs';

import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import { parseMassBank } from './utils/parseMassBank.js';

const debug = debugLibrary('syncMassBank');
/**
 * @description Synchronize GNPS collection with the GNPS database
 * @param {*} connection MongoDB connection
 * @returns {Promise} returns gnps collections
 */
export async function sync(connection) {
  try {
    let options = {
      collectionSource: process.env.MASSBANK_SOURCE,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/massBank/full`,
      collectionName: 'massBank',
      filenameNew: 'massBank_full',
      extensionNew: 'msp',
    };
    //
    const collection = await connection.getCollection(options.collectionName);
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `${process.env.MASSBANK_SOURCE_TEST}`;
      sources = [process.env.MASSBANK_SOURCE_TEST];
    } else {
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`${process.env.ORIGINAL_DATA_PATH}`, '')];
    }
    const progress = await connection.getProgress(options.collectionName);
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
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
      const logs = await connection.getImportationLog({
        collectionName: options.collectionName,
        sources,
        startSequenceID: progress.seq,
      });
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

      await collection.createIndex({ 'data.ocl.idCode': 1 });
      await collection.createIndex({ 'data.ocl.noStereoTautomerID': 1 });
      await collection.createIndex({ 'data.spectrum.msLevel': 1 });
      await collection.createIndex({ 'data.spectrum.ionSource': 1 });
      await collection.createIndex({ 'data.spectrum.precursorMz': 1 });
      await collection.createIndex({ 'data.spectrum.adduct': 1 });
      await collection.createIndex({ 'data.spectrum.ionMode': 1 });
      await collection.createIndex({ 'data.spectrum.data.x': 1 });
      await collection.createIndex({ 'data.spectrum.data.y': 1 });
      await collection.createIndex({ 'data.spectrum.numberOfPeaks': 1 });
      await collection.createIndex({ 'data.em': 1 });
      await collection.createIndex({ 'data.mf': 1 });
      await collection.createIndex({ _seq: 1 });

      debug.info(`MassBank collection imported`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'massBank',
        connection,
        stack: e.stack,
      });
    }
  }
}
