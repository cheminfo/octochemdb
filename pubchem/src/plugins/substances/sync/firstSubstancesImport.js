import syncFolder from '../../../sync/http/utils/syncFolder.js';
import Debug from '../../../utils/Debug.js';

import importOneSubstanceFile from './utils/importOneSubstanceFile.js';

const debug = Debug('firstSubstanceImport');

async function firstSubstanceImport(connection) {
  try {
    const progress = await connection.getProgress('substances');
    if (progress.state === 'updated') {
      debug('First importation has been completed. Should only update.');
      return;
    } else {
      debug(`Continuing first importation from ${progress.seq}.`);
    }
    const allFiles = await syncFullSubstanceFolder(connection);
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
    );
    progress.state = 'updating';
    await connection.setProgress(progress);
    await importSubstanceFiles(connection, progress, files, { lastDocument });
    progress.state = 'updated';
    await connection.setProgress(progress);

    let substanceCollection = await connection.getCollection('substances');
    await substanceCollection.createIndex({ _id: 1 });
    await substanceCollection.createIndex({ _seq: 1 });
    await substanceCollection.createIndex({ naturalProduct: 1 });
    await substanceCollection.createIndex({ 'data.ocl.noStereoID': 1 });
  } catch (e) {
    const optionsDebug = { collection: 'substances', connection };
    debug(e, optionsDebug);
  }
}

async function importSubstanceFiles(connection, progress, files, options) {
  try {
    options = { shouldImport: progress.seq === 0, ...options };
    for (let file of files) {
      await importOneSubstanceFile(connection, progress, file, options);
      options.shouldImport = true;
    }
  } catch (e) {
    const optionsDebug = { collection: 'substances', connection };
    debug(e, optionsDebug);
  }
}

async function getFilesToImport(connection, progress, allFiles) {
  try {
    const collection = await connection.getCollection('substances');
    const lastDocument = await collection
      .find({ _seq: { $lte: progress.seq } })
      .sort('_seq', -1)
      .limit(1)
      .next();

    if (!progress.sources || !lastDocument) {
      return { files: allFiles, lastDocument: {} };
    }

    debug(`last file processed: ${progress.sources}`);

    const firstIndex = allFiles.findIndex((n) =>
      n.path.endsWith(progress.sources),
    );

    if (firstIndex === -1) {
      throw new Error(`file not found: ${progress.sources}`);
    }

    debug(`starting with file ${progress.sources}`);

    return { lastDocument, files: allFiles.slice(firstIndex) };
  } catch (e) {
    const optionsDebug = { collection: 'substances', connection };
    debug(e, optionsDebug);
  }
}

async function syncFullSubstanceFolder(connection) {
  try {
    debug('Synchronize full substance folder');

    const source = `${process.env.PUBCHEM_SOURCE}Substance/CURRENT-Full/SDF/`;
    const destination = `${process.env.ORIGINAL_DATA_PATH}/substances/full`;

    debug(`Syncing: ${source} to ${destination}`);

    const { allFiles } = await syncFolder(source, destination, {
      fileFilter: (file) => file && file.name.endsWith('.gz'),
    });

    return allFiles.sort((a, b) => {
      if (a.path < b.path) return -1;
      if (a.path > b.path) return 1;
      return 0;
    });
  } catch (e) {
    const optionsDebug = { collection: 'substances', connection };
    debug(e, optionsDebug);
  }
}

export default firstSubstanceImport;
