import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import Debug from '../../../../utils/Debug.js';

import getNpassesLastFiles from './getNpassesLastFiles.js';
import readNpassesLastFiles from './readNpassesLastFiles.js';
/**
 * @description get all necessary variables to start npasses sync
 * @param {*} connection - mongo connection
 * @returns {object} returns the variables {lastDocumentImported, progress, sources, collection, general, activities, properties, speciesPair, speciesInfo, logs}
 */
export default async function npassStartSync(connection) {
  const debug = Debug('npassStartSync');
  try {
    // get lastFile, lastFileActivity, lastFileSpeciesProperties, lastFileSpeciesInfo, lastFileSpeciesPair, Sources, progress and logs
    const {
      lastFile,
      lastFileActivity,
      lastFileSpeciesProperties,
      lastFileSpeciesInfo,
      lastFileSpeciesPair,
      sources,
      progress,
      logs,
    } = await getNpassesLastFiles(connection);
    //get npasses collection and last document imported
    const collection = await connection.getCollection('npasses');
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      'npasses',
    );
    // read npasses synchronized files
    const { general, activities, properties, speciesPair, speciesInfo } =
      readNpassesLastFiles(
        lastFile,
        lastFileActivity,
        lastFileSpeciesProperties,
        lastFileSpeciesInfo,
        lastFileSpeciesPair,
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
      logs,
    };
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'npasses', connection, stack: e.stack });
    }
  }
}
