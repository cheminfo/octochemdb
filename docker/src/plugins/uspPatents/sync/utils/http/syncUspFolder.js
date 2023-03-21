import { join } from 'path';

import { fileCollectionFromPath } from 'filelist-utils';
import FSExtra from 'fs-extra';

import getFile from '../../../../../sync/http/utils/getFile.js';

import getFilesListUsp from './getFileListUsp.js';

const { mkdirpSync, existsSync } = FSExtra;

async function syncUspFolder(source, destinationFolder, year) {
  // create the destination folder if it doesn't exist
  if (await !existsSync(destinationFolder)) {
    await mkdirpSync(destinationFolder);
  }
  // get the list of files to import
  const files = await getFilesListUsp(source, year, {
    fileFilter: (file) => file && file.name.endsWith('.zip'),
  });
  // get last file downloaded
  const lastFilesDownloaded = (
    await fileCollectionFromPath(destinationFolder)
  ).files.sort((a, b) => {
    if (a.relativePath < b.relativePath) return -1;
    if (a.relativePath > b.relativePath) return 1;
    return 0;
  });

  // download the files
  const filesToDownload = files
    .filter((file) => {
      // skip until the last file downloaded
      //check for each file if it exists in the destination folder or if should be downloaded
      const fileName = file.name;
      const fileSize = Number(file.size);
      file.path = join(destinationFolder, fileName);
      const fileExists = lastFilesDownloaded.find((lastFile) => {
        return (
          lastFile.relativePath === file.path && lastFile.size === fileSize
        );
      });
      if (fileExists) {
        return false;
      }
      return !fileExists;
    })
    .map((file) => {
      const fileName = file.name;
      const fileSize = Number(file?.size);
      file.path = join(destinationFolder, fileName);
      const fileExists = lastFilesDownloaded.find((lastFile) => {
        return (
          // regex everithing after .zip/ but keep .zip
          lastFile.relativePath.replace(/(?<=\.zip).*/g, '') === file.path &&
          lastFile.size === fileSize
        );
      });
      if (fileExists) {
        return null;
      }
      return file;
    })
    .filter((file) => file);
  // download the files
  let filesDownloaded;
  if (process.env.NODE_ENV !== 'test') {
    filesDownloaded = await Promise.all(
      filesToDownload.map(async (file) => {
        const fileName = file.name;
        const fileSize = Number(file.size);
        file.path = join(destinationFolder, fileName);
        const fileExists = lastFilesDownloaded.find((lastFile) => {
          return (
            lastFile.relativePath === file.path && lastFile.size === fileSize
          );
        });
        if (fileExists) {
          return null;
        }
        await getFile(file, file.path);
        return file;
      }),
    );
    // return the files downloaded
    return filesDownloaded;
  } else {
    filesDownloaded = filesToDownload;
    return filesDownloaded;
  }
}

export default syncUspFolder;
