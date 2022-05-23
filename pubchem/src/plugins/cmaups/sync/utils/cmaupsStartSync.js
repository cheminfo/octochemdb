import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import Debug from '../../../../utils/Debug.js';

import getCmaupsLastFiles from './getCmaupsLastFiles.js';
import readCmaupFiles from './readCmaupsFiles.js';
const debug = Debug('cmaupsStartSync');

async function cmaupsStartSync(connection) {
  try {
    const [
      lastFile,
      lastFileActivity,
      lastFileSpeciesAssociation,
      lastFileSpeciesInfo,
      sources,
      progress,
      logs,
    ] = await getCmaupsLastFiles(connection);
    const collection = await connection.getCollection('cmaups');
    await collection.createIndex({ 'data.ocl.id': 1 });
    await collection.createIndex({ 'data.ocl.noStereoID': 1 });
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      'cmaups',
    );

    const { general, activities, speciesPair, speciesInfo } =
      await readCmaupFiles(
        lastFile,
        lastFileActivity,
        lastFileSpeciesAssociation,
        lastFileSpeciesInfo,
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
      logs,
    ];
  } catch (e) {
    const optionsDebug = { collection: 'cmaups', connection };
    debug(e, optionsDebug);
  }
}

export default cmaupsStartSync;
