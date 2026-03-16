import { readFileSync } from 'fs';

import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';
import { taxonomySynonyms } from '../../activesOrNaturals/utils/utilsTaxonomies/taxonomySynonyms.js';

import { checkNpAtlasesLink } from './utils/checkNpAtlasesLink.js';
import { getTaxonomiesForNpAtlases } from './utils/getTaxonomiesForNpAtlases.js';
import { parseNpatlases } from './utils/parseNpatlases.js';
/**
 * Main entry-point for the NPAtlas synchronisation job.
 *
 * High-level workflow:
 * 1. Download (or resolve local test fixture for) the NPAtlas JSON file.
 * 2. Check whether the download URL is still valid on the NPAtlas website.
 * 3. Load the deprecated-to-current taxonomy-ID map via `taxonomySynonyms`.
 * 4. If an update is needed:
 *    a. Parse every compound from the JSON via {@link parseNpatlases}.
 *    b. Enrich taxonomy data using {@link getTaxonomiesForNpAtlases}.
 *    c. Upsert each enriched entry into a temporary collection.
 *    d. Atomically rename `npAtlases_tmp` → `npAtlases`.
 *    e. Persist progress and rebuild indexes.
 *
 * @param {OctoChemConnection} connection - Active database connection.
 * @returns {Promise<void>}
 */
export async function sync(connection) {
  const debug = debugLibrary('syncNpAtlases');
  try {
    const options = {
      collectionSource:
        'https://www.npatlas.org/static/downloads/NPAtlas_download.json',
      destinationLocal: `../originalData/npAtlases/full`,
      collectionName: 'npAtlases',
      filenameNew: 'npAtlases',
      extensionNew: 'json',
    };
    let sources;
    let lastFile;
    // --- Test mode: use local fixture (no network) ---
    if (process.env.NODE_ENV === 'test') {
      lastFile = `../docker/src/plugins/npAtlases/sync/utils/__tests__/data/npAtlasTest.json`;
      sources = [lastFile];
    } else {
      // --- Production mode: download from NPAtlas ---
      // Verify the remote URL hasn't moved
      await checkNpAtlasesLink([options.collectionSource], connection);
      // Download (or reuse cached) latest NPAtlas file
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`../originalData/`, '')];
    }
    // Load deprecated → current taxonomy-ID mapping for normalisation
    /** @type {DeprecatedTaxIdMap} */
    const oldToNewTaxIDs = /** @type {any} */ (await taxonomySynonyms());
    // Obtain the taxonomies collection for enrichment queries
    const collectionTaxonomies = await connection.getCollection('taxonomies');
    // Retrieve sync progress and last-imported document for change detection
    const progress = await connection.getProgress(options.collectionName);

    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    // Check whether the source fingerprint has changed since the last run
    let isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.NPATLAS_UPDATE_INTERVAL,
      connection,
    );

    // Read the full JSON file into memory (file is small enough)
    const fileJson = readFileSync(lastFile, 'utf8');

    // define counters
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    // Reimport only when source files changed or last import was incomplete
    if (isTimeToUpdate) {
      const collection = await connection.getCollection(options.collectionName);

      // Create a temporary collection to write into; will be renamed atomically
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      debug.info(`Start importing npAtlases`);
      // Mark progress as "updating" so partial runs can be detected
      progress.state = 'updating';
      await connection.setProgress(progress);
      // Iterate over all parsed compounds from the NPAtlas JSON
      for await (const entry of parseNpatlases(
        JSON.parse(fileJson),
        connection,
      )) {
        if (process.env.NODE_ENV === 'test' && counter > 20) break;
        counter++;
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }
        /// Enrich taxonomy data with standardised IDs from the taxonomies collection
        if (entry.data.taxonomies) {
          // Resolve taxonomy via species, genus ID, genus, family, class, phylum cascade
          const taxonomies = await getTaxonomiesForNpAtlases(
            entry,
            collectionTaxonomies,
            oldToNewTaxIDs,
          );
          entry.data.taxonomies = taxonomies;
        }
        // Upsert the enriched document into the temporary collection
        entry._seq = ++progress.seq;
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );
        imported++;
      }
      // Atomic swap: rename temp collection → final (drops the old npAtlases)
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });

      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // Rebuild indexes on the freshly-swapped collection
      await createIndexes(collection, [
        { 'data.ocl.noStereoTautomerID': 1 },
        { _seq: 1 },
      ]);

      debug.info(`npAtlases collection imported`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'npAtlases',
        connection,
        stack: err.stack,
      });
    }
  }
}
