import pkg from 'fs-extra';
import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';
import { decompressGziped } from '../../pubmeds/sync/utils/decompressGziped.js';

import importTitleCompounds from './utils/importTitleCompounds.js';

const { existsSync, rmSync } = pkg;
/**
 * Downloads the PubChem CID-Title mapping file (`CID-Title.gz`),
 * decompresses it, and imports compound-ID-to-title associations into
 * the `titleCompounds` MongoDB collection.
 *
 * Workflow:
 * 1. Determine the source file – a local test fixture or a fresh
 *    download from the NCBI FTP server.
 * 2. Check whether an update is due based on time interval and hash
 *    comparison of previously imported sources.
 * 3. If an update is required:
 *    a. Decompress the `.gz` archive.
 *    b. Stream-parse the TSV and upsert each `CID → title` mapping
 *       into a temporary collection, then atomically rename it.
 *    c. Create an index on `data.title`.
 *    d. Persist progress metadata and clean up the extracted file.
 *
 * @param {OctoChemConnection} connection - Active database connection.
 * @returns {Promise<void>}
 */
export async function sync(connection) {
  const debug = debugLibrary('syncTitleCompounds');
  try {
    const options = {
      collectionSource:
        'https://ftp.ncbi.nlm.nih.gov/pubchem/Compound/Extras/CID-Title.gz',
      destinationLocal: `../originalData//titleCompounds/`,
      collectionName: 'titleCompounds',
      filenameNew: 'cidToTitle',
      extensionNew: 'gz',
    };
    let sources;
    let lastFile;
    const progress = await connection.getProgress('titleCompounds');
    // In test mode use a local fixture; otherwise fetch from FTP
    if (process.env.NODE_ENV === 'test') {
      lastFile = `../docker/src/plugins/titleCompounds/sync/utils/__tests__/data/CID-Title.gz`;
      sources = [lastFile];
    } else if (
      // Check whether the configured update interval has elapsed
      Date.now() - Number(progress.dateEnd) >
      Number(process.env.TITLECOMPOUNDS_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000
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
    const isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.TITLECOMPOUNDS_UPDATE_INTERVAL,
      connection,
    );

    if (isTimeToUpdate) {
      progress.state = 'updating';
      await connection.setProgress(progress);
      debug.info('start sync compoundPatents');
      // Decompress the .gz archive and stream-import title mappings
      const extractedFile = await decompressGziped(lastFile);
      await importTitleCompounds(extractedFile, connection);
      const collection = await connection.getCollection(options.collectionName);
      await collection.createIndex({ 'data.title': 1 });

      // Persist sync progress metadata
      progress.sources = md5(JSON.stringify(sources));
      progress.state = 'updated';
      progress.dateEnd = Date.now();
      await connection.setProgress(progress);

      debug.info('Sync titleCompounds completed');
      // Clean up the decompressed file to reclaim disk space
      if (existsSync(extractedFile)) {
        rmSync(extractedFile, { recursive: true });
      }
    }
  } catch (e) {
    if (connection) {
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'titleCompounds',
        connection,
        stack: err.stack,
      });
    }
  }
}
