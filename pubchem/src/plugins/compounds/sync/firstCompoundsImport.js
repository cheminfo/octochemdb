import syncFolder from '../../../sync/http/utils/syncFolder.js';
import Debug from '../../../utils/Debug.js';

import importOneCompoundFile from './utils/importOneCompoundFile.js';

const debug = Debug('firstCompoundImport');

async function firstCompoundImport(connection) {
  const progress = await connection.getProgress('compounds');
  if (progress.state === 'updated') {
    debug('First importation has been completed. Should only update.');
    return;
  } else {
    debug(`Continuing first importation from ${progress.seq}.`);
  }

  const allFiles = await syncFullCompoundFolder();

  const { files, lastDocument } = await getFilesToImport(
    connection,
    progress,
    allFiles,
  );
  progress.state = 'updating';
  await connection.setProgress(progress);
  await importCompoundFiles(connection, progress, files, { lastDocument });
  progress.state = 'updated';
  await connection.setProgress(progress);

  let compoundsCollection = await connection.getCollection('compounds');
  await compoundsCollection.createIndex({ 'data.em': 1 });
  await compoundsCollection.createIndex({ 'data.mf': 1 });
  await compoundsCollection.createIndex({ 'data.ocl.id': 1 });
  await compoundsCollection.createIndex({ 'data.ocl.noStereoID': 1 });
  await compoundsCollection.createIndex({ 'data.charge': 1 });
  await compoundsCollection.createIndex({ 'data.nbFragments': 1 });
  await compoundsCollection.createIndex({
    'data.nbFragments': 1,
    'data.charge': 1,
    'data.mf': 1,
  });
}

async function importCompoundFiles(connection, progress, files, options) {
  options = { shouldImport: progress.seq === 0, ...options };
  for (let file of files) {
    await importOneCompoundFile(connection, progress, file, options);
    options.shouldImport = true;
  }
}

async function getFilesToImport(connection, progress, allFiles) {
  const collection = await connection.getCollection('compounds');
  const lastDocument = await collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();

  if (!lastDocument) return { files: allFiles, lastDocument: {} };

  debug(`last file processed: ${lastDocument._source}`);

  const firstIndex = allFiles.findIndex((n) =>
    n.path.endsWith(lastDocument._source),
  );

  if (firstIndex === -1) {
    throw new Error(`file not found: ${lastDocument._source}`);
  }

  debug(`starting with file ${lastDocument._source}`);

  return { lastDocument, files: allFiles.slice(firstIndex) };
}

async function syncFullCompoundFolder() {
  debug('Synchronize full compound folder');

  const source = `${process.env.PUBCHEM_SOURCE}Compound/CURRENT-Full/SDF/`;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/compound/full`;

  debug(`Syncing: ${source} to ${destination}`);

  const { allFiles } = await syncFolder(source, destination, {
    fileFilter: (file) => file && file.name.endsWith('.gz'),
  });

  return allFiles.sort((a, b) => {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    return 0;
  });
}

export default firstCompoundImport;
