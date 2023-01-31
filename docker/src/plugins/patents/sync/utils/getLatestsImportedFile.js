import { fileListFromPath } from 'filelist-utils';
import pkg from 'fs-extra';

const { existsSync } = pkg;

/**
 * @description get latest date file path from a "old" folder
 * @param {String} path - path to the folder old organized by subfolders with date as name
 * @returns {String} path to the latest file or Null if not found
 */
export async function getLatestsImportedFile(path, fileName) {
  if (existsSync(path)) {
    const fileList = fileListFromPath(path);

    const filesPaths = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.name.includes(fileName)) {
        filesPaths.push(file.name);
      }
    }
    if (filesPaths.length > 0) {
      const latestFile = filesPaths.sort((a, b) => {
        const aDate = a.split('.')[1];
        const bDate = b.split('.')[1];
        return new Date(bDate) - new Date(aDate);
      })[0];

      const latestFilePath = fileList.filter(
        (file) => file.name === latestFile,
      )[0].webkitRelativePath;

      return latestFilePath;
    } else {
      return null;
    }
  } else {
    return null;
  }
}
