import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';

import { getCidFromPmid } from './utils/getCidFromPmid.js';
import { getFilesToImport } from './utils/getFilesToImport.js';
import { importPubmedFiles } from './utils/importPubmedFiles.js';
import { syncPubmedFolder } from './utils/syncPubmedFolder.js';

/**
 * @description performs the incremental import of pubmeds
 * @param {*} connection - mongo connection
 * @returns {Promise} pubmeds collection
 */
async function incrementalPubmedImport(connection) {
  const debug = Debug('incrementalPubmedImport');
  try {
    // get progress
    const progress = await connection.getProgress('pubmeds');
    // get all files to import
    const allFiles = await syncPubmedFolder(connection, 'incremental');
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'incremental',
    );
    if (!files.includes(progress.sources) && progress.state === 'updated') {
      let options = {
        collectionSource: process.env.CIDTOPMID_SOURCE,
        destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/pubmeds/cidToPmid`,
        collectionName: 'pubmeds',
        filenameNew: 'cidToPmid',
        extensionNew: 'gz',
      };
      // get cidToPmid map
      const cidToPmidPath = await getLastFileSync(options);
      const pmidToCid = await getCidFromPmid(cidToPmidPath, connection);
      // import files
      await importPubmedFiles(
        connection,
        progress,
        files,
        { lastDocument },
        pmidToCid,
        'incremental',
      );
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'pubmeds', connection });
    }
  }
}

export default incrementalPubmedImport;
