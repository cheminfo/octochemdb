import Debug from '../../../../utils/Debug.js';
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
  const debug = Debug('getFilesToImport');
  try {
    const collection = await connection.getCollection('substances');
    const lastDocument = await collection
      .find({ _seq: { $lte: progress.seq } })
      .sort('_seq', -1)
      .limit(1)
      .next();
    if (importType === 'first') {
      if (!progress.sources || !lastDocument) {
        return { files: allFiles, lastDocument: {} };
      }
      debug(`last file processed: ${progress.sources}`);
      const firstIndex = allFiles.findIndex((n) =>
        n.path.endsWith(progress.sources),
      );
      if (firstIndex === -1) {
        throw new Error(`file not found: ${progress.sources}`);
      }
      debug(`starting with file ${progress.sources}`);
      return { lastDocument, files: allFiles.slice(firstIndex) };
    } else if (importType === 'incremental') {
      if (!lastDocument) {
        throw new Error('This should never happen');
      }

      debug(`last file processed: ${progress.sources}`);

      const firstIndex = allFiles.findIndex((n) =>
        n.path.endsWith(progress.sources),
      );

      if (firstIndex === -1) {
        debug('Should import all the incremental updates');
        return { files: allFiles, lastDocument: {} };
      }

      debug(`starting with file ${progress.sources}`);

      return { lastDocument, files: allFiles.slice(firstIndex) };
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
