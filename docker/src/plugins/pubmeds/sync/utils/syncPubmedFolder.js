import syncFolder from '../../../../sync/http/utils/syncFolder.js';
import debugLibrary from '../../../../utils/Debug.js';
/**
 * @description get all files to import available in the PubMed database
 * @param {*} connection - mongo connection
 * @param {string} importType - 'first' or 'incremental'
 * @returns {Promise} list of all files to import
 */
export async function syncPubmedFolder(connection, importType) {
  const debug = debugLibrary('syncFullPubmedFolder');
  try {
    debug.trace(`Synchronize ${importType} pubmed folder`);
    let source;
    let destination;
    if (importType === 'first') {
      source = `${process.env.PUBMED_SOURCE}baseline/`;
      destination = `${process.env.ORIGINAL_DATA_PATH}/pubmeds/full`;
    } else if (importType === 'incremental') {
      source = `${process.env.PUBMED_SOURCE}updatefiles/`;
      destination = `${process.env.ORIGINAL_DATA_PATH}/pubmeds/update`;
    }
    debug.trace(`Syncing: ${source} to ${destination}`);

    const { allFiles } = await syncFolder(source, destination, {
      fileFilter: (file) => file && file.name.endsWith('.gz'),
    });
    return allFiles.sort((a, b) => {
      if (a.path < b.path) return -1;
      if (a.path > b.path) return 1;
      return 0;
    });
  } catch (e) {
    if (connection) {
      debug.fatal(e.message, {
        collection: 'pubmeds',
        connection,
        stack: e.stack,
      });
    }
  }
}
