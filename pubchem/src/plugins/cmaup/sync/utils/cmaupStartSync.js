import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import getCmaupLastFiles from './getCmaupLastFiles.js';
import readCmaupFiles from './readCmaupFiles.js';

async function cmaupStartSync(connection) {
  const {
    lastFile,
    lastFileActivity,
    lastFileSpeciesAssociation,
    lastFileSpeciesInfo,
    sources,
    newFiles,
    progress,
    logs,
  } = await getCmaupLastFiles(connection);

  const collection = await connection.getCollection('cmaup');
  await collection.createIndex({ 'data.ocl.id': 1 });
  await collection.createIndex({ 'data.ocl.noStereoID': 1 });
  const lastDocumentImported = await getLastDocumentImported(
    connection,
    progress,
    'cmaup',
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
export default cmaupStartSync;
