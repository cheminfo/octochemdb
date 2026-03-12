import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';
import { taxonomySynonyms } from '../../activesOrNaturals/utils/utilsTaxonomies/taxonomySynonyms.js';

import parseBioactivities from './utils/parseBioactivities.js';

const debug = debugLibrary('syncBioassays');

/**
 * Synchronises the `bioassays` collection from the PubChem FTP server.
 *
 * Downloads (or reuses a cached copy of) the bioactivities and bioassays dump
 * files, then streams every active compound–assay pair through
 * `parseBioactivities()` into a temporary MongoDB collection. Once the import
 * is complete the temporary collection atomically replaces the live one and
 * the collection indexes are rebuilt.
 *
 * The sync is skipped when `shouldUpdate()` determines that neither the source
 * files nor the update interval have changed since the last successful run.
 *
 * @param {OctoChemConnection} connection - Active OctoChemDB connection used throughout the sync.
 * @returns {Promise<void>}
 */
export async function sync(connection) {
  /** @type {SyncOptions} */
  const options = {
    collectionSource:
      'https://ftp.ncbi.nlm.nih.gov/pubchem/Bioassay/Extras/bioactivities.tsv.gz',
    destinationLocal: `../originalData/bioassays/full`,
    collectionName: 'bioassays',
    filenameNew: 'bioactivities',
    extensionNew: 'tsv.gz',
  };
  try {
    const progress = await connection.getProgress(options.collectionName);
    let bioactivitiesFile;
    let bioassaysFile;
    let sources;
    if (process.env.NODE_ENV === 'test') {
      bioactivitiesFile = `../docker/src/plugins/bioassays/sync/utils/__tests__/data/bioactivities.tsv.gz`;
      bioassaysFile = `../docker/src/plugins/bioassays/sync/utils/__tests__/data/bioassays.tsv.gz`;
      sources = [bioassaysFile, bioactivitiesFile];
    } else {
      // Download the bioActivities and bioAssays files if newer than last sync
      bioactivitiesFile = await getLastFileSync(options);
      options.collectionSource =
        'https://ftp.ncbi.nlm.nih.gov/pubchem/Bioassay/Extras/bioassays.tsv.gz';
      options.filenameNew = 'bioassays';
      bioassaysFile = await getLastFileSync(options);
      // Get progress of last sync and the bioassays collection
      sources = [
        bioassaysFile.replace(`../originalData/`, ''),
        bioactivitiesFile.replace(`../originalData/`, ''),
      ];
    }

    // Get the last document imported
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    const isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.BIOASSAY_UPDATE_INTERVAL,
      connection,
    );
    // Define counters
    let counter = 0;
    let imported = 0;
    let start = Date.now();

    if (isTimeToUpdate) {
      // Get compounds and taxonomies collections
      const oldToNewTaxIDs = /** @type {DeprecatedTaxIdMap} */ (
        await taxonomySynonyms()
      );
      /** @type {TaxonomyCollection} */
      const collectionTaxonomies = await connection.getCollection('taxonomies');
      /** @type {CompoundCollection} */
      const collectionCompounds = await connection.getCollection('compounds');
      const collection = await connection.getCollection(options.collectionName);

      // Set progress to 'updating'; if the import fails a retry will occur after the next interval.
      progress.state = 'updating';
      await connection.setProgress(progress);

      // Temporary collection to accumulate the new data before swapping it in.
      /** @type {BioactivityCollection} */
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      debug.info(`Start importing bioassays`);
      for await (const entry of parseBioactivities(
        bioactivitiesFile,
        bioassaysFile,
        connection,
        collectionCompounds,
        collectionTaxonomies,
        oldToNewTaxIDs,
      )) {
        // In test mode stop early to keep test runs fast.
        if (process.env.NODE_ENV === 'test' && counter > 20) break;
        // Throttled progress trace.
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }
        // Stamp the sequence counter and upsert into the temporary collection.
        entry._seq = ++progress.seq;
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );

        imported++;
        counter++;
      }
      // Atomically replace the live collection with the freshly populated one.
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });

      // Persist the updated progress document.
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      debug.info(`${imported} compounds processed`);

      // Rebuild indexes on the new collection.
      await createIndexes(collection, [
        { 'data.ocl.noStereoTautomerID': 1 },
        { 'data.ocl.idCode': 1 },
        { _seq: 1 },
      ]);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: options.collectionName,
        connection,
        stack: err.stack,
      });
    }
  }
}
