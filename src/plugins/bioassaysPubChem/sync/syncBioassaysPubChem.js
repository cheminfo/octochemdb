import { join } from 'node:path';

import { fileCollectionFromPath } from 'filelist-utils';
import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import syncFolder from '../../../sync/http/utils/syncFolder.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import { decompressAll } from './utils/decompressAll.js';
import { main } from './utils/main.js';

const debug = debugLibrary('syncBioassaysPubChem');

/**
 * Synchronises the `bioassaysPubChem` collection from the PubChem FTP server.
 *
 * Downloads (or reuses a cached copy of) every PubChem bioassay JSON dump,
 * decompresses each AID range archive, then hands the resulting list of
 * `.json.gz` files to a worker pool that parses each assay and upserts it
 * into a temporary MongoDB collection. Once the import is complete the
 * temporary collection atomically replaces the live one and the indexes
 * are rebuilt.
 *
 * The sync is skipped when `shouldUpdate()` determines that neither the
 * source files nor the update interval have changed since the last
 * successful run.
 * @param connection - Active OctoChemDB connection used throughout the sync.
 */
export async function sync(connection) {
  const options = {
    collectionSource: 'https://ftp.ncbi.nlm.nih.gov/pubchem/Bioassay/JSON/',
    destinationLocal: `data/originalData/bioassaysPubChem/full`,
    collectionName: 'bioassaysPubChem',
  };
  try {
    const progress = await connection.getProgress(options.collectionName);
    let sources = [];
    if (process.env.NODE_ENV === 'test') {
      sources = [
        `src/plugins/bioassaysPubChem/sync/utils/__test__/data/syncData/`,
      ];
    } else {
      const { allFiles } = await syncFolder(
        options.collectionSource,
        options.destinationLocal,
        {
          fileFilter: (file) => file && file.name.endsWith('.zip'),
        },
      );
      if (allFiles.length > 0) {
        for (const file of allFiles) {
          sources.push(file?.path);
        }
      }
    }

    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    const isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.BIOASSAYPUBCHEM_UPDATE_INTERVAL,
      connection,
    );
    if (isTimeToUpdate) {
      let sourceFiles = options.destinationLocal;
      if (process.env.NODE_ENV === 'test') {
        sourceFiles =
          'src/plugins/bioassaysPubChem/sync/utils/__test__/data/syncData/';
      }
      const fileList = await fileCollectionFromPath(sourceFiles, {
        unzip: { zipExtensions: [] },
        ungzip: { gzipExtensions: [] },
      });
      let jsonFilesPaths = [];
      for (const file of fileList.files) {
        if (file.name.endsWith('.zip')) {
          const newJsonFilesPaths = await decompressAll(
            join(sourceFiles, file.name),
          );
          jsonFilesPaths = [...newJsonFilesPaths, ...jsonFilesPaths];
        }
      }

      // Set progress to 'updating'; if the import fails a retry will occur after the next interval.
      progress.state = 'updating';
      await connection.setProgress(progress);

      // Workers populate a temporary collection so the live one stays usable during import.
      await main(jsonFilesPaths);

      // Atomically replace the live collection with the freshly populated one.
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });

      // Persist the updated progress document.
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);

      // Rebuild indexes on the new collection.
      const collection = await connection.getCollection(options.collectionName);
      await createIndexes(collection, [
        { 'data.name': 1 },
        { 'data.description': 1 },
        { 'data.comment': 1 },
        { 'data.sids': 1 },
        { 'data.associatedCIDs': 1 },
        { 'data.results.sid': 1 },
      ]);
    } else {
      debug.info(`collection already updated`);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'bioassaysPubChem',
        connection,
        stack: err.stack,
      });
    }
  }
}
