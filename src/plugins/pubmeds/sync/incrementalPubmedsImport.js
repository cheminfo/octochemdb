import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';

import { getCidFromPmid } from './utils/getCidFromPmid.js';
import { getFilesToImport } from './utils/getFilesToImport.js';
import { importPubmedFiles } from './utils/importPubmedFiles.js';
import { syncPubmedFolder } from './utils/syncPubmedFolder.js';

/**
 * Applies incremental PubMed update files on top of the baseline import.
 *
 * Workflow:
 * 1. Fetch the current progress document.
 * 2. In test mode, use a local fixture; otherwise synchronise the remote
 *    PubMed `updatefiles/` folder to local storage.
 * 3. Determine which update files still need to be applied.
 * 4. Guard: only proceed when the update interval has elapsed **and**
 *    there are new files not yet processed — or when running in test mode.
 * 5. Download the CID→PMID mapping, then import every pending update
 *    file (upserts + deletes) into the `pubmeds` collection.
 * 6. Persist the end timestamp on the progress document.
 * @param connection - Active database connection.
 * @returns
 */
async function incrementalPubmedImport(connection) {
  const debug = debugLibrary('incrementalPubmedImport');
  try {
    const progress = await connection.getProgress('pubmeds');

    // In test mode use a local fixture; in production sync the remote folder
    /** @type {{ name: string; path: string }[]} */
    let allFiles;
    if (process.env.NODE_ENV === 'test') {
      allFiles = [
        {
          name: 'incrementalImportTest.xml.gz',
          path: `src/plugins/pubmeds/sync/utils/__tests__/data/incrementalTest.xml.gz`,
        },
      ];
    } else {
      allFiles = await syncPubmedFolder(connection, 'incremental');
    }

    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'incremental',
    );

    // Convert the update interval from days to milliseconds
    const updateIntervalMs =
      Number(process.env.PUBMED_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000;

    // Record a fresh start timestamp if enough time has elapsed
    if (
      progress.dateEnd !== 0 &&
      Date.now() - progress.dateEnd > updateIntervalMs &&
      !files.includes(progress.sources)
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
    }

    // Only proceed when there are unprocessed files and the interval has passed
    const shouldUpdate =
      (!files.includes(progress.sources) &&
        progress.state === 'updated' &&
        Date.now() - progress.dateEnd > updateIntervalMs) ||
      process.env.NODE_ENV === 'test';

    if (shouldUpdate) {
      // Download the CID→PMID mapping so articles can reference compounds
      /** @type {SyncOptions} */
      const options = {
        collectionSource:
          'https://ftp.ncbi.nlm.nih.gov/pubchem/Compound/Extras/CID-PMID.gz',
        destinationLocal: `data/originalData//pubmeds/cidToPmid`,
        collectionName: 'pubmeds',
        filenameNew: 'cidToPmid',
        extensionNew: 'gz',
      };

      let cidToPmidPath;
      if (process.env.NODE_ENV === 'test') {
        cidToPmidPath = `src/plugins/pubmeds/sync/utils/__tests__/data/cidToPmidTest.gz`;
      } else {
        cidToPmidPath = await getLastFileSync(options);
      }

      const pmidToCid = await getCidFromPmid(cidToPmidPath, connection);

      // Process every pending incremental file (upserts and deletes)
      await importPubmedFiles(
        connection,
        progress,
        files,
        { lastDocument },
        pmidToCid,
        'incremental',
      );

      progress.dateEnd = Date.now();
    }
  } catch (error) {
    if (connection) {
      const err = error instanceof Error ? error : new Error(String(error));
      await debug.fatal(err.message, {
        collection: 'pubmeds',
        connection,
        stack: err.stack,
      });
    }
  }
}

export default incrementalPubmedImport;
