import debugLibrary from '../../../../utils/Debug.js';

/**
 * Determines which files from `allFiles` still need to be imported, and
 * retrieves the last-imported document for resume support.
 *
 * For `'first'` imports, if a `progress.sources` value exists, the file
 * list is sliced to start from that file (inclusive) so the import can
 * resume where it left off.
 *
 * For `'incremental'` imports the same slicing logic applies; if the
 * previously-processed file is no longer in the list, all files are
 * returned (full catch-up).
 *
 * @param {OctoChemConnection} connection - Active database connection.
 * @param {Progress} progress - Current sync progress document.
 * @param {{ name: string; path: string }[]} allFiles - Complete sorted
 *   file list from the remote folder.
 * @param {'first' | 'incremental'} importType - Import mode.
 * @returns {Promise<{ files: { name: string; path: string }[]; lastDocument: object } | undefined>}
 *   Subset of files to import and the last-imported document, or
 *   `undefined` if a fatal error occurred.
 */
export async function getFilesToImport(
  connection,
  progress,
  allFiles,
  importType,
) {
  const debug = debugLibrary('getFilesToImport');
  try {
    const collection = await connection.getCollection('pubmeds');

    // Find the most recently imported document by descending _seq
    const lastDocument = await collection
      .find({ _seq: { $lte: progress.seq } })
      .sort('_seq', -1)
      .limit(1)
      .next();

    // In test mode for first import, process all files from scratch
    if (process.env.NODE_ENV === 'test' && importType === 'first') {
      return {
        files: allFiles,
        lastDocument: {},
      };
    }

    if (importType === 'first') {
      // Fresh import or no prior progress: start from the beginning
      if (!progress.sources || !lastDocument) {
        return { files: allFiles, lastDocument: {} };
      }
      debug.trace(`last file processed: ${progress.sources}`);

      // Resume from the last-processed file (inclusive, to finish it)
      const firstIndex = allFiles.findIndex((n) =>
        n.path.endsWith(progress.sources),
      );
      if (firstIndex === -1) {
        throw new Error(`file not found: ${progress.sources}`);
      }
      debug.trace(`starting with file ${progress.sources}`);
      return { files: allFiles.slice(firstIndex), lastDocument };
    } else if (importType === 'incremental') {
      if (!lastDocument) {
        throw new Error('This should never happen');
      }
      debug.trace(`last file processed: ${progress.sources}`);

      // In test mode for incremental, process all files
      if (process.env.NODE_ENV === 'test' && importType === 'incremental') {
        return {
          files: allFiles,
          lastDocument,
        };
      }

      const firstIndex = allFiles.findIndex((n) =>
        n.path.endsWith(progress.sources),
      );

      // If the last-processed file is gone, do a full catch-up
      if (firstIndex === -1) {
        debug.trace('Should import all the incremental updates');
        return { files: allFiles, lastDocument: {} };
      }
      debug.trace(`starting with file ${progress.sources}`);
      return { lastDocument, files: allFiles.slice(firstIndex) };
    }
  } catch (e) {
    if (connection) {
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'pubmeds',
        connection,
        stack: err.stack,
      });
    }
  }
}
