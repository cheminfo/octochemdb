import { fileCollectionFromPath } from 'filelist-utils';

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
    for (let year = startingYear; year <= Number(currentYear); year++) {
      const source = `${process.env.USP_SOURCE}`;
      const destination = `${process.env.ORIGINAL_DATA_PATH}/usp/${year}/`;
      debug(`Starting sync for ${year}`);
      debug(`source: ${source}`);
      await syncUspFolder(source, destination, year);

      debug(`${year} done`);
    }
    let files = [];
    let parseFiles = await fileCollectionFromPath(
      `${process.env.ORIGINAL_DATA_PATH}/usp`,
      { unzip: { zipExtensions: [] } },
    );
    for (let file of parseFiles) {
      files.push({
        name: file.name,
        path: `${process.env.ORIGINAL_DATA_PATH}/${file.relativePath}`,
      });
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
