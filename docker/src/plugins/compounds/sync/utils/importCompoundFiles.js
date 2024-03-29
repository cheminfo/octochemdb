import removeEntriesFromFile from '../../../../sync/utils/removeEntriesFromFile.js';
import debugLibrary from '../../../../utils/Debug.js';

import importOneCompoundFile from './importOneCompoundFile.js';

/**
 * @description Import the compounds files
 * @param {*} connection MongoDB connection
 * @param {*} progress import progress
 * @param {*} files files to import
 * @param {object} options {shouldImport: boolean, lastDocument: object}
 * @param {string} importType first or incremental
 */
export async function importCompoundFiles(
  connection,
  progress,
  files,
  options,
  importType,
) {
  const debug = debugLibrary('importCompoundFiles');
  try {
    if (importType === 'first') {
      options = { shouldImport: progress.seq === 0, ...options };
    }
    if (importType === 'incremental') {
      options = {
        shouldImport: progress.sources !== files[0].path,
        ...options,
      };
    }
    if (importType === 'first') {
      for await (let file of files) {
        await importOneCompoundFile(connection, progress, file, options);
        options.shouldImport = true;
      }
    }
    if (importType === 'incremental') {
      for await (let file of files) {
        if (file.name.endsWith('.gz')) {
          await importOneCompoundFile(connection, progress, file, options);
          options.shouldImport = true;
        } else if (file.name.startsWith('killed')) {
          await removeEntriesFromFile(connection, 'compounds', file);
        }
      }
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'compounds',
        connection,
        stack: e.stack,
      });
    }
  }
}
