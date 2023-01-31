import getFilesList from '../../../../sync/http/utils/getFilesList.js';
import syncFolder from '../../../../sync/http/utils/syncFolder.js';
import debugLibrary from '../../../../utils/Debug.js';
/**
 * @description synchronize a folder of substances
 * @param {*} connection  connection to mongo
 * @param {string} importType first or incremental
 * @returns {Promise} file list of the folder
 */
export async function syncSubstanceFolder(connection, importType) {
  const debug = debugLibrary('syncSubstanceFolder');
  try {
    debug('Synchronize full substance folder');
    if (importType === 'first') {
      const source = `${process.env.PUBCHEM_SOURCE}Substance/CURRENT-Full/SDF/`;
      const destination = `${process.env.ORIGINAL_DATA_PATH}/substances/full`;

      debug(`Syncing: ${source} to ${destination}`);

      const { allFiles } = await syncFolder(source, destination, {
        fileFilter: (file) => file && file.name.endsWith('.gz'),
      });
      return allFiles.sort((a, b) => {
        if (a.path < b.path) return -1;
        if (a.path > b.path) return 1;
        return 0;
      });
    } else if (importType === 'incremental') {
      debug('Synchronize incremental substance folder');

      const source = `${process.env.PUBCHEM_SOURCE}Substance/Weekly/`;
      const destination = `${process.env.ORIGINAL_DATA_PATH}/substances/weekly`;
      const allFiles = [];
      const weeks = await getFilesList(source, {
        fileFilter: (file) => file && file.name.match(/\d{4}-\d{2}-\d{2}/),
      });
      for (let week of weeks) {
        const baseSource = `${source}/${week.name}`;
        debug(`Processing week: ${week.name}`);
        allFiles.push(
          ...(
            await syncFolder(
              `${baseSource}SDF/`,
              `${destination}/${week.name}/`,
              {
                fileFilter: (file) => file && file.name.endsWith('.gz'),
              },
            )
          ).allFiles,
        );
        allFiles.push(
          ...(
            await syncFolder(`${baseSource}/`, `${destination}/${week.name}/`, {
              fileFilter: (file) => file && file.name.startsWith('killed-SIDs'),
            })
          ).allFiles,
        );
      }
      return allFiles.sort((a, b) => {
        if (a.path < b.path) return -1;
        if (a.path > b.path) return 1;
        return 0;
      });
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
