import { join } from 'path';

import delay from 'delay';
import FSExtra from 'fs-extra';

import getFileIfNew from '../../../../../sync/http/utils/getFileIfNew.js';
import debugLibrary from '../../../../../utils/Debug.js';

import getFilesListUsp from './getFileListUsp.js';

const { mkdirpSync, existsSync } = FSExtra;

async function syncUspFolder(source, destinationFolder, year) {
  // create the destination folder if it doesn't exist
  const debug = debugLibrary('syncUspFolder');
  if (await !existsSync(destinationFolder)) {
    await mkdirpSync(destinationFolder);
  }
  // get the list of files to import
  let files = await getFilesListUsp(source, year, {
    fileFilter: (file) => file && file.name.endsWith('.zip'),
  });
  let filesDownloaded = [];
  if (process.env.NODE_ENV !== 'test') {
    for (let file of files) {
      let options = {
        filename: file.name.replace('.zip', ''),
        extension: 'zip',
      };
      let target = join(destinationFolder);
      let fileDownloaded = await getFileIfNew(file, target, options);
      if (fileDownloaded) {
        filesDownloaded.push(fileDownloaded);
      }
      debug(`Waiting 5 seconds before next download...`);
      await delay(5000);
    }
    return filesDownloaded;
  } else {
    // @ts-ignore
    filesDownloaded = Array.from(files);
    return filesDownloaded;
  }
}

export default syncUspFolder;
