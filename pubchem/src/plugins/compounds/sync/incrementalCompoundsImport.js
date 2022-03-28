import Debug from 'debug';

import getFilesList from '../../../sync/http/utils/getFilesList.js';
import syncFolder from '../../../sync/http/utils/syncFolder.js';
import removeEntriesFromFile from '../../../sync/utils/removeEntriesFromFile.js';

import importOneCompoundFile from './utils/importOneCompoundFile.js';

const debug = Debug('incrementalCompoundImport');

async function incrementalCompoundImport(connection) {
  const allFiles = await syncIncrementalCompoundFolder();

  const progress = await connection.getProgress('compounds');
  if (progress.state !== 'update') {
    throw new Error('Should never happens.');
  }
  const { files, lastDocument } = await getFilesToImport(
    connection,
    progress,
    allFiles,
  );
  await importCompoundFiles(connection, progress, files, { lastDocument });
  await connection.setProgress(progress);
}

async function importCompoundFiles(connection, progress, files, options) {
  options = { shouldImport: false, ...options };
  for (let file of files) {
    if (file.name.endsWith('.gz')) {
      await importOneCompoundFile(connection, progress, file, options);
      options.shouldImport = true;
    } else if (file.name.startsWith('killed')) {
      await removeEntriesFromFile(connection, 'compounds', file);
    }
  }
}

async function getFilesToImport(connection, progress, allFiles) {
  const collection = await connection.getCollection('compounds');
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

async function syncIncrementalCompoundFolder() {
  debug('Synchronize incremental compound folder');

  const source = `${process.env.PUBCHEM_SOURCE}Compound/Weekly/`;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/compound/weekly`;
  const allFiles = [];
  const weeks = await getFilesList(source, {
    fileFilter: (file) => file && file.name.match(/\d{4}-\d{2}-\d{2}/),
  });
  for (let week of weeks) {
    const baseSource = `${source}/${week.name}`;
    debug(`Processing week: ${week.name}`);
    allFiles.push(
      ...(
        await syncFolder(`${baseSource}SDF/`, `${destination}/${week.name}/`, {
          fileFilter: (file) => file && file.name.endsWith('.gz'),
        })
      ).allFiles,
    );
    allFiles.push(
      ...(
        await syncFolder(`${baseSource}/`, `${destination}/${week.name}/`, {
          fileFilter: (file) => file && file.name.endsWith('killed-CIDs'),
        })
      ).allFiles,
    );
  }

  return allFiles.sort((a, b) => {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    return 0;
  });
}

export default incrementalCompoundImport;
