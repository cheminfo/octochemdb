import { join } from 'path';
import { readFileSync } from 'fs';
import { fileListFromZip, fileListUngzip } from 'filelist-utils';
import parseOneFile from './parseOneFile.js';
import Debug from '../../../../utils/Debug.js';
import path from 'path';
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
  for await (let entry of parseOneFile(ungzippedFileList)) {
    entry._id = ++progress.seq;
    progress.state = 'updating';
    await collection.updateOne(
      { _id: entry._id },
      { $set: entry },
      { upsert: true },
    );
    await connection.setProgress(progress);
  }
}
