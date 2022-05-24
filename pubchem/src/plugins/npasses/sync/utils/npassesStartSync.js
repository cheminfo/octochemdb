import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import Debug from '../../../../utils/Debug.js';

import getNpassesLastFiles from './getNpassesLastFiles.js';
import readNpassesLastFiles from './readNpassesLastFiles.js';

const debug = Debug('npassStartSync');

export default async function npassStartSync(connection) {
  try {
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
    const collection = await connection.getCollection('npasses');

    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      'npasses',
    );

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
    const optionsDebug = { collection: 'npasses', connection };
    debug(e, optionsDebug);
  }
}


