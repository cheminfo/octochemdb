import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';

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
  const debug = debugLibrary('incrementalPubmedImport');
  try {
    // get progress
    const progress = await connection.getProgress('pubmeds');
    // get all files to import
    let allFiles;
    if (process.env.NODE_ENV === 'test') {
      allFiles = [
        {
          name: 'incrementalImportTest.xml.gz',
          path: `${process.env.PUBMEDINCREMENTAL_SOURCE_TEST}`,
        },
      ];
    } else {
      // get all files to import
      allFiles = await syncPubmedFolder(connection, 'incremental');
    }
    debug('here');
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'incremental',
    );
    if (
      progress.dateEnd !== 0 &&
      Date.now() - progress.dateEnd >
        Number(process.env.PUBMED_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
      !files.includes(progress.sources)
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
    }

    if (
      (!files.includes(progress.sources) &&
        progress.state === 'updated' &&
        Date.now() - progress.dateEnd >
          Number(process.env.PUBMED_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000) ||
      process.env.NODE_ENV === 'test'
    ) {
      let options = {
        collectionSource: process.env.CIDTOPMID_SOURCE,
        destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/pubmeds/cidToPmid`,
        collectionName: 'pubmeds',
        filenameNew: 'cidToPmid',
        extensionNew: 'gz',
      };
      let cidToPmidPath;
      if (process.env.NODE_ENV === 'test') {
        cidToPmidPath = `${process.env.CIDTOPMID_SOURCE_TEST}`;
      } else {
        cidToPmidPath = await getLastFileSync(options);
      }
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
      debug(e.message, { collection: 'pubmeds', connection, stack: e.stack });
    }
  }
}

export default incrementalPubmedImport;
