import debugLibrary from '../../../../utils/Debug.js';
/**
 * @description get list of files to import
 * @param {*} connection  connection to mongo
 * @param {*} progress substances progress
 * @param {*} allFiles list of files
 * @param {*} importType first or incremental
 * @returns {Promise} file list of the folder
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
    if (process.env.NODE_ENV === 'test' && importType === 'incremental') {
      return {
        files: allFiles,
        lastDocument,
      };
    }
    if (importType === 'first') {
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
        debug.trace('Should import all the incremental updates');
        return { files: allFiles, lastDocument: {} };
      }

      debug.trace(`starting with file ${progress.sources}`);

      return { lastDocument, files: allFiles.slice(firstIndex) };
    }
  } catch (e) {
    if (connection) {
      debug.fatal(e.message, {
        collection: 'substances',
        connection,
        stack: e.stack,
      });
    }
  }
}
