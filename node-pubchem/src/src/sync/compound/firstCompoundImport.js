import Debug from 'debug';

import PubChemConnection, {
  COMPOUNDS_COLLECTION,
} from '../../util/PubChemConnection.js';
import syncFolder from '../http/utils/syncFolder.js';

import importOneCompoundFile from './utils/importOneCompoundFile.js';

const debug = Debug('firstCompoundImport');

async function firstCompoundImport() {
  const allFiles = await syncFullCompoundFolder();

  let connection;
  try {
    connection = new PubChemConnection();
    const progress = await connection.getProgress(COMPOUNDS_COLLECTION);
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
    await importCompoundFiles(connection, progress, files, { lastDocument });
    progress.state = 'update';
    await connection.setProgress(progress);
  } catch (e) {
    console.log(e);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}

async function importCompoundFiles(connection, progress, files, options) {
  options = { shouldImport: progress.seq === 0, ...options };
  for (let file of files) {
    await importOneCompoundFile(connection, progress, file, options);
    options.shouldImport = true;
  }
}

async function getFilesToImport(connection, progress, allFiles) {
  const collection = await connection.getCollection(COMPOUNDS_COLLECTION);
  const lastDocument = await collection
    .find({ seq: { $lte: progress.seq } })
    .sort('_id', -1)
    .limit(1)
    .next();

  if (!lastDocument) return { files: allFiles, lastDocument: {} };

  debug(`last file processed: ${lastDocument.source}`);

  const firstIndex = allFiles.findIndex((n) =>
    n.path.endsWith(lastDocument.source),
  );

  if (firstIndex === -1) {
    throw new Error(`file not found: ${lastDocument.source}`);
  }

  debug(`starting with file ${lastDocument.source}`);

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
