import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';

import { getCidFromPmid } from './utils/getCidFromPmid.js';
import { getFilesToImport } from './utils/getFilesToImport.js';
import { importPubmedFiles } from './utils/importPubmedFiles.js';
import { syncPubmedFolder } from './utils/syncPubmedFolder.js';

/**
 * @description performs the first import of pubmeds
 * @param {*} connection - mongo connection
 * @returns {Promise} pubmeds collection
 */
async function firstPubmedImport(connection) {
  const debug = Debug('firstPubmedImport');
  try {
    // get progress
    const progress = await connection.getProgress('pubmeds');
    if (progress.state === 'updated') {
      debug('First importation has been completed. Should only update.');
      return;
    } else {
      debug(`Continuing first importation from ${progress.seq}.`);
    }
    // get all files to import
    const allFiles = await syncPubmedFolder(connection, 'first');
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'first',
    );
    //set progress to updating
    progress.state = 'updating';
    await connection.setProgress(progress);
    // get cidToPmid map
    let options = {
      collectionSource: process.env.CIDTOPMID_SOURCE,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/pubmeds/cidToPmid`,
      collectionName: 'pubmeds',
      filenameNew: 'cidToPmid',
      extensionNew: 'gz',
    };
    const cidToPmidPath = await getLastFileSync(options);
    const pmidToCid = await getCidFromPmid(cidToPmidPath, connection);
    await importPubmedFiles(
      connection,
      progress,
      files,
      { lastDocument },
      pmidToCid,
      'first',
    );
    // set progress to updated
    progress.state = 'updated';
    await connection.setProgress(progress);
    // create indexes
    const collection = await connection.getCollection('pubmeds');
    await collection.createIndexes([
      { 'data.meshHeadings': 1 },
      { 'data.cids': 1 },
      { _id: 1 },
    ]);
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'pubmeds', connection, stack: e.stack });
    }
  }
}

export default firstPubmedImport;
