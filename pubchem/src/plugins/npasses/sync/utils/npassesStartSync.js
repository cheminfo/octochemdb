import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import getNpassesLastFiles from './getNpassesLastFiles.js';
import readNpassesLastFiles from './readNpassesLastFiles.js';
import Debug from '../../../../utils/Debug.js';

async function npassStartSync(connection) {
  const debug = Debug('npassStartSync');
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
    await collection.createIndex({ 'data.ocl.id': 1 });
    await collection.createIndex({ 'data.ocl.noStereoID': 1 });
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      'npasses',
    );

    const { general, activities, properties, speciesPair, speciesInfo } =
      await readNpassesLastFiles(
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

export default npassStartSync;
