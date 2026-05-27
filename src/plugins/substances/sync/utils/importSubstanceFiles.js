import removeEntriesFromFile from '../../../../sync/utils/removeEntriesFromFile.js';
import debugLibrary from '../../../../utils/Debug.js';

import importOneSubstanceFile from './importOneSubstanceFile.js';

/**
 * Import a list of substance files, handling both new-substance SDF files
 * and killed-SID removal files (incremental mode only).
 *
 * For each file ending in `.gz` the function delegates to
 * {@link importOneSubstanceFile}.  Files whose name starts with 'killed'
 * (only during incremental imports) are passed to `removeEntriesFromFile`
 * to delete obsolete documents.
 * @param connection - MongoDB connection wrapper
 * @param progress - progress document for the substances collection
 * @param files - list of substance files
 * @param options - import options (`lastDocument`, `shouldImport`)
 * @param importType - import mode
 * @returns
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
      options = {
        shouldImport: progress.sources !== files[0].path,
        ...options,
      };
    }
    for await (const file of files) {
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
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'substances',
        connection,
        stack: err.stack,
      });
    }
  }
}
