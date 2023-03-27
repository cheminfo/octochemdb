import debugLibrary from '../../../utils/Debug.js';

import { getFilesToImportForUsp } from './utils/getFilesToImportForUsp.js';
import { syncAllUspFolders } from './utils/http/syncAllUspFolders.js';
import { importUspFiles } from './utils/importUspFiles.js';
/**
 * @description performs the importation of usp patents
 * @param {*} connection - mongo connection
 * @returns {Promise} usp collection
 */
export async function sync(connection) {
  const debug = debugLibrary('syncUsp');
  try {
    // get progress
    const progress = await connection.getProgress('uspPatents');
    let allFiles;
    // get all files to import
    if (process.env.NODE_ENV === 'test') {
      allFiles = [
        {
          name: '2001.xml',
          path: `${process.env.USP_TEST_SOURCE}2001.xml`,
        },
        {
          name: '2005.xml',
          path: `${process.env.USP_TEST_SOURCE}2005.xml`,
        },
        {
          name: '2006.xml',
          path: `${process.env.USP_TEST_SOURCE}2006.xml`,
        },
        {
          name: '2007.xml',
          path: `${process.env.USP_TEST_SOURCE}2007.xml`,
        },
        {
          name: '2023.xml',
          path: `${process.env.USP_TEST_SOURCE}2023.xml`,
        },
      ];
    } else {
      allFiles = await syncAllUspFolders(connection);
    }
    const { files, lastDocument } = await getFilesToImportForUsp(
      connection,
      progress,
      allFiles,
    );
    //set progress to updating
    progress.state = 'updating';
    await connection.setProgress(progress);
    await importUspFiles(connection, progress, files, { lastDocument });
    // set progress to updated
    progress.state = 'updated';
    await connection.setProgress(progress);
    // create indexes
    const collection = await connection.getCollection('uspPatents');
    await collection.createIndex({ 'data.title': 1 });
    await collection.createIndex({ 'data.patentNumber': 1 });
    await collection.createIndex({ _seq: 1 });
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'uspPatents',
        connection,
        stack: e.stack,
      });
    }
  }
}
