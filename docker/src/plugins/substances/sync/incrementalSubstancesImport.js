import debugLibrary from '../../../utils/Debug.js';

import { getFilesToImport } from './utils/getFilesToImport.js';
import { importSubstanceFiles } from './utils/importSubstanceFiles.js';
import { syncSubstanceFolder } from './utils/syncSubstanceFolder.js';

/**
 * Perform an incremental (weekly) import of PubChem Substance delta files.
 *
 * Workflow:
 * 1. In test mode use a local fixture; otherwise synchronise the weekly
 *    substance folder from the NCBI FTP server.
 * 2. Verify the first import has completed (state === 'updated').
 * 3. Determine which files still need importing (resume support).
 * 4. Only proceed if enough time has elapsed since the last update
 *    (controlled by PUBCHEM_UPDATE_INTERVAL env var) or in test mode.
 * 5. Import substances and update the progress document.
 *
 * @param {OctoChemConnection} connection - MongoDB connection wrapper
 * @returns {Promise<void>}
 */
async function incrementalSubstanceImport(connection) {
  const debug = debugLibrary('incrementalSubstanceImport');
  try {
    // In test mode, use a local fixture file instead of the FTP server
    let allFiles;
    if (process.env.NODE_ENV === 'test') {
      allFiles = [
        {
          name: 'incrementalImportSubstances.sdf.gz',
          path: `../docker/src/plugins/substances/sync/utils/__tests__/data/incrementalImportSubstances.sdf.gz`,
        },
      ];
    } else {
      allFiles = await syncSubstanceFolder(connection, 'incremental');
    }
    const progress = await connection.getProgress('substances');
    if (progress.state !== 'updated') {
      throw new Error('Should never happens.');
    }
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'incremental',
    );
    // Reset the start date if the update interval has elapsed and sources differ
    if (
      progress.dateEnd !== 0 &&
      Date.now() - progress.dateEnd >
        Number(process.env.PUBCHEM_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
      !files.includes(progress.sources)
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
    }
    // Only import when the update interval has elapsed or running in test mode
    if (
      (!files.includes(progress.sources) &&
        progress.state === 'updated' &&
        Date.now() - progress.dateEnd >
          Number(process.env.PUBCHEM_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000) ||
      process.env.NODE_ENV === 'test'
    ) {
      await importSubstanceFiles(
        connection,
        progress,
        files,
        { lastDocument },
        'incremental',
      );
      progress.dateEnd = Date.now();
      await connection.setProgress(progress);
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'substances',
        connection,
        stack: err.stack,
      });
    }
  }
}

export default incrementalSubstanceImport;
