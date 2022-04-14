const { readFileSync } = require('fs');
const { join } = require('path');

const { fileListFromZip, fileListUngzip } = require('../lib/index.js');

import Debug from '../../../../utils/Debug.js';
const debug = Debug('importOneBioassayFile');

export default async function importOneBioassayFile(
  connection,
  progress,
  file,
  options,
) {
  const collection = await connection.getCollection('bioassay');

  debug(`Importing: ${file.name}`);
  const data = readFileSync(file.path);
  const fileList = await fileListFromZip(data);
  const ungzippedFileList = await fileListUngzip(fileList);
  for (let file of ungzippedFileList) {
    const data = await file.text();
    const object = JSON.parse(data);
    console.log(object);
    console.log(file.name, data.byteLength);
  }
}
