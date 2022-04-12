import fs, { rm, rmSync } from 'fs';

import unzipper from 'unzipper';

import Debug from '../../../../utils/Debug.js';
import { join } from 'path';
import gunzipStream from '../../../relationPubs/sync/utils/gunzipStream.js';
const debug = Debug('importOneBioassayFile');

export default async function importOneBioassayFile(
  connection,
  progress,
  file,
  options,
) {
  const collection = await connection.getCollection('bioassay');

  debug(`Importing: ${file.name}`);
  // should we directly import the data how wait that we reach the previously imported information
  let { shouldImport = true, lastDocument } = options;
  let folder = await unzipStream(file);
  let files = fs.readdirSync(folder); // us async instead
  let fileNames = [];

  for (const file of files) {
    let fileName = await gunzipStream(
      join(folder, file),
      join(folder, file.split('.gz')[0]),
    );
    fileNames.push(fileName);
  }

  ///// continue
}

export async function unzipStream(file) {
  debug(`Need to decompress: ${file.name}`);

  const path = `${process.env.ORIGINAL_DATA_PATH}/bioassay/full`;
  fs.createReadStream(file.path).pipe(unzipper.Extract({ path: path }));
  let folder = file.path.split('.zip')[0];
  return folder;
}
