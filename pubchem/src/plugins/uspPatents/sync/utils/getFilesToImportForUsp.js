import Debug from '../../../../utils/Debug.js';

/**
 * @description get list of files to import
 * @param {*} connection - mongo connection
 * @param {*} progress - pubmeds progress
 * @param {Array} allFiles - list of files to import
 * @param {string} importType - first or incremental
 * @returns {Promise} list of files to import
 */
export async function getFilesToImportForUsp(connection, progress, allFiles) {
  const debug = Debug('getFilesToImportForUsp');
  try {
    const collection = await connection.getCollection('uspPatents');
    const lastDocument = await collection
      .find({ _seq: { $lte: progress.seq } })
      .sort('_seq', -1)
      .limit(1)
      .next();
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
    return { files: allFiles.slice(firstIndex), lastDocument };
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'uspPatents',
        connection,
        stack: e.stack,
      });
    }
  }
}
