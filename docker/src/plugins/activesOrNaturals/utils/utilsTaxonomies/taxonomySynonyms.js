/* eslint-disable no-unused-vars */

import { createInterface } from 'readline';

import { fileCollectionFromPath } from 'filelist-utils';

import readStreamInZipFolder from '../../../../utils/readStreamInZipFolder.js';
/**
 * @description Get an object with oldIds as properties and newIds as values
 * @returns {Promise<Object>} Object {oldID: newID, ...}
 */
export async function taxonomySynonyms() {
  let path;
  if (process.env.NODE_ENV === 'test') {
    path = `../docker/src/plugins/taxonomies/sync/utils/__tests__/data/`;
  } else {
    path = `${process.env.ORIGINAL_DATA_PATH}/taxonomies/full/`;
  }

  let fileToRead = (await fileCollectionFromPath(`${path}`)).files.filter(
    (file) => {
      return (
        file.relativePath.includes('zip') &&
        !file.relativePath.includes('old') &&
        file.name === 'merged.dmp'
      );
    },
  )[0];
  let regex;
  if (process.env.NODE_ENV === 'test') {
    regex = /data.*/;
    fileToRead.relativePath = path.replace(regex, fileToRead.relativePath);
  } else {
    regex = /full.*/;
    fileToRead.relativePath = path.replace(regex, fileToRead.relativePath);
  }
  const readStream = await readStreamInZipFolder(fileToRead);
  const lines = createInterface({ input: readStream });

  const newIDs = {};

  for await (let line of lines) {
    const [idOld, nothing, idNew] = line.split('\t');
    Number(idOld);
    newIDs[idOld] = idNew;
  }

  return newIDs;
}
