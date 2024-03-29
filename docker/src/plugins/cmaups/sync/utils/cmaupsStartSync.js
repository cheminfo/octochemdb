import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import debugLibrary from '../../../../utils/Debug.js';

import getCmaupsLastFiles from './getCmaupsLastFiles.js';
import readCmaupFiles from './readCmaupsFiles.js';

const debug = debugLibrary('cmaupsStartSync');
/**
 * @description get necessary variables to start the sync
 * @param {*} connection the connection to the database
 * @returns {Promise<*>} lastDocumentImported, progress, sources, collection, general, activities, speciesPair, speciesInfo, logs
 */
export default async function cmaupsStartSync(connection) {
  try {
    const [
      lastFile,
      lastFileActivity,
      lastFileSpeciesAssociation,
      lastFileSpeciesInfo,
      lastTargetInfo,
      sources,
      progress,
    ] = await getCmaupsLastFiles(connection);
    const collection = await connection.getCollection('cmaups');
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      'cmaups',
    );

    const { general, activities, speciesPair, speciesInfo, targetInfo } =
      readCmaupFiles(
        lastFile,
        lastFileActivity,
        lastFileSpeciesAssociation,
        lastFileSpeciesInfo,
        lastTargetInfo,

        connection,
      );

    return [
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
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'cmaups',
        connection,
        stack: e.stack,
      });
    }
  }
}
