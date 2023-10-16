import pkg from 'fs-extra';
import md5 from 'md5';

import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import { decompressGziped } from '../../pubmeds/sync/utils/decompressGziped.js';

const { existsSync, rmSync } = pkg;
/**
 * @description sync patents from PubChem database
 * @param {*} connection - mongo connection
 * @returns {Promise} returns patents collection
 */
export async function sync(connection) {
  const debug = debugLibrary('syncTitleCompounds');
  try {
    let options = {
      collectionSource: process.env.TITLECOMPOUNDS_SOURCE,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/titleCompounds/`,
      collectionName: 'titleCompounds',
      filenameNew: 'cidToTitle',
      extensionNew: 'gz',
    };
    let sources;
    let lastFile;
    const progress = await connection.getProgress('titleCompounds');
    if (process.env.NODE_ENV === 'test') {
      lastFile = `${process.env.TITLECOMPOUNDS_SOURCE_TEST}`;
      sources = [lastFile];
    } else if (
      Date.now() - Number(progress.dateEnd) >
      Number(process.env.TITLECOMPOUNDS_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000
    ) {
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`${process.env.ORIGINAL_DATA_PATH}`, '')];
    } else {
      sources = progress.sources; // this will prevent to update the collection
    }

    let shouldUpdate = false;
    if (
      progress.dateEnd !== 0 &&
      Date.now() - Number(progress.dateEnd) >
        Number(process.env.TITLECOMPOUNDS_UPDATE_INTERVAL) *
          24 *
          60 *
          60 *
          1000 &&
      md5(JSON.stringify(sources)) !== progress.sources
    ) {
      progress.dateStart = Date.now();
      shouldUpdate = true;
      await connection.setProgress(progress);
    }
    const logs = await connection.getImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
    if (
      (JSON.stringify(sources) !== progress.sources && shouldUpdate) ||
      progress.state !== 'updated'
    ) {
      progress.state = 'updating';
      await connection.setProgress(progress);
      debug.info('start sync compoundPatents');
      let extractedFile = await decompressGziped(lastFile);
      await importTitleCompounds(extractedFile, connection);
      const collection = await connection.getCollection(options.collectionName);
      await collection.createIndex({ 'data.title': 1 });

      // update Logs in importationLogs collection
      progress.sources = md5(JSON.stringify(sources));
      progress.state = 'updated';
      progress.dateEnd = Date.now();
      await connection.setProgress(progress);

      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';

      await connection.updateImportationLog(logs);
      debug.info('Sync titleCompounds completed');
      // remove recursively the sorted file
      if (existsSync(extractedFile)) {
        rmSync(extractedFile, { recursive: true });
      }
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'titleCompounds',
        connection,
        stack: e.stack,
      });
    }
  }
}
