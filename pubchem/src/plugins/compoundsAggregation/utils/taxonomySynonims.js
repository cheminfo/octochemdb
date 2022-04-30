import { fileListFromPath } from 'filelist-from';
import readStreamInZipFolder from '../../../utils/readStreamInZipFolder.js';
import { createInterface } from 'readline';
export async function taxonomySynonims() {
  let fileName = fileListFromPath(
    `${process.env.ORIGINAL_DATA_PATH}/taxonomies/full`,
  ).filter((file) => {
    if (file.name.includes('zip') && !file.webkitRelativePath.includes('old')) {
      return file;
    }
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
