import pkg from 'fs-extra';

import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';

import firstPatentsImport from './utils/firstPatentsImport.js';
import ungzipAndSort from './utils/ungzipAndSort.js';

const { removeSync } = pkg;
/**
 * @description sync patents from PubChem database
 * @param {*} connection - mongo connection
 * @returns {Promise} returns patents collection
 */
export async function sync(connection) {
  const debug = Debug('syncPatents');
  try {
    let options = {
      collectionSource: process.env.CIDTOPATENTS_SOURCE,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/patents/cidToPatents`,
      collectionName: 'patents',
      filenameNew: 'cidToPatents',
      extensionNew: 'gz',
    };

    // get last files cidToPatens available in the PubChem database
    const lastFile = await getLastFileSync(options);
    const sources = [lastFile.replace(process.env.ORIGINAL_DATA_PATH, '')];
    const progress = await connection.getProgress('patents');
    const logs = await connection.getImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
    if (
      JSON.stringify(sources) !== progress.sources ||
      progress.state !== 'updated'
    ) {
      progress.state = 'updating';
      await connection.setProgress(progress);
      //sort file by cid
      const sortedFile = `${lastFile.split('.gz')[0]}.sorted`;
      await ungzipAndSort(lastFile, sortedFile);
      //  remove non-sorted file
      removeSync(lastFile);
      //  const sortedFile = `${options.destinationLocal}/cidToPatents.2022-07-14.sorted`;
      await firstPatentsImport(sortedFile, connection);
      const collection = await connection.getCollection(options.collectionName);
      await collection.createIndex({ _id: 1 });
      await collection.createIndex({ 'data.patents': 1 });
      await collection.createIndex({ 'data.nbPatents': 1 });
      // update Logs in importationLogs collection
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'patents', connection, stack: e.stack });
    }
  }
}
