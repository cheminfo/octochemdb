import pkg from 'fs-extra';
import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import gunzipStream from '../../../utils/gunzipStream.js';

import { getGHS } from './utils/getGHS.js';
import { parseLccs } from './utils/parseLccs.js';

const { existsSync, rmSync } = pkg;
/**
 * @description syncLccs - synchronize lccs collection from lccs database
 * @param {*} connection - mongo connection
 * @returns {Promise} returns collection lccs
 */
export async function sync(connection) {
  const debug = debugLibrary('syncLccs');
  let options = {
    collectionSource: process.env.LCCS_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/lccs/full`,
    collectionName: 'lccs',
    filenameNew: 'lccs',
    extensionNew: 'gz',
  };
  try {
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `${process.env.LCCS_SOURCE_TEST}`;
      sources = [lastFile];
    } else {
      // get last file from lccs
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`${process.env.ORIGINAL_DATA_PATH}`, '')];
    }
    // get sources, progress and lccs collection
    const progress = await connection.getProgress('lccs');
    let isTimeToUpdate = false;
    if (
      progress.dateEnd !== 0 &&
      Date.now() - progress.dateEnd >
        Number(process.env.LCCS_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
      md5(JSON.stringify(sources)) !== progress.sources
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
      isTimeToUpdate = true;
    }
    // get last document imported
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );

    // define counter
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (
      lastDocumentImported === null ||
      ((md5(JSON.stringify(sources)) !== progress.sources ||
        progress.state !== 'updated') &&
        isTimeToUpdate)
    ) {
      const collection = await connection.getCollection('lccs');

      // get logs
      const logs = await connection.getImportationLog({
        collectionName: options.collectionName,
        sources,
        startSequenceID: progress.seq,
      });

      // create temporary collection
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      debug.info(`Start importing lccs`);
      // set progress state to updating
      progress.state = 'updating';
      await connection.setProgress(progress);
      let fileGHS;
      if (process.env.NODE_ENV === 'test') {
        fileGHS = process.env.LCCS_GHS_SOURCE_TEST;
      } else {
        options.collectionSource = process.env.LCCS_GHS_SOURCE;
        options.extensionNew = 'txt';
        options.filenameNew = 'ghscode';
        fileGHS = await getLastFileSync(options);
      }

      const outputFilename = await gunzipStream(
        lastFile,
        lastFile.replace('.gz', '.xml'),
      );

      const { hCodes, pCodes } = await getGHS(fileGHS);
      for await (let entry of parseLccs(outputFilename, { hCodes, pCodes })) {
        counter++;
        if (process.env.NODE_ENV === 'test' && counter > 20) break;

        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }

        entry._seq = ++progress.seq;

        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );
        imported++;
      }
      // Temporary collection replace old collection
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });

      // update Logs in importationLogs collection
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      //Update progress in admin collection
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // Indexing of collection properties
      await collection.createIndex({ 'data.description': 1 });
      await collection.createIndex({ 'data.pictograms': 1 });
      await collection.createIndex({ 'data.hCodesDescription': 1 });
      await collection.createIndex({ 'data.pCodesDescription': 1 });
      await collection.createIndex({ 'data.signals': 1 });
      await collection.createIndex({ 'data.physicalProperties': 1 });
      await collection.createIndex({ 'data.toxicalInformation': 1 });
      await collection.createIndex({ 'data.exposureLimits': 1 });
      await collection.createIndex({ 'data.healthAndSymptoms': 1 });
      await collection.createIndex({ 'data.firstAid': 1 });
      await collection.createIndex({ 'data.flammabilityAndExplosivity': 1 });
      await collection.createIndex({ 'data.stabilityAndReactivity': 1 });
      await collection.createIndex({ 'data.storageAndHandling': 1 });
      await collection.createIndex({ 'data.cleanUpAndDisposal': 1 });

      await collection.createIndex({ _seq: 1 });
      if (existsSync(outputFilename)) {
        rmSync(outputFilename);
      }
      debug.info(`Lccs importation done`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'lccs',
        connection,
        stack: e.stack,
      });
    }
  }
}
