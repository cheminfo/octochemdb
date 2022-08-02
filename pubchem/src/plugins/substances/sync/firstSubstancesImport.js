import Debug from '../../../utils/Debug.js';

import { getFilesToImport } from './utils/getFilesToImport.js';
import { importSubstanceFiles } from './utils/importSubstanceFiles.js';
import { syncSubstanceFolder } from './utils/syncSubstanceFolder.js';

/**
 * @description perform first import of substances files and return the collection substances
 * @param {*} connection - mongo connection
 * @returns {Promise} - collection substances
 */
async function firstSubstanceImport(connection) {
  const debug = Debug('firstSubstanceImport');
  try {
    const progress = await connection.getProgress('substances');
    if (progress.state === 'updated') {
      debug('First importation has been completed. Should only update.');
      return;
    } else {
      debug(`Continuing first importation from ${progress.seq}.`);
    }
    const allFiles = await syncSubstanceFolder(connection, 'first');
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'first',
    );
    progress.state = 'updating';
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
    await substanceCollection.createIndexes(
      { _id: 1 },
      { _seq: 1 },
      { naturalProduct: 1 },
      { 'data.ocl.noStereoID': 1 },
    );
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'substances',
        connection,
        stack: e.stack,
      });
    }
  }
}

export default firstSubstanceImport;
