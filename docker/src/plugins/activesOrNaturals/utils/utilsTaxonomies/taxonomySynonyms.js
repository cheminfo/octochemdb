import { createInterface } from 'readline';

import { fileCollectionFromPath } from 'filelist-utils';

import readStreamInZipFolder from '../../../../utils/readStreamInZipFolder.js';

/**
 * Parse the NCBI `merged.dmp` file and return a map of deprecated taxonomy IDs
 * to their current replacement IDs.
 * @returns {Promise<Record<string, string>>} `{ oldTaxId: newTaxId, ... }`
 */
export async function taxonomySynonyms() {
  let path;
  if (process.env.NODE_ENV === 'test') {
    path = `../docker/src/plugins/taxonomies/sync/utils/__tests__/data/`;
  } else {
    path = `../originalData/taxonomies/full/`;
  }

  let fileToRead = (
    await fileCollectionFromPath(`${path}`, { unzip: { zipExtensions: [] } })
  ).files.filter((file) => {
    return (
      file.relativePath.includes('zip') && !file.relativePath.includes('old')
    );
  })[0];
  // replace full/ with relative path
  if (process.env.NODE_ENV === 'test') {
    fileToRead.relativePath = path.replace('data/', fileToRead.relativePath);
  } else {
    fileToRead.relativePath = path.replace('full/', fileToRead.relativePath);
  }
  const readStream = await readStreamInZipFolder(
    fileToRead.relativePath,
    'merged.dmp',
  );

  const newIDs = {};
  const lines = createInterface({ input: readStream });

  for await (let line of lines) {
    const [idOld, , idNew] = line.split('\t');
    newIDs[idOld] = idNew;
  }

  return newIDs;
}
