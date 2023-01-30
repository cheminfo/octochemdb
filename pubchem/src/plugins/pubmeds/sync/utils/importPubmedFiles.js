import removeEntriesFromFile from '../../../../sync/utils/removeEntriesFromFile.js';
import debugLibrary from '../../../../utils/Debug.js';

import importOnePubmedFile from './importOnePubmedFile.js';
/**
 * @description start import of pubmeds files
 * @param {*} connection  - mongo connection
 * @param {*} progress - pubmeds progress
 * @param {Array} files - list of files to import
 * @param {object} options - options { lastDocument }
 * @param {object} pmidToCid - pmid to cid map
 * @param {string} importType - first or incremental
 * @returns {Promise} pubmeds collection
 */
export async function importPubmedFiles(
  connection,
  progress,
  files,
  options,
  pmidToCid,
  importType,
) {
  const debug = debugLibrary('importPubmedFiles');
  try {
    if (importType === 'first') {
      options = { shouldImport: progress.seq === 0, ...options };
      for (let file of files) {
        await importOnePubmedFile(
          connection,
          progress,
          file,
          options,
          pmidToCid,
        );
        options.shouldImport = true;
      }
    } else if (importType === 'incremental') {
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
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'pubmeds', connection, stack: e.stack });
    }
  }
}
