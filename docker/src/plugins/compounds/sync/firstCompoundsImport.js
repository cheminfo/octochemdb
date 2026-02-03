import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';

import { getFilesToImport } from './utils/getFilesToImport.js';
import { importCompoundFiles } from './utils/importCompoundFiles.js';
import { syncCompoundFolder } from './utils/syncCompoundFolder.js';

/**
 * @description Synchronize the compounds database from the pubchem database
 * @param {*} connection MongoDB connection
 * @returns {Promise} returns compounds collections
 */
async function firstCompoundImport(connection) {
  const debug = debugLibrary('firstCompoundImport');

  try {
    const progress = await connection.getProgress('compounds');
    if (progress.state === 'updated') {
      debug.info('First importation has been completed. Should only update.');
      return;
    } else {
      debug.info(`Continuing first importation from ${progress.seq}.`);
    }
    // Synchronize the full compounds folder (just once)
    let allFiles;
    if (process.env.NODE_ENV === 'test') {
      allFiles = [
        {
          name: 'compoundsFirstImportTest.sdf.gz',
          path: `../docker/src/plugins/compounds/sync/utils/__tests__/data/compoundsFirstImportTest.sdf.gz`,
        },
      ];
    } else {
      allFiles = await syncCompoundFolder(connection, 'first');
    }
    // Get list of files to import and last document imported
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'first',
    );
    progress.state = 'updating';
    await connection.setProgress(progress);
    // Import the files
    await importCompoundFiles(
      connection,
      progress,
      files,
      { lastDocument },
      'first',
    );
    progress.dateEnd = Date.now();
    progress.state = 'updated';
    await connection.setProgress(progress);
    // create indexes on the compounds collection
    let compoundsCollection = await connection.getCollection('compounds');
    await createIndexes(compoundsCollection, [
      { 'data.nbFragments': 1 },
      { 'data.mf': 1 },
      { 'data.em': 1 },
      { 'data.charge': 1 },
      { 'data.ocl.idCode': 1 },
      { 'data.ocl.noStereoTautomerID': 1 },
      { _seq: 1 },
      {
        'data.mf': 1,
        'data.nbFragments': 1,
        'data.charge': 1,
      },
    ]);
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

export default firstCompoundImport;
