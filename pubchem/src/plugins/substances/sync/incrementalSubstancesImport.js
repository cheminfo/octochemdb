import Debug from '../../../utils/Debug.js';

import { getFilesToImport } from './utils/getFilesToImport.js';
import { importSubstanceFiles } from './utils/importSubstanceFiles.js';
import { syncSubstanceFolder } from './utils/syncSubstanceFolder.js';

/**
 * @description perform incremental import of substances files and return the collection substances
 * @param {*} connection
 */
async function incrementalSubstanceImport(connection) {
  const debug = Debug('incrementalSubstanceImport');
  try {
    const allFiles = await syncSubstanceFolder(connection, 'incremental');

    const progress = await connection.getProgress('substances');
    if (progress.state !== 'updated') {
      throw new Error('Should never happens.');
    }
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'incremental',
    );
    if (!files.includes(progress.sources) && progress.state === 'updated') {
      await importSubstanceFiles(
        connection,
        progress,
        files,
        { lastDocument },
        'incremental',
      );
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'substances', connection });
    }
  }
}

export default incrementalSubstanceImport;
