import { readFileSync } from 'fs';

import { fileCollectionFromZip } from 'filelist-utils';
import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import { getTaxonomiesNodes } from './utils/getTaxonomiesNodes.js';
import { parseTaxonomies } from './utils/parseTaxonomies.js';

const debug = debugLibrary('syncTaxonomies');
/**
 * Main entry-point for the NCBI Taxonomy synchronisation job.
 *
 * High-level workflow:
 * 1. Download (or resolve local test fixture for) the NCBI `new_taxdump.zip`
 *    archive containing `rankedlineage.dmp` and `nodes.dmp`.
 * 2. If an update is needed:
 *    a. Extract `rankedlineage.dmp` and `nodes.dmp` from the ZIP.
 *    b. Build a `TaxonomyNodesMap` (taxID → rank) via {@link getTaxonomiesNodes}.
 *    c. Parse `rankedlineage.dmp` row-by-row via {@link parseTaxonomies}.
 *    d. Upsert each taxonomy entry into a temporary collection.
 *    e. Atomically rename `taxonomies_tmp` → `taxonomies`.
 *    f. Persist progress and rebuild indexes on all standard ranks.
 *
 * @param {OctoChemConnection} connection - Active database connection.
 * @returns {Promise<void>}
 */
export async function sync(connection) {
  const options = {
    collectionSource:
      'https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/new_taxdump/new_taxdump.zip',
    destinationLocal: `../originalData/taxonomies/full`,
    collectionName: 'taxonomies',
    filenameNew: 'taxonomies',
    extensionNew: 'zip',
  };
  try {
    let sources;
    let lastFile;
    // --- Test mode: use local fixture (no network) ---
    if (process.env.NODE_ENV === 'test') {
      lastFile = `../docker/src/plugins/taxonomies/sync/utils/__tests__/data/new_taxdump.zip`;
      sources = [
        `../docker/src/plugins/taxonomies/sync/utils/__tests__/data/new_taxdump.zip`,
      ];
    } else {
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`../originalData/`, '')];
    }
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
      process.env.TAXONOMY_UPDATE_INTERVAL,
      connection,
    );

    let counter = 0;
    let imported = 0;
    let start = Date.now();

    // Reimport only when source files changed or last import was incomplete
    if (isTimeToUpdate) {
      const collection = await connection.getCollection(options.collectionName);

      // Extract rankedlineage.dmp from the ZIP archive
      const fileList = (
        await fileCollectionFromZip(/** @type {any} */ (readFileSync(lastFile)))
      ).filter((file) => file.name === 'rankedlineage.dmp');
      const arrayBuffer = await fileList.files[0].arrayBuffer();
      // Mark progress as "updating" so partial runs can be detected
      progress.state = 'updating';
      await connection.setProgress(progress);
      // Create a temporary collection to write into; will be renamed atomically
      const temporaryCollection =
        await connection.getCollection('taxonomies_tmp');
      // Extract nodes.dmp to build the taxID → rank mapping
      const fileListNodes = (
        await fileCollectionFromZip(/** @type {any} */ (readFileSync(lastFile)))
      ).filter((file) => file.name === 'nodes.dmp');

      const arrayBufferNodes = await fileListNodes.files[0].arrayBuffer();
      debug.trace('Get Nodes Taxonomies');
      const nodes = await getTaxonomiesNodes(arrayBufferNodes);
      if (!nodes) {
        throw new Error('Failed to parse taxonomy nodes from nodes.dmp');
      }
      debug.info('start parsing taxonomies');
      // Iterate over all parsed taxonomy entries from rankedlineage.dmp
      for await (const entry of parseTaxonomies(arrayBuffer, nodes, connection)) {
        counter++;
        if (process.env.NODE_ENV === 'test' && counter > 20) break;
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }
        // Stamp a monotonically increasing sequence number
        entry._seq = ++progress.seq;
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );

        imported++;
      }
      // Atomic swap: rename temp collection → final
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // Rebuild indexes on all standard taxonomy rank fields
      await createIndexes(collection, [
        { 'data.phylum': 1 },
        { 'data.class': 1 },
        { 'data.order': 1 },
        { 'data.family': 1 },
        { 'data.genus': 1 },
        { 'data.species': 1 },
        { 'data.organism': 1 },
        { _seq: 1 },
      ]);
      debug.info(`Taxonomies collection updated`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'taxonomies',
        connection,
        stack: err.stack,
      });
    }
  }
}
