import { join } from 'path';

import { fileListFromPath } from 'filelist-from';
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
  const files = await getFilesListUsp(source, year);
  // get last file downloaded
  const lastFilesDownloaded = fileListFromPath(destinationFolder).sort(
    (a, b) => {
      a.path = a.webkitRelativePath;
      b.path = b.webkitRelativePath;
      if (a.path < b.path) return -1;
      if (a.path > b.path) return 1;
      return 0;
    },
  );

  // download the files
  const filesToDownload = files
    .filter((file) => {
      // skip until the last file downloaded
      //check for each file if it exists in the destination folder or if should be downloaded
      const fileName = file.name;
      const fileSize = file.size;
      file.path = join(destinationFolder, fileName);
      const fileExists = lastFilesDownloaded.find((lastFile) => {
        return lastFile.path === file.path && lastFile.size === fileSize;
      });
      if (fileExists) {
        return false;
      }
      return !fileExists;
    })
    .map((file) => {
      const fileName = file.name;
      const fileSize = file.size;
      file.path = join(destinationFolder, fileName);
      const fileExists = lastFilesDownloaded.find((lastFile) => {
        return lastFile.path === file.path && lastFile.size === fileSize;
      });
      if (fileExists) {
        return null;
      }
      return file;
    })
    .filter((file) => file);
  // download the files
  const filesDownloaded = await Promise.all(
    filesToDownload.map(async (file) => {
      const fileName = file.name;
      const fileSize = file.size;
      file.path = join(destinationFolder, fileName);
      const fileExists = lastFilesDownloaded.find((lastFile) => {
        return lastFile.path === file.path && lastFile.size === fileSize;
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
}

export default syncUspFolder;
