import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';

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
  const debug = debugLibrary('firstPubmedImport');
  try {
    // get progress
    const progress = await connection.getProgress('pubmeds');
    if (progress.state === 'updated') {
      debug('First importation has been completed. Should only update.');
      return;
    } else {
      debug(`Continuing first importation from ${progress.seq}.`);
    }
    let allFiles;
    if (process.env.NODE_ENV === 'test') {
      allFiles = [
        {
          name: 'firstImportTest.xml.gz',
          path: `${process.env.PUBMEDFIRSTIMPORT_SOURCE_TEST}`,
        },
      ];
    } else {
      // get all files to import
      allFiles = await syncPubmedFolder(connection, 'first');
    }
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
    let cidToPmidPath;
    if (process.env.NODE_ENV === 'test') {
      cidToPmidPath = `${process.env.CIDTOPMID_SOURCE_TEST}`;
    } else {
      cidToPmidPath = await getLastFileSync(options);
    }
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
    await collection.createIndex({ 'data.meshHeadings': 1 });
    await collection.createIndex({ 'data.cids': 1 });
    // create text index where title and meshHeading have more weight than abstract
    await collection.createIndex(
      {
        'data.article.title': 'text',
        'data.meshHeadings': 'text',
        'data.article.abstract': 'text',
      },
      {
        weights: {
          'data.article.title': 10,
          'data.meshHeadings': 10,
          'data.article.abstract': 1,
        },
      },
    );

    await collection.createIndex({ _seq: 1 });
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'pubmeds', connection, stack: e.stack });
    }
  }
}

export default firstPubmedImport;
