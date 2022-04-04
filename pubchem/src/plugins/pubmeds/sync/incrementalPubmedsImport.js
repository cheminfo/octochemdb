import syncFolder from '../../../sync/http/utils/syncFolder.js';
import removeEntriesFromFile from '../../../sync/utils/removeEntriesFromFile.js';
import Debug from '../../../utils/Debug.js';

import importOnePubmedFile from './utils/importOnePubmedFile.js';

const debug = Debug('incrementalPubmedImport');

async function incrementalPubmedImport(connection) {
  const allFiles = await syncIncrementalPubmedFolder();

  const progress = await connection.getProgress('pubmeds');

  const { files, lastDocument } = await getFilesToImport(
    connection,
    progress,
    allFiles,
  );
  const lastDocumentImported = lastDocument;
  if (
    (!files.includes(lastDocumentImported._source) &&
      progress.state === 'updated') ||
    progress.state !== 'updated'
  ) {
    progress.state = 'updating';
    await connection.setProgress(progress);
    await importPubmedFiles(connection, progress, files, { lastDocument });
    progress.state = 'updated';
    await connection.setProgress(progress);
  }
}

async function importPubmedFiles(connection, progress, files, options) {
  debug('Starting incremental update');
  options = { shouldImport: false, ...options };
  for (let file of files) {
    debug(`Processing: ${file.name}`);
    if (file.name.endsWith('.gz')) {
      await importOnePubmedFile(connection, progress, file, options);
      options.shouldImport = true;
    } else if (file.name.startsWith('killed')) {
      await removeEntriesFromFile(connection, 'pubmeds', file);
    }
  }
}

async function getFilesToImport(connection, progress, allFiles) {
  const collection = await connection.getCollection('pubmeds');
  const lastDocument = await collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();

  if (!lastDocument) {
    throw new Error('This should never happen');
  }

  debug(`last file processed: ${lastDocument._source}`);

  const firstIndex = allFiles.findIndex((n) =>
    n.path.endsWith(lastDocument._source),
  );

  if (firstIndex === -1) {
    debug('Should import all the incremental updates');
    return { files: allFiles, lastDocument: {} };
  }

  debug(`starting with file ${lastDocument._source}`);

  return { lastDocument, files: allFiles.slice(firstIndex) };
}

async function syncIncrementalPubmedFolder() {
  debug('Synchronize incremental pubmed folder');

  const source = `${process.env.PUBMED_SOURCE}updatefiles/`;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/pubmed/update`;
  const files = (
    await syncFolder(source, destination, {
      fileFilter: (file) => file && file.name.endsWith('.gz'),
    })
  ).allFiles;

  return files.sort((a, b) => {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    return 0;
  });
}

export default incrementalPubmedImport;
