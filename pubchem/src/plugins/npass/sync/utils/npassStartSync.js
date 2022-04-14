import getLastDocumentImported from '../../../../sync/http/utils/getLastDocumentImported.js';
import getNpassLastFiles from './getNpassLastFiles.js';
import readNpassLastFiles from './readNpassLastFiles.js';

async function npassStartSync(connection) {
  const {
    lastFile,
    lastFileActivity,
    lastFileSpeciesProperties,
    lastFileSpeciesInfo,
    lastFileSpeciesPair,
    sources,
    progress,
    logs,
  } = await getNpassLastFiles(connection);
  const collection = await connection.getCollection('npass');
  await collection.createIndex({ 'data.ocl.id': 1 });
  await collection.createIndex({ 'data.ocl.noStereoID': 1 });
  const lastDocumentImported = await getLastDocumentImported(
    connection,
    progress,
    'npass',
  );

  let firstID;
  if (lastDocumentImported) {
    firstID = lastDocumentImported._id;
  }

  const { general, activities, properties, speciesPair, speciesInfo } =
    await readNpassLastFiles(
      lastFile,
      lastFileActivity,
      lastFileSpeciesProperties,
      lastFileSpeciesInfo,
      lastFileSpeciesPair,
    );

  return {
    firstID,
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
}
export default npassStartSync;
