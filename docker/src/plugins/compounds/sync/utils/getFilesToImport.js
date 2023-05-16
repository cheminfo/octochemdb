import debugLibrary from '../../../../utils/Debug.js';

/**
 * @description Get the list of files to import
 * @param {*} connection MongoDB connection
 * @param {*} progress import progress
 * @param {Array} allFiles list of fetched
 * @param {string} importType first or incremental
 * @returns {Promise<object>} returns {files: Array, lastDocument: object}
 */
export async function getFilesToImport(
  connection,
  progress,
  allFiles,
  importType,
) {
  const debug = debugLibrary('getFilesToImport');
  try {
    const collection = await connection.getCollection('compounds');
    const lastDocument = await collection
      .find({ _seq: { $lte: progress.seq } })
      .sort('_seq', -1)
      .limit(1)
      .next();
    if (process.env.NODE_ENV === 'test' && importType === 'first') {
      return {
        files: allFiles,
        lastDocument: {},
      };
    }
    if (!progress.sources || (!lastDocument && importType === 'first')) {
      return { files: allFiles, lastDocument: {} };
    }
    if (!lastDocument && importType === 'incremental') {
      throw new Error('This should never happen');
    }

    debug.trace(`last file processed: ${progress.sources}`);

    const firstIndex = allFiles.findIndex((n) =>
      n.path.endsWith(progress.sources),
    );
    if (process.env.NODE_ENV === 'test' && importType === 'incremental') {
      return {
        files: allFiles,
        lastDocument,
      };
    }
    if (firstIndex === -1 && importType === 'incremental') {
      debug.info('Should import all the incremental updates');
      return { files: allFiles, lastDocument: {} };
    }
    if (firstIndex === -1 && importType === 'first') {
      throw new Error(`file not found: ${progress.sources}`);
    }

    debug.trace(`starting with file ${progress.sources}`);

    return { files: allFiles.slice(firstIndex), lastDocument };
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
