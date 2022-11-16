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
    if (
      progress.dateEnd !== 0 &&
      Date.now() - progress.dateEnd >
        Number(process.env.PUBCHEM_UPDATE_INTERVAL) &&
      !files.includes(progress.sources)
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
    }
    // Import the files

    if (
      !files.includes(progress.sources) &&
      progress.state === 'updated' &&
      Date.now() - progress.dateEnd >
        Number(process.env.PUBCHEM_UPDATE_INTERVAL)
    ) {
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
      debug(e.message, { collection: 'compounds', connection, stack: e.stack });
    }
  }
}

export default incrementalCompoundImport;
