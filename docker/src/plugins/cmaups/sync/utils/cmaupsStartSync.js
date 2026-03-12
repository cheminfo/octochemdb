import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import debugLibrary from '../../../../utils/Debug.js';

import getCmaupsLastFiles from './getCmaupsLastFiles.js';
import readCmaupFiles from './readCmaupsFiles.js';

const debug = debugLibrary('cmaupsStartSync');
/**
 * Bootstraps all state required by the CMAUP sync loop: downloads (or locates)
 * the five source files, parses them, retrieves the last imported entry, and
 * returns everything as a single positional tuple.
 *
 * Errors are persisted to the admin collection via `debug.fatal` and the
 * function returns `undefined`; they are not re-thrown.
 *
 * @param {OctoChemConnection} connection - Active database connection wrapper.
 *   Used to fetch the progress document, the live collection handle, and the
 *   last imported document.
 * @returns {Promise<CmaupsStartSyncResult | undefined>}
 */
export default async function cmaupsStartSync(connection) {
  try {
    /** @type {any} */
    const lastFilesRaw = await getCmaupsLastFiles(connection);
    /** @type {CmaupsLastFilesResult} */
    const [
      lastFile,
      lastFileActivity,
      lastFileSpeciesAssociation,
      lastFileSpeciesInfo,
      lastTargetInfo,
      sources,
      progress,
    ] = lastFilesRaw;
    const collection = await connection.getCollection('cmaups');
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      'cmaups',
    );

    /** @type {any} */
    const filesDataRaw = readCmaupFiles(
      lastFile,
      lastFileActivity,
      lastFileSpeciesAssociation,
      lastFileSpeciesInfo,
      lastTargetInfo,
      connection,
    );
    /** @type {CmaupsFilesData} */
    const { general, activities, speciesPair, speciesInfo, targetInfo } =
      filesDataRaw;

    /** @type {CmaupsStartSyncResult} */
    const result = [
      lastDocumentImported,
      progress,
      sources,
      collection,
      general,
      activities,
      speciesPair,
      speciesInfo,
      targetInfo,
    ];
    return result;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'cmaups',
        connection,
        stack: err.stack,
      });
    }
  }
}
