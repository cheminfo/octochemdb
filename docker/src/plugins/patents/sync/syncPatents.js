import { existsSync, rmSync } from 'fs-extra';
import md5 from 'md5';

import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';

import firstPatentsImport from './utils/firstPatentsImport.js';
import ungzipAndSort from './utils/ungzipAndSort.js';

/**
 * @description sync patents from PubChem database
 * @param {*} connection - mongo connection
 * @returns {Promise} returns patents collection
 */
export async function sync(connection) {
  const debug = debugLibrary('syncPatents');
  try {
    let options = {
      collectionSource: process.env.CIDTOPATENT_SOURCE,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/patents/cidToPatents`,
      collectionName: 'patents',
      filenameNew: 'cidToPatents',
      extensionNew: 'gz',
    };
    let sources;
    let lastFile;
    const progress = await connection.getProgress('patents');
    if (process.env.NODE_ENV === 'test') {
      lastFile = `${process.env.PATENTS_SOURCE_TEST}`;
      sources = [lastFile];
    }
    // get last files cidToPatens available in the PubChem database
    else if (
      Date.now() - Number(progress.dateEnd) >
      Number(process.env.PATENT_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000
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
        Number(process.env.PATENT_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
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
      //sort file by cid
      const sortedFile = `${lastFile.split('.gz')[0]}.sorted`;
      await ungzipAndSort(lastFile, sortedFile);
      debug('ungzip and sort done');

      await firstPatentsImport(sortedFile, connection);
      const collection = await connection.getCollection(options.collectionName);
      await collection.createIndex({ 'data.patents': 1 });
      await collection.createIndex({ 'data.nbPatents': 1 });
      await collection.createIndex({ _seq: 1 });

      // update Logs in importationLogs collection
      progress.sources = md5(JSON.stringify(sources));
      progress.state = 'updated';
      progress.dateEnd = Date.now();
      await connection.setProgress(progress);

      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';

      await connection.updateImportationLog(logs);
      // remove recursively the sorted file
      if (existsSync(sortedFile)) {
        rmSync(sortedFile, { recursive: true });
      }
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'patents', connection, stack: e.stack });
    }
  }
}
