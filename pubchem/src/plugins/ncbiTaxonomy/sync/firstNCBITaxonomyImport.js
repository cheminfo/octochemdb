import Debug from 'debug';

import syncFolder from '../../../sync/http/utils/syncFolder.js';

import importOneTaxonomyFile from './utils/importOneTaoxonomyFile.js';

const debug = Debug('firstNCBITaxonomyImport');

async function firstNCBITaxonomyImport(connection) {
  const allFiles = await syncFullTaxonomyFolder();

  const progress = await connection.getProgress('taxonomies');
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
  await importTaxonomyFiles(connection, progress, files, { lastDocument });
  progress.state = 'update';
  await connection.setProgress(progress);
}

async function importTaxonomyFiles(connection, progress, files, options) {
  options = { shouldImport: progress.seq === 0, ...options };
  for (let file of files) {
    await importOneTaxonomyFile(connection, progress, file, options);
    options.shouldImport = true;
  }
}

async function getFilesToImport(connection, progress, allFiles) {
  const collection = await connection.getCollection('taxonomies');
  const lastDocument = await collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_id', -1)
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

async function syncFullTaxonomyFolder() {
  debug('Synchronize full taxonomy folder');

  const source = `${process.env.TAXONOMY_SOURCE}/`;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/taxonomy/full`;

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

export default firstNCBITaxonomyImport;
