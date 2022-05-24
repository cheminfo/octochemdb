/* eslint-disable no-unused-vars */

import { createInterface } from 'readline';

import { fileListFromPath } from 'filelist-from';

import readStreamInZipFolder from '../../../../utils/readStreamInZipFolder.js';

export async function taxonomySynonyms() {
  let fileName = fileListFromPath(
    `${process.env.ORIGINAL_DATA_PATH}/taxonomies/full`,
  ).filter((file) => {
    return (
      file.name.includes('zip') && !file.webkitRelativePath.includes('old')
    );
  })[0];
  const readStream = await readStreamInZipFolder(
    fileName.webkitRelativePath,
    'merged.dmp',
  );

  const lines = createInterface({ input: readStream });

  const newIDs = {};

  for await (let line of lines) {
    const [idOld, nothing, idNew] = line.split('\t');
    Number(idOld);
    newIDs[idOld] = idNew;
  }

  return newIDs;
}
