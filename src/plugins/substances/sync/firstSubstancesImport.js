import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';

import { getFilesToImport } from './utils/getFilesToImport.js';
import { importSubstanceFiles } from './utils/importSubstanceFiles.js';
import { syncSubstanceFolder } from './utils/syncSubstanceFolder.js';

/**
 * Perform the initial full import of PubChem Substance SDF files.
 *
 * Workflow:
 * 1. Check the progress document — if state is already 'updated', skip.
 * 2. In test mode use a local fixture; otherwise synchronise the full
 *    substance folder from the NCBI FTP server.
 * 3. Determine which files still need importing (resume support).
 * 4. Import substances from each file and upsert them into MongoDB.
 * 5. Create indexes on the substances collection.
 * @param connection - MongoDB connection wrapper
 * @returns
 */
async function firstSubstanceImport(connection) {
  const debug = debugLibrary('firstSubstanceImport');
  try {
    const progress = await connection.getProgress('substances');
    if (progress.state === 'updated') {
      debug.info('First importation has been completed. Should only update.');
      return;
    } else {
      debug.info(`Continuing first importation from ${progress.seq}.`);
    }
    // In test mode, use a local fixture file instead of the FTP server
    let allFiles;
    if (process.env.NODE_ENV === 'test') {
      allFiles = [
        {
          name: 'firstImportSubstances.sdf.gz',
          path: `src/plugins/substances/sync/utils/__tests__/data/firstImportSubstances.sdf.gz`,
        },
      ];
    } else {
      allFiles = await syncSubstanceFolder(connection, 'first');
    }
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'first',
    );
    // Mark progress as in-flight before starting the import
    progress.state = 'updating';
    progress.dateEnd = Date.now();
    await connection.setProgress(progress);
    await importSubstanceFiles(
      connection,
      progress,
      files,
      { lastDocument },
      'first',
    );
    // Mark progress as complete after all files have been imported
    progress.state = 'updated';
    await connection.setProgress(progress);

    const substanceCollection = await connection.getCollection('substances');
    await createIndexes(substanceCollection, [
      { naturalProduct: 1 },
      { 'data.ocl.noStereoTautomerID': 1 },
      { _seq: 1 },
    ]);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'substances',
        connection,
        stack: err.stack,
      });
    }
  }
}

export default firstSubstanceImport;
