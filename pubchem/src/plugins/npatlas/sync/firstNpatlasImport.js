import Debug from 'debug';

import importOneNpatlasFile from './utils/importOneNpatlasFile.js';
import syncNpAtlasFile from './utils/syncNpAtlasFile.js';

const debug = Debug('firstNpatlasImport');

async function firstNpatlasImport(connection) {
  const allFiles = await syncFullNpAtlasFolder();

  const progress = await connection.getProgress('npAtlas');
  if (progress.state === 'update') {
    debug('First importation has been completed. Should only update.');
  } else {
    debug(`Continuing first importation from ${progress.seq}.`);
  }
  const { files, lastDocument } = await getFilesToImport(
    connection,
    progress,
    allFiles,
  );
  await importNpAtlasFiles(connection, progress, files, { lastDocument });
  progress.state = 'update';
  await connection.setProgress(progress);
}

async function importNpAtlasFiles(connection, progress, files, options) {
  options = { shouldImport: progress.seq === 0, ...options };
  for (let file of files) {
    await importOneNpatlasFile(connection, progress, file, options);
    options.shouldImport = true;
  }
}

async function getFilesToImport(connection, progress, allFiles) {
  const collection = await connection.getCollection('npAtlas');
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

async function syncFullNpAtlasFolder() {
  debug('Synchronize full npAtlas folder');

  const source = `${process.env.NPATLAS_SOURCE}`;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/npAtlas/full`;

  debug(`Syncing: ${source} to ${destination}`);

  const { allFiles } = await syncNpAtlasFile(source, destination);

  return allFiles.sort((a, b) => {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    return 0;
  });
}

export default firstNpatlasImport;
