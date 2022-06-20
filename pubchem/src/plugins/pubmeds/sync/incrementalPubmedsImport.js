import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import syncFolder from '../../../sync/http/utils/syncFolder.js';
import removeEntriesFromFile from '../../../sync/utils/removeEntriesFromFile.js';
import Debug from '../../../utils/Debug.js';

import { getCidFromPmid } from './utils/getCidFromPmid.js';
import importOnePubmedFile from './utils/importOnePubmedFile.js';

const debug = Debug('incrementalPubmedImport');

async function incrementalPubmedImport(connection) {
  try {
    const allFiles = await syncIncrementalPubmedFolder(connection);

    const progress = await connection.getProgress('pubmeds');

    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
    );
    if (!files.includes(progress.sources) && progress.state === 'updated') {
      let options = {
        collectionSource: process.env.CIDTOPMID_SOURCE,
        destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/pubmeds/cidToPmid`,
        collectionName: 'pubmeds',
        filenameNew: 'cidToPmid',
        extensionNew: 'gz',
      };
      const cidToPmidPath = await getLastFileSync(options);
      const pmidToCid = await getCidFromPmid(cidToPmidPath, connection);
      await importPubmedFiles(
        connection,
        progress,
        files,
        { lastDocument },
        pmidToCid,
      );
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'pubmeds', connection });
    }
  }
}

async function importPubmedFiles(
  connection,
  progress,
  files,
  options,
  pmidToCid,
) {
  try {
    debug('Starting incremental update');
    options = { shouldImport: false, ...options };
    for (let file of files) {
      debug(`Processing: ${file.name}`);
      if (file.name.endsWith('.gz')) {
        await importOnePubmedFile(
          connection,
          progress,
          file,
          options,
          pmidToCid,
        );
        options.shouldImport = true;
      } else if (file.name.startsWith('killed')) {
        await removeEntriesFromFile(connection, 'pubmeds', file);
      }
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'pubmeds', connection });
    }
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

    if (!lastDocument) {
      throw new Error('This should never happen');
    }

    debug(`last file processed: ${progress.sources}`);

    const firstIndex = allFiles.findIndex((n) =>
      n.path.endsWith(progress.sources),
    );

    if (firstIndex === -1) {
      debug('Should import all the incremental updates');
      return { files: allFiles, lastDocument: {} };
    }

    debug(`starting with file ${progress.sources}`);

    return { lastDocument, files: allFiles.slice(firstIndex) };
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'pubmeds', connection });
    }
  }
}

async function syncIncrementalPubmedFolder(connection) {
  try {
    debug('Synchronize incremental pubmed folder');

    const source = `${process.env.PUBMED_SOURCE}updatefiles/`;
    const destination = `${process.env.ORIGINAL_DATA_PATH}/pubmeds/update`;
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
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'pubmeds', connection });
    }
  }
}

export default incrementalPubmedImport;
