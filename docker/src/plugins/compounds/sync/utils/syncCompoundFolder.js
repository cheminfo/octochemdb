import getFilesList from '../../../../sync/http/utils/getFilesList.js';
import syncFolder from '../../../../sync/http/utils/syncFolder.js';
import debugLibrary from '../../../../utils/Debug.js';

/**
 * @description Synchronize the compounds folder from the PubChem database
 * @param {*} connection MongoDB connection
 * @param {string} importType 'first' or 'incremental'
 * @returns {Promise} return array of files list
 */
export async function syncCompoundFolder(connection, importType) {
  const debug = debugLibrary('syncCompoundFolder');
  try {
    debug.trace(`Synchronize compound folder (${importType} importation)`);
    // if importType is 'first', then we need to sync the whole folder
    if (importType === 'first') {
      const source = `${process.env.PUBCHEM_SOURCE}Compound/CURRENT-Full/SDF/`;
      const destination = `${process.env.ORIGINAL_DATA_PATH}/compounds/full`;
      debug.trace(`Syncing: ${source} to ${destination}`);
      const { allFiles } = await syncFolder(source, destination, {
        fileFilter: (file) => file && file.name.endsWith('.gz'),
      });
      return allFiles.sort((a, b) => {
        if (a && b) {
          if (a.path < b.path) return -1;
          if (a.path > b.path) return 1;
        }
        return 0;
      });
    }
    // if importType is 'incremental', then we need to sync only the new files in the weekly update
    if (importType === 'incremental') {
      const source = `${process.env.PUBCHEM_SOURCE}Compound/Weekly/`;
      const destination = `${process.env.ORIGINAL_DATA_PATH}/compounds/weekly`;
      const allFiles = [];
      const weeks = await getFilesList(source, {
        fileFilter: (file) => file && file.name.match(/\d{4}-\d{2}-\d{2}/),
      });
      for (let week of weeks) {
        if (week) {
          const baseSource = `${source}/${week.name}`;
          debug.trace(`Processing week: ${week.name}`);
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
              await syncFolder(
                `${baseSource}/`,
                `${destination}/${week.name}/`,
                {
                  fileFilter: (file) =>
                    file && file.name.endsWith('killed-CIDs'),
                },
              )
            ).allFiles,
          );
        }
      }
      return allFiles.sort((a, b) => {
        if (a && b) {
          if (a.path < b.path) return -1;
          if (a.path > b.path) return 1;
        }
        return 0;
      });
    }
  } catch (e) {
    if (connection) {
      await debug.trace(e.message, {
        collection: 'compounds',
        connection,
        stack: e.stack,
      });
    }
  }
}
