import pkg from 'fs-extra';
import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import addNbCompoundsToPatents from './utils/addNbCompoundsToPatents.js';
import importCompoundPatents from './utils/importCompoundPatents.js';
import ungzipAndSort from './utils/ungzipAndSort.js';

const { existsSync, rmSync } = pkg;

/**
 * Synchronises the `compoundPatents` collection from the PubChem
 * CID-to-patent mapping file.
 *
 * The function:
 * 1. Determines whether an update is needed by comparing the stored progress
 *    timestamp against `COMPOUND_PATENTS_UPDATE_INTERVAL` (days).
 * 2. Downloads the latest `CID-Patent.gz` file from PubChem FTP (or uses a
 *    local test fixture in the test environment).
 * 3. Decompresses and sorts the file by CID with `ungzipAndSort` so that
 *    `importCompoundPatents` can group lines efficiently.
 * 4. Imports the sorted file into a temporary collection which is then
 *    atomically renamed to `compoundPatents`.
 * 5. Creates indexes on `data.patents`, `data.nbPatents`, and `_seq`.
 * 6. Calls `addNbCompoundsToPatents` to backfill `data.nbCompounds` on every
 *    document in the `patents` collection based on the freshly imported data.
 * 7. Removes the temporary sorted file from disk.
 *
 * @async
 * @param {OctoChemConnection} connection - An active OctoChemConnection instance.
 * @returns {Promise<void>}
 */
export async function sync(connection) {
  const debug = debugLibrary('syncCompoundPatents');
  try {
    let options = {
      collectionSource:
        'https://ftp.ncbi.nlm.nih.gov/pubchem/Compound/Extras/CID-Patent.gz',
      destinationLocal: `../originalData/compoundPatents/cidToPatents`,
      collectionName: 'compoundPatents',
      filenameNew: 'cidToPatents',
      extensionNew: 'gz',
    };
    let sources;
    let lastFile;
    const progress = await connection.getProgress('compoundPatents');
    if (process.env.NODE_ENV === 'test') {
      lastFile = `../docker/src/plugins/compoundPatents/sync/utils/__tests__/data/patentsTest.gz`;
      sources = [lastFile];
    }
    // get last files cidToPatens available in the PubChem database
    else if (
      Date.now() - Number(progress.dateEnd) >
      Number(process.env.COMPOUND_PATENTS_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000
    ) {
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`../originalData/`, '')];
    } else {
      sources = progress.sources; // this will prevent to update the collection
    }
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    let isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.COMPOUND_PATENTS_UPDATE_INTERVAL,
      connection,
    );

    if (isTimeToUpdate) {
      progress.state = 'updating';
      await connection.setProgress(progress);
      debug.info('start sync compoundPatents');
      //sort file by cid
      if (!lastFile) {
        throw new Error('No source file available to sync compoundPatents');
      }
      const sortedFile = `${lastFile.split('.gz')[0]}.sorted`;
      await ungzipAndSort(lastFile, sortedFile);
      debug.trace('ungzip and sort done');

      await importCompoundPatents(sortedFile, connection);
      const collection = await connection.getCollection(options.collectionName);
      // create indexes
      await createIndexes(collection, [
        { 'data.patents': 1 },
        { 'data.nbPatents': 1 },
        { _seq: 1 },
      ]);

      // Populate data.nbCompounds on every patent document now that
      // compoundPatents contains fresh data.
      await addNbCompoundsToPatents(connection);

      // update Logs
      progress.sources = md5(JSON.stringify(sources));
      progress.state = 'updated';
      progress.dateEnd = Date.now();
      await connection.setProgress(progress);

      debug.info('Sync compoundPatents completed');
      // remove recursively the sorted file
      if (existsSync(sortedFile)) {
        rmSync(sortedFile, { recursive: true });
      }
    }
  } catch (e) {
    if (connection) {
      const error = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(error.message, {
        collection: 'compoundPatents',
        connection,
        stack: error.stack,
      });
    }
  }
}
