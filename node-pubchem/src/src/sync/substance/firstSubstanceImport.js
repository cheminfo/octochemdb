import Debug from 'debug';

import PubChemConnection from '../../util/PubChemConnection.js';
import syncFolder from '../http/utils/syncFolder.js';

import importOneSubstanceFile from './utils/importOneSubstanceFile.js';

const debug = Debug('firstSubstanceImport');

const COLLECTION = 'substances';

async function firstSubstanceImport() {
  const allFiles = await syncFullSubstanceFolder();

  let connection;
  try {
    connection = new PubChemConnection();
    const progress = await connection.getProgress(COLLECTION);
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
    await importSubstanceFiles(connection, progress, files, { lastDocument });
    progress.state = 'update';
    await connection.setProgress(progress);
  } catch (e) {
    console.log(e);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}

async function importSubstanceFiles(connection, progress, files, options) {
  options = { shouldImport: false, ...options };
  for (let file of files) {
    await importOneSubstanceFile(connection, progress, file, options);
    options.shouldImport = true;
  }
}

async function getFilesToImport(connection, progress, allFiles) {
  const collection = await connection.getCollection(COLLECTION);
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

async function syncFullSubstanceFolder() {
  debug('Synchronize full substance folder');

  const source = `${process.env.PUBCHEM_SOURCE}Substance/CURRENT-Full/SDF/`;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/substance/full`;

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

export default firstSubstanceImport;
