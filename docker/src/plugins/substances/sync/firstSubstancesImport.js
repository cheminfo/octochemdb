import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';

import { getFilesToImport } from './utils/getFilesToImport.js';
import { importSubstanceFiles } from './utils/importSubstanceFiles.js';
import { syncSubstanceFolder } from './utils/syncSubstanceFolder.js';

/**
 * @description perform first import of substances files and return the collection substances
 * @param {*} connection - mongo connection
 * @returns {Promise} - collection substances
 */
async function firstSubstanceImport(connection) {
  const debug = debugLibrary('firstSubstanceImport');
  try {
    const progress = await connection.getProgress('substances');
    if (progress.state === 'updated') {
      debug.info('First importation has been completed. Should only update.');
      return;
    } else {
      debug.info(`Continuing first importation from ${progress.seq}.`);
    }
    let allFiles;
    if (process.env.NODE_ENV === 'test') {
      allFiles = [
        {
          name: 'firstImportSubstances.sdf.gz',
          path: `../docker/src/plugins/substances/sync/utils/__tests__/data/firstImportSubstances.sdf.gz`,
        },
      ];
    } else {
      allFiles = await syncSubstanceFolder(connection, 'first');
    }
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'first',
    );
    progress.state = 'updating';
    progress.dateEnd = Date.now();
    await connection.setProgress(progress);
    await importSubstanceFiles(
      connection,
      progress,
      files,
      { lastDocument },
      'first',
    );
    progress.state = 'updated';
    await connection.setProgress(progress);

    let substanceCollection = await connection.getCollection('substances');
    await createIndexes(substanceCollection, [
      { naturalProduct: 1 },
      { 'data.ocl.noStereoTautomerID': 1 },
      { _seq: 1 },
    ]);
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'substances',
        connection,
        stack: e.stack,
      });
    }
  }
}

export default firstSubstanceImport;
