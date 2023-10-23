import pkg from 'fs-extra';
import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import importCompoundPatents from './utils/importCompoundPatents.js';
import ungzipAndSort from './utils/ungzipAndSort.js';

const { existsSync, rmSync } = pkg;
/**
 * @description sync patents from PubChem database
 * @param {*} connection - mongo connection
 * @returns {Promise} returns patents collection
 */
export async function sync(connection) {
  const debug = debugLibrary('syncCompoundPatents');
  try {
    let options = {
      collectionSource: process.env.COMPOUND_PATENTS_SOURCE,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/compoundPatents/cidToPatents`,
      collectionName: 'compoundPatents',
      filenameNew: 'cidToPatents',
      extensionNew: 'gz',
    };
    let sources;
    let lastFile;
    const progress = await connection.getProgress('compoundPatents');
    if (process.env.NODE_ENV === 'test') {
      lastFile = `${process.env.COMPOUND_PATENTS_SOURCE_TEST}`;
      sources = [lastFile];
    }
    // get last files cidToPatens available in the PubChem database
    else if (
      Date.now() - Number(progress.dateEnd) >
      Number(process.env.COMPOUND_PATENTS_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000
    ) {
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`${process.env.ORIGINAL_DATA_PATH}`, '')];
    } else {
      sources = progress.sources; // this will prevent to update the collection
    }
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );
    let isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.COMPOUND_PATENTS_UPDATE_INTERVAL,
      connection,
    );

    const logs = await connection.getImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
    if (isTimeToUpdate) {
      progress.state = 'updating';
      await connection.setProgress(progress);
      debug.info('start sync compoundPatents');
      //sort file by cid
      const sortedFile = `${lastFile?.split('.gz')[0]}.sorted`;
      await ungzipAndSort(lastFile, sortedFile);
      debug.trace('ungzip and sort done');

      await importCompoundPatents(sortedFile, connection);
      const collection = await connection.getCollection(options.collectionName);
      // create indexes
      await createIndexes(collection, [
        { 'data.patents': 1 },
        { 'data.nbPatents': 1 },
        { _seq: 1 },
      ]);
      // update Logs in importationLogs collection
      progress.sources = md5(JSON.stringify(sources));
      progress.state = 'updated';
      progress.dateEnd = Date.now();
      await connection.setProgress(progress);

      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';

      await connection.updateImportationLog(logs);
      debug.info('Sync compoundPatents completed');
      // remove recursively the sorted file
      if (existsSync(sortedFile)) {
        rmSync(sortedFile, { recursive: true });
      }
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'compoundPatents',
        connection,
        stack: e.stack,
      });
    }
  }
}
