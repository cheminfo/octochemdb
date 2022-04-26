import syncFolder from '../../../sync/http/utils/syncFolder.js';
import Debug from '../../../utils/Debug.js';

import importOnePubmedFile from './utils/importOnePubmedFile.js';

const debug = Debug('firstPubmedImport');

async function firstPubmedImport(connection) {
  try {
    const progress = await connection.getProgress('pubmeds');
    if (progress.state === 'updated') {
      debug('First importation has been completed. Should only update.');
      return;
    } else {
      debug(`Continuing first importation from ${progress.seq}.`);
    }
    const allFiles = await syncFullPubmedFolder(connection);
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
    );
    progress.state = 'updating';
    await connection.setProgress(progress);
    await importPubmedFiles(connection, progress, files, { lastDocument });
    progress.state = 'updated';
    await connection.setProgress(progress);
  } catch (e) {
    const optionsDebug = { collection: 'pubmeds', connection };
    debug(e, optionsDebug);
  }
}

async function importPubmedFiles(connection, progress, files, options) {
  try {
    options = { shouldImport: progress.seq === 0, ...options };
    for (let file of files) {
      await importOnePubmedFile(connection, progress, file, options);
      options.shouldImport = true;
    }
  } catch (e) {
    const optionsDebug = { collection: 'pubmeds', connection };
    debug(e, optionsDebug);
  }
}

async function getFilesToImport(connection, progress, allFiles) {
  try {
    const collection = await connection.getCollection('pubmeds');
    const lastDocument = await collection
      .find({ _seq: { $lte: progress.seq } })
      .sort('_seq', -1)
      .limit(1)
      .next();

    if (!lastDocument) return { files: allFiles, lastDocument: {} };

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
    const optionsDebug = { collection: 'pubmeds', connection };
    debug(e, optionsDebug);
  }
}

async function syncFullPubmedFolder(connection) {
  try {
    debug('Synchronize full pubmed folder');

    const source = `${process.env.PUBMED_SOURCE}baseline/`;
    const destination = `${process.env.ORIGINAL_DATA_PATH}/pubmeds/full`;

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
    const optionsDebug = { collection: 'pubmeds', connection };
    debug(e, optionsDebug);
  }
}

export default firstPubmedImport;
