import { readFileSync } from 'fs';
import { fileListFromZip, fileListUngzip } from 'filelist-utils';
import parseOneFile from './parseOneFile.js';
import Debug from '../../../../utils/Debug.js';
const debug = Debug('importOneBioassayFile');

export default async function importOneBioassayFile(
  connection,
  progress,
  file,
) {
  const collection = await connection.getCollection('bioassay');

  debug(`Importing: ${file.name}`);

  const data = readFileSync(file.path);
  const fileList = await fileListFromZip(data);

  const ungzippedFileList = await fileListUngzip(fileList);
  let start = Date.now();
  let imported = 0;

  for (let file of ungzippedFileList) {
    for await (let entry of parseOneFile(file)) {
      entry._seq = ++progress.seq;
      let aggregateBySid = await collection
        .aggregate([
          {
            $match: {
              _id: entry._id,
            },
          },
        ])
        .toArray();
      if (aggregateBySid.length > 0) {
        entry._data.references.push(aggregateBySid[0]._data.references);

        entry._data.bioassays.push(aggregateBySid[0]._data.bioassays);
        await collection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );
      } else {
        await collection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );
      }
      imported++;

      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
        debug(`Imported bioassay results: ${imported}`);
        start = Date.now();
      }
    }
  }
  progress.source = file.name;
  await connection.setProgress(progress);
}
