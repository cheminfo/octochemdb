import Debug from '../../../../utils/Debug.js';

import { importOneUspFile } from './importOneUspFile.js';

export async function importUspFiles(connection, progress, files, options) {
  const debug = Debug('importUspFiles');
  try {
    options = { shouldImport: progress.seq === 0, ...options };
    for (let file of files) {
      await importOneUspFile(connection, progress, file, options);
      options.shouldImport = true;
    }
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
