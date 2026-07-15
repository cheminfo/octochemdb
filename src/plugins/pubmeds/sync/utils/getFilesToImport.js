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
 * @param connection - Active database connection.
 * @param progress - Current sync progress document.
 * @param allFiles - Complete sorted
 *   file list from the remote folder.
 * @param importType - Import mode.
 * @returns Subset of files to import and the last-imported document. Throws on
 *   a fatal error so the caller aborts cleanly instead of destructuring
 *   `undefined`.
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
      // No imported document yet — e.g. the baseline import has not finished so
      // the collection is still empty. There is nothing to resume from, so
      // return all files for a full catch-up rather than throwing. The caller's
      // shouldUpdate gate still decides whether to actually import.
      if (!lastDocument) {
        debug.trace('No last document yet; returning all incremental files');
        return { files: allFiles, lastDocument: {} };
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
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'pubmeds',
        connection,
        stack: err.stack,
      });
    }
    // Rethrow: returning undefined makes the caller crash on
    // `const { files, lastDocument } = await getFilesToImport(...)`. Propagating
    // lets the import abort cleanly (and retry next tick) with the real cause.
    throw err;
  }
}
