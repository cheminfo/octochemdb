import syncFolder from '../../../sync/http/utils/syncFolder.js';
import Debug from '../../../utils/Debug.js';

import importOneBioassayFile from './utils/importOneBioassayFile.js';

const debug = Debug('firstBioassayImport');

async function firstBioassayImport(connection) {
  const allFiles = await syncFullBioassayFolder();

  const progress = await connection.getProgress('bioassay');
  if (progress.state === 'update') {
    debug('First importation has been completed. Should only update.');
    return;
  } else {
    debug(`Continuing first importation from ${progress.seq}.`);
  }
  const { files, lastDocument } = await getFilesToImport(
    connection,
    progress,
    allFiles,
  );
  await importBioassayFiles(connection, progress, files, { lastDocument });
  progress.state = 'update';
  await connection.setProgress(progress);
}

async function importBioassayFiles(connection, progress, files, options) {
  options = { shouldImport: progress.seq === 0, ...options };
  let i = 0;
  for (let file of files) {
    i++;
    if (i > 2) break;
    await importOneBioassayFile(connection, progress, file, options);
    options.shouldImport = true;
  }
}

async function getFilesToImport(connection, progress, allFiles) {
  const collection = await connection.getCollection('bioassay');
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

async function syncFullBioassayFolder() {
  debug('Synchronize full substance folder');

  const source = `${process.env.BIOASSAY_SOURCE}`;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/bioassay/full`;

  debug(`Syncing: ${source} to ${destination}`);

  const { allFiles } = await syncFolder(source, destination, {
    fileFilter: (file) => file && file.name.endsWith('.zip'),
  });

  return allFiles.sort((a, b) => {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    return 0;
  });
}

export default firstBioassayImport;
