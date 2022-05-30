import getFilesList from '../../../sync/http/utils/getFilesList.js';
import syncFolder from '../../../sync/http/utils/syncFolder.js';
import removeEntriesFromFile from '../../../sync/utils/removeEntriesFromFile.js';
import Debug from '../../../utils/Debug.js';

import importOneSubstanceFile from './utils/importOneSubstanceFile.js';

const debug = Debug('incrementalSubstanceImport');

async function incrementalSubstanceImport(connection) {
  try {
    const allFiles = await syncIncrementalSubstanceFolder(connection);

    const progress = await connection.getProgress('substances');
    if (progress.state !== 'updated') {
      throw new Error('Should never happens.');
    }
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
    );
    if (!files.includes(progress.sources) && progress.state === 'updated') {
      await importSubstanceFiles(connection, progress, files, { lastDocument });
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'substances', connection });
    }
  }
}

async function importSubstanceFiles(connection, progress, files, options) {
  try {
    options = { shouldImport: false, ...options };
    for (let file of files) {
      if (file.name.endsWith('.gz')) {
        await importOneSubstanceFile(connection, progress, file, options);
        options.shouldImport = true;
      } else if (file.name.startsWith('killed')) {
        await removeEntriesFromFile(connection, 'substances', file);
      }
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'substances', connection });
    }
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
      debug(e, { collection: 'substances', connection });
    }
  }
}

async function syncIncrementalSubstanceFolder(connection) {
  try {
    debug('Synchronize incremental substance folder');

    const source = `${process.env.PUBCHEM_SOURCE}Substance/Weekly/`;
    const destination = `${process.env.ORIGINAL_DATA_PATH}/substances/weekly`;
    const allFiles = [];
    const weeks = await getFilesList(source, {
      fileFilter: (file) => file && file.name.match(/\d{4}-\d{2}-\d{2}/),
    });
    for (let week of weeks) {
      const baseSource = `${source}/${week.name}`;
      debug(`Processing week: ${week.name}`);
      allFiles.push(
        ...(
          await syncFolder(
            `${baseSource}SDF/`,
            `${destination}/${week.name}/`,
            {
              fileFilter: (file) => file && file.name.endsWith('.gz'),
            },
          )
        ).allFiles,
      );
      allFiles.push(
        ...(
          await syncFolder(`${baseSource}/`, `${destination}/${week.name}/`, {
            fileFilter: (file) => file && file.name.startsWith('killed-SIDs'),
          })
        ).allFiles,
      );
    }

    return allFiles.sort((a, b) => {
      if (a.path < b.path) return -1;
      if (a.path > b.path) return 1;
      return 0;
    });
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'substances', connection });
    }
  }
}

export default incrementalSubstanceImport;
