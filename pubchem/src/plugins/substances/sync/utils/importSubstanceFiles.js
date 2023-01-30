import removeEntriesFromFile from '../../../../sync/utils/removeEntriesFromFile.js';
import debugLibrary from '../../../../utils/Debug.js';

import importOneSubstanceFile from './importOneSubstanceFile.js';
/**
 * @description import the substance files
 * @param {*} connection  connection to mongo
 * @param {*} progress substances progress
 * @param {Array} files substance files
 * @param {object} options {lastDocument}
 * @param {string} importType first or incremental
 * @returns {Promise} substances collection
 */
export async function importSubstanceFiles(
  connection,
  progress,
  files,
  options,
  importType,
) {
  const debug = debugLibrary('importSubstanceFiles');
  try {
    if (importType === 'first') {
      options = { shouldImport: progress.seq === 0, ...options };
    } else if (importType === 'incremental') {
      options = { shouldImport: false, ...options };
    }
    for (let file of files) {
      if (file.name.endsWith('.gz')) {
        await importOneSubstanceFile(connection, progress, file, options);
        options.shouldImport = true;
      } else if (
        file.name.startsWith('killed') &&
        importType === 'incremental'
      ) {
        await removeEntriesFromFile(connection, 'substances', file);
      }
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
