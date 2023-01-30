import debugLibrary from '../../../../../utils/Debug.js';

import syncUspFolder from './syncUspFolder.js';
/**
 * @description get all files to import available in the usp database
 * @param {*} connection - mongo connection
 * @returns {Promise} list of all files to import
 */
export async function syncAllUspFolders(connection) {
  const debug = debugLibrary('syncAllUspFolders');
  try {
    const currentYear = new Date().getFullYear();
    const startingYear = 2001;
    let files = [];
    for (let year = startingYear; year <= Number(currentYear); year++) {
      const source = `${process.env.USP_SOURCE}${year}/`;
      const destination = `${process.env.ORIGINAL_DATA_PATH}/usp/${year}/`;
      debug(`Starting sync for ${year}`);
      const filesDownloaded = await syncUspFolder(source, destination, year);
      files = files.concat(filesDownloaded);
      debug(`${year} done`);
      if (year === 2001) {
        break;
      }
    }
    return files.sort((a, b) => {
      if (a.path < b.path) return -1;
      if (a.path > b.path) return 1;
      return 0;
    });
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
// the problem is that we don't return the file path for the importation of the usp patents
