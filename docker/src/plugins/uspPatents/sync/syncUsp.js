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

    // get all files to import
    const allFiles = await syncAllUspFolders(connection);
    debug(allFiles);
    const { files, lastDocument } = await getFilesToImportForUsp(
      connection,
      progress,
      allFiles,
    );
    debug(files);
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
    await collection.createIndex({ 'data.language': 1 });
    await collection.createIndex({ 'data.patentNumber': 1 });
    await collection.createIndex({ 'data.applicationType': 1 });
    await collection.createIndex({ 'data.pubchemPatentId': 1 });
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
