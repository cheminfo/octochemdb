import debugLibrary from '../../../../utils/Debug.js';

/**
 * Determine which substance SDF files still need to be imported.
 *
 * For a 'first' import the function resumes from the file stored in
 * `progress.sources`.  For an 'incremental' import it does the same but
 * falls back to importing every file when the recorded source is not
 * found in the current list.
 *
 * @param {OctoChemConnection} connection - MongoDB connection wrapper
 * @param {object} progress - progress document for the substances collection
 * @param {Array<{name: string, path: string}>} allFiles - full sorted file list
 * @param {'first'|'incremental'} importType - import mode
 * @returns {Promise<{files: Array, lastDocument: object}>} files to process and the last imported document
 */
export async function getFilesToImport(
  connection,
  progress,
  allFiles,
  importType,
) {
  const debug = debugLibrary('getFilesToImport');
  try {
    const collection = await connection.getCollection('substances');
    // Fetch the last document whose _seq is at or below the current progress watermark
    const lastDocument = await collection
      .find({ _seq: { $lte: progress.seq } })
      .sort('_seq', -1)
      .limit(1)
      .next();

    // In test mode, return all files with an appropriate lastDocument stub
    if (process.env.NODE_ENV === 'test' && importType === 'first') {
      return {
        files: allFiles,
        lastDocument: {},
      };
    }
    if (process.env.NODE_ENV === 'test' && importType === 'incremental') {
      return {
        files: allFiles,
        lastDocument,
      };
    }

    if (importType === 'first') {
      // No prior source or document — start from the beginning
      if (!progress.sources || !lastDocument) {
        return { files: allFiles, lastDocument: {} };
      }
      debug.trace(`last file processed: ${progress.sources}`);
      const firstIndex = allFiles.findIndex((n) =>
        n.path.endsWith(progress.sources),
      );
      if (firstIndex === -1) {
        throw new Error(`file not found: ${progress.sources}`);
      }
      debug.trace(`starting with file ${progress.sources}`);
      return { lastDocument, files: allFiles.slice(firstIndex) };
    } else if (importType === 'incremental') {
      if (!lastDocument) {
        throw new Error('This should never happen');
      }

      debug.trace(`last file processed: ${progress.sources}`);

      const firstIndex = allFiles.findIndex((n) =>
        n.path.endsWith(progress.sources),
      );

      if (firstIndex === -1) {
        // Source file no longer present — import everything from the beginning
        debug.trace('Should import all the incremental updates');
        return { files: allFiles, lastDocument: {} };
      }

      debug.trace(`starting with file ${progress.sources}`);

      return { lastDocument, files: allFiles.slice(firstIndex) };
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'substances',
        connection,
        stack: err.stack,
      });
    }
  }
}
