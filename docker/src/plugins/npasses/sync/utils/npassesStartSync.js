import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import debugLibrary from '../../../../utils/Debug.js';

import getNpassesLastFiles from './getNpassesLastFiles.js';
import readNpassesLastFiles from './readNpassesLastFiles.js';

/**
 * Bootstraps all resources required before the main NPASS sync loop can run.
 *
 * Execution flow:
 * 1. Calls {@link getNpassesLastFiles} to download (or resolve local test)
 *    all six NPASS TSV files and obtain the source fingerprints + progress
 *    document.
 * 2. Calls {@link readNpassesLastFiles} to read the TSV files from disk,
 *    parse them with PapaParse, and build the lookup maps (`activities`,
 *    `properties`, `speciesPair`, `speciesInfo`, `targetInfo`) that
 *    `parseNpasses` will consume.
 * 3. Retrieves the `npasses` MongoDB collection reference and the document
 *    that was last imported (used for change-detection by `shouldUpdate`).
 * 4. Returns all of the above bundled into an {@link NpassesStartSyncResult}
 *    so that the caller (`syncNpasses`) has everything it needs.
 *
 * @param {OctoChemConnection} connection - Active database connection used
 *   for fetching collections, progress documents, and error logging.
 * @returns {Promise<NpassesStartSyncResult | undefined>} All sync
 *   prerequisites, or `undefined` if a fatal error is caught.
 */
export default async function npassStartSync(connection) {
  const debug = debugLibrary('npassStartSync');
  try {
    // Step 1 – Resolve / download all six TSV source files
    /** @type {NpassesLastFiles} */
    const npassesFiles = /** @type {any} */ (
      await getNpassesLastFiles(connection)
    );
    const {
      lastFile,
      lastFileActivity,
      lastFileSpeciesProperties,
      lastFileSpeciesInfo,
      lastFileSpeciesPair,
      lastTargetInfo,
      sources,
      progress,
    } = npassesFiles;
    // Step 2 – Obtain the target MongoDB collection and last-imported doc
    const collection = await connection.getCollection('npasses');
    const options = { collectionName: 'npasses' };
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    // Step 3 – Read and parse the downloaded TSV files into lookup maps
    /** @type {NpassesParsedFiles} */
    const parsedFiles = /** @type {any} */ (
      await readNpassesLastFiles(
        lastFile,
        lastFileActivity,
        lastFileSpeciesProperties,
        lastFileSpeciesInfo,
        lastFileSpeciesPair,
        lastTargetInfo,
        connection,
      )
    );
    const {
      general,
      activities,
      properties,
      speciesPair,
      speciesInfo,
      targetInfo,
    } = parsedFiles;

    return {
      lastDocumentImported,
      progress,
      sources,
      collection,
      general,
      activities,
      properties,
      speciesPair,
      speciesInfo,
      targetInfo,
    };
  } catch (e) {
    if (connection) {
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'npasses',
        connection,
        stack: err.stack,
      });
    }
  }
}
