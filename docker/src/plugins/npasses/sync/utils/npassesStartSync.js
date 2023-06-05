import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import debugLibrary from '../../../../utils/Debug.js';

import getNpassesLastFiles from './getNpassesLastFiles.js';
import readNpassesLastFiles from './readNpassesLastFiles.js';
/**
 * @description get all necessary variables to start npasses sync
 * @param {*} connection - mongo connection
 * @returns {Promise<Object>} returns the variables {lastDocumentImported, progress, sources, collection, general, activities, properties, speciesPair, speciesInfo, logs}
 */
export default async function npassStartSync(connection) {
  const debug = debugLibrary('npassStartSync');
  try {
    // get lastFile, lastFileActivity, lastFileSpeciesProperties, lastFileSpeciesInfo, lastFileSpeciesPair, Sources, progress and logs
    const {
      lastFile,
      lastFileActivity,
      lastFileSpeciesProperties,
      lastFileSpeciesInfo,
      lastFileSpeciesPair,
      lastTargetInfo,
      sources,
      progress,
      logs,
    } = await getNpassesLastFiles(connection);
    //get npasses collection and last document imported
    const collection = await connection.getCollection('npasses');
    const options = { collectionName: 'npasses' };
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );
    // read npasses synchronized files
    const {
      general,
      activities,
      properties,
      speciesPair,
      speciesInfo,
      targetInfo,
    } = readNpassesLastFiles(
      lastFile,
      lastFileActivity,
      lastFileSpeciesProperties,
      lastFileSpeciesInfo,
      lastFileSpeciesPair,
      lastTargetInfo,
      connection,
    );

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
      logs,
    };
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'npasses',
        connection,
        stack: e.stack,
      });
    }
  }
}
