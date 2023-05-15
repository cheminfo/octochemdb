import { join } from 'path';

import { fileCollectionFromPath } from 'filelist-utils';
import FSExtra from 'fs-extra';

import getFileIfNew from '../../../../../sync/http/utils/getFileIfNew.js';
import debugLibrary from '../../../../../utils/Debug.js';

import getFileListPatents from './getFileListPatents.js';

const { mkdirpSync, existsSync } = FSExtra;
const debug = debugLibrary('getTitlesAndAbstracts');

async function getTitlesAndAbstracts(source, destinationFolder) {
  try {
    // create the destination folder if it doesn't exist
    if (!existsSync(destinationFolder)) {
      mkdirpSync(destinationFolder);
    }
    // create abstracts folder and titles folder
    if (!existsSync(join(destinationFolder, 'abstracts'))) {
      mkdirpSync(join(destinationFolder, 'abstracts'));
    }
    if (!existsSync(join(destinationFolder, 'titles'))) {
      mkdirpSync(join(destinationFolder, 'titles'));
    }
    // get the list of files to import
    let list = await getFileListPatents(source, {
      fileFilter: (file) => file && file.name.endsWith('ttl.gz'),
    });
    let abstracts2Download = list?.abstracts2Download;
    let titles2Download = list?.titles2Download;
    let abstractsDownloaded = [];
    if (process.env.NODE_ENV !== 'test') {
      for (let file of abstracts2Download) {
        let options = {
          filename: file.name.replace('.gz', ''),
          extension: 'gz',
        };
        let target = join(destinationFolder, 'abstracts');
        let fileDownloaded = await getFileIfNew(file, target, options);
        if (fileDownloaded) {
          abstractsDownloaded.push(fileDownloaded);
        }
      }
      let titlesDownloaded = [];
      if (process.env.NODE_ENV !== 'test') {
        for (let file of titles2Download) {
          let options = {
            filename: file.name.replace('.gz', ''),
            extension: 'gz',
          };
          let target = join(destinationFolder, 'titles');
          let fileDownloaded = await getFileIfNew(file, target, options);
          if (fileDownloaded) {
            titlesDownloaded.push(fileDownloaded);
          }
        }
        if (abstractsDownloaded.length > 0 && titlesDownloaded.length > 0) {
          return { abstractsDownloaded, titlesDownloaded };
        } else {
          let abstractsDownloadedCollection = await fileCollectionFromPath(
            join(destinationFolder, 'abstracts'),
            { ungzip: { gzipExtensions: [] } },
          );
          let titlesDownloadedCollection = await fileCollectionFromPath(
            join(destinationFolder, 'titles'),
            { ungzip: { gzipExtensions: [] } },
          );
          for (let file of abstractsDownloadedCollection) {
            abstractsDownloaded.push(file.relativePath);
          }
          for (let file of titlesDownloadedCollection) {
            titlesDownloaded.push(file.relativePath);
          }
          return { abstractsDownloaded, titlesDownloaded };
        }
      }
    }
  } catch (error) {
    debug.fatal(error);
  }
}

export default getTitlesAndAbstracts;
