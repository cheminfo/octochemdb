import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import debugLibrary from '../../../utils/Debug.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import getTitlesAndAbstracts from './utils/https/getTitlesAndAbstract.js';
import insertAbstract from './utils/insertAbstract.js';
import insertTitle from './utils/insertTitle.js';
/**
 * Synchronises the `patents` collection from the PubChem RDF patent feed.
 *
 * The function:
 * 1. Determines whether an update is needed by comparing the stored progress
 *    timestamp against `PATENT_UPDATE_INTERVAL` (days).
 * 2. Downloads (or reuses test fixtures for) the patent title and abstract
 *    TTL/GZ files from the PubChem FTP server.
 * 3. Parses and inserts titles then abstracts into a temporary collection.
 * 4. Renames the temporary collection to `patents`, drops the old
 *    one, and rebuilds the required indexes.
 * 5. Persists the updated progress record.
 * 6. `data.nbCompounds` is populated separately by `addNbCompoundsToPatents`
 *    after `syncCompoundPatents` completes.
 *
 * @async
 * @param {OctoChemConnection} connection
 *   An active OctoChemConnection instance.
 * @returns {Promise<void>} Resolves when synchronisation is complete or when
 *   no update is needed.
 */
export async function sync(connection) {
  const debug = debugLibrary('syncPatents');
  try {
    // Base configuration: local download directory and target collection name.
    let options = {
      destinationLocal: `../originalData//patents/`,
      collectionName: 'patents',
    };
    let sources;
    let titlesAndPatents;
    let titles2parse;
    let abstracts2parse;

    // Retrieve (or create) the progress document for this collection so we can
    // decide whether a fresh sync is required and track sequence numbers.
    const progress = await connection.getProgress('patents');
    if (!progress) {
      throw new Error('Failed to retrieve progress for patents');
    }

    if (process.env.NODE_ENV === 'test') {
      // In the test environment use local fixture files to avoid network I/O.
      titles2parse = [
        '../docker/src/plugins/patents/sync/utils/__tests__/data/pc_patent2title.ttl.gz',
      ];
      abstracts2parse = [
        '../docker/src/plugins/patents/sync/utils/__tests__/data/pc_patetn2abstract.ttl.gz',
      ];
      // Build the combined source list used for the md5 checksum.
      sources = [...titles2parse, ...abstracts2parse];
    } else if (
      // Check whether enough time has elapsed since the last successful sync.
      Date.now() - Number(progress.dateEnd) >
      Number(process.env.PATENT_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000
    ) {
      // Download the latest title and abstract dumps from PubChem FTP.
      titlesAndPatents = await getTitlesAndAbstracts(
        'https://ftp.ncbi.nlm.nih.gov/pubchem/RDF/patent/',
        `../originalData//patents/`,
      );
      titles2parse = titlesAndPatents?.titlesDownloaded;
      abstracts2parse = titlesAndPatents?.abstractsDownloaded;

      // Combine both lists into a single source manifest for change detection.
      sources = [...(titles2parse ?? []), ...(abstracts2parse ?? [])];
    } else {
      // The interval has not elapsed — reuse the stored sources hash so that
      // shouldUpdate() will decide no update is needed.
      sources = progress.sources;
    }
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    let isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.PATENT_UPDATE_INTERVAL,
      connection,
    );

    if (isTimeToUpdate) {
      // Mark the collection as currently being updated so that other processes
      // or health checks can detect an in-progress sync.
      progress.state = 'updating';
      await connection.setProgress(progress);

      if (titles2parse && abstracts2parse) {
        // Insert patent titles first; each file is processed sequentially to
        // keep memory usage bounded.
        for (let title of titles2parse) {
          await insertTitle(title, connection);
        }
        // Insert abstracts after all titles are present so cross-references
        // between the two are always resolvable.
        for (let abstract of abstracts2parse) {
          await insertAbstract(abstract, connection);
        }
      }

      // Atomically swap the temporary collection into place, dropping whatever
      // previously existed under the production name.
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });

      const collection = await connection.getCollection(options.collectionName);

      // Full-text index with title weighted 10× higher than abstract, used by
      // the search routes.
      await collection.createIndex(
        { 'data.title': 'text', 'data.abstract': 'text' },
        { weights: { 'data.title': 10, 'data.abstract': 1 } },
      );
      // Numeric index on compound count to support range/sort queries.
      await collection.createIndex({ 'data.nbCompounds': 1 });

      // Persist the md5 checksum of the processed source list so that
      // shouldUpdate() can detect future changes.
      progress.sources = md5(JSON.stringify(sources));
      progress.state = 'updated';
      progress.dateEnd = Date.now();
      await connection.setProgress(progress);
    }
  } catch (e) {
    if (connection) {
      // Narrow the unknown catch binding before accessing Error properties.
      const error = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(error.message, {
        collection: 'patents',
        connection,
        stack: error.stack,
      });
    }
  }
}
