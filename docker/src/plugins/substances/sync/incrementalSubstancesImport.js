import debugLibrary from '../../../utils/Debug.js';

import { getFilesToImport } from './utils/getFilesToImport.js';
import { importSubstanceFiles } from './utils/importSubstanceFiles.js';
import { syncSubstanceFolder } from './utils/syncSubstanceFolder.js';

/**
 * @description perform incremental import of substances files and return the collection substances
 * @param {*} connection
 */
async function incrementalSubstanceImport(connection) {
  const debug = debugLibrary('incrementalSubstanceImport');
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
    if (
      progress.dateEnd !== 0 &&
      Date.now() - progress.dateEnd >
        Number(process.env.PUBCHEM_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
      !files.includes(progress.sources)
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
    }
    if (
      !files.includes(progress.sources) &&
      progress.state === 'updated' &&
      Date.now() - progress.dateEnd >
        Number(process.env.PUBCHEM_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000
    ) {
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
      debug(e.message, {
        collection: 'substances',
        connection,
        stack: e.stack,
      });
    }
  }
}

export default incrementalSubstanceImport;
