import debugLibrary from '../../../utils/Debug.js';

import { getFilesToImport } from './utils/getFilesToImport.js';
import { importCompoundFiles } from './utils/importCompoundFiles.js';
import { syncCompoundFolder } from './utils/syncCompoundFolder.js';

const debug = debugLibrary('incrementalCompoundImport');

/**
 * @description Synchronize the compounds database from the pubchem database
 * @param {*} connection MongoDB connection
 * @returns {Promise} returns compounds collections
 */
async function incrementalCompoundImport(connection) {
  try {
    // Synchronize the compounds folder with the weekly updates
    let allFiles;
    const progress = await connection.getProgress('compounds');
    if (process.env.NODE_ENV === 'test') {
      allFiles = [
        {
          name: 'compoundsIncrementalTest.sdf.gz',
          path: `${process.env.COMPOUNDSINCREMENTAL_SOURCE_TEST}`,
        },
      ];
    } else {
      allFiles = await syncCompoundFolder(connection, 'incremental');
    }
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
        Number(process.env.PUBCHEM_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
      !files.includes(progress.sources)
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
    }
    // Import the files

    if (
      (!files.includes(progress.sources) &&
        progress.state === 'updated' &&
        Date.now() - progress.dateEnd >
          Number(process.env.PUBCHEM_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000) ||
      process.env.NODE_ENV === 'test'
    ) {
      await importCompoundFiles(
        connection,
        progress,
        files,
        { lastDocument },
        'incremental',
      );
    }
    debug.info('Compounds collection updated.');
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'compounds',
        connection,
        stack: e.stack,
      });
    }
  }
}

export default incrementalCompoundImport;
