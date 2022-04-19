import { join } from 'path';
import { readFileSync } from 'fs';
import { fileListFromZip, fileListUngzip } from 'filelist-utils';
import parseOneFile from './parseOneFile.js';
import Debug from '../../../../utils/Debug.js';
import md5 from 'md5';
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
  let countAggregate = 0;
  for (let file of ungzippedFileList) {
    for await (let entry of parseOneFile(file)) {
      // entry._id = ++progress.seq;
      progress.state = 'updating';

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
        if (
          md5(entry._data.references) !==
          md5(aggregateBySid[0]._data.references)
        ) {
          entry._data.references.push(aggregateBySid[0]._data.references);
        }
        if (
          md5(entry._data.bioassays) == md5(aggregateBySid[0]._data.bioassays)
        ) {
          entry._data.bioassays.push(aggregateBySid[0]._data.bioassays);
        }

        countAggregate++;
        debug(`aggregated:${countAggregate}`);
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
      await connection.setProgress(progress);
    }
  }
}
