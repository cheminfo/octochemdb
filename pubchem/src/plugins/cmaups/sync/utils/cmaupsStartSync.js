import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import getCmaupsLastFiles from './getCmaupsLastFiles.js';
import readCmaupFiles from './readCmaupsFiles.js';

async function cmaupsStartSync(connection) {
  const {
    lastFile,
    lastFileActivity,
    lastFileSpeciesAssociation,
    lastFileSpeciesInfo,
    sources,
    newFiles,
    progress,
    logs,
  } = await getCmaupsLastFiles(connection);

  const collection = await connection.getCollection('cmaups');
  await collection.createIndex({ 'data.ocl.id': 1 });
  await collection.createIndex({ 'data.ocl.noStereoID': 1 });
  const lastDocumentImported = await getLastDocumentImported(
    connection,
    progress,
    'cmaups',
  );

  let firstID;
  if (lastDocumentImported) {
    firstID = lastDocumentImported._id;
  }

  const { general, activities, speciesPair, speciesInfo } =
    await readCmaupFiles(
      lastFile,
      lastFileActivity,
      lastFileSpeciesAssociation,
      lastFileSpeciesInfo,
    );

  return {
    firstID,
    lastDocumentImported,
    progress,
    sources,
    collection,
    general,
    activities,
    speciesPair,
    speciesInfo,
    newFiles,
    logs,
  };
}
export default cmaupsStartSync;
