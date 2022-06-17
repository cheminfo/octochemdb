import Debug from '../../../utils/Debug.js';

import { getFilesToImport } from './utils/getFilesToImport.js';
import { importCompoundFiles } from './utils/importCompoundFiles.js';
import { syncCompoundFolder } from './utils/syncCompoundFolder.js';

const debug = Debug('incrementalCompoundImport');

/**
 * @description Synchronize the compounds database from the pubchem database
 * @param {*} connection MongoDB connection
 * @returns {Promise} returns compounds collections
 */
async function incrementalCompoundImport(connection) {
  try {
    // Synchronize the compounds folder with the weekly updates
    const allFiles = await syncCompoundFolder(connection, 'incremental');
    const progress = await connection.getProgress('compounds');
    // Get list of files to import and last document imported
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'incremental',
    );
    // Import the files
    if (progress.state === 'updated') {
      await importCompoundFiles(
        connection,
        progress,
        files,
        { lastDocument },
        'incremental',
      );
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'compounds', connection });
    }
  }
}

export default incrementalCompoundImport;
