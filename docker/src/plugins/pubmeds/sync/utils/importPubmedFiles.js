import pkg from 'fs-extra';

import removeEntriesFromFile from '../../../../sync/utils/removeEntriesFromFile.js';
import debugLibrary from '../../../../utils/Debug.js';

import importOnePubmedFile from './importOnePubmedFile.js';

const { readFileSync } = pkg;
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
  let langPubmeds = JSON.parse(
    readFileSync(
      '../docker/src/plugins/pubmeds/sync/utils/languagesPubMed.json',
    ).toString(),
  )[0];
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
          langPubmeds,
        );
        options.shouldImport = true;
      }
    } else if (importType === 'incremental') {
      debug.info('Starting incremental update');
      options = {
        shouldImport: progress.sources !== files[0].path,
        ...options,
      };
      for (let file of files) {
        debug.trace(`Processing: ${file.name}`);
        if (file.name.endsWith('.gz')) {
          await importOnePubmedFile(
            connection,
            progress,
            file,
            options,
            pmidToCid,
            langPubmeds,
          );
          options.shouldImport = true;
        } else if (file.name.startsWith('killed')) {
          await removeEntriesFromFile(connection, 'pubmeds', file);
        }
      }
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'pubmeds',
        connection,
        stack: e.stack,
      });
    }
  }
}
