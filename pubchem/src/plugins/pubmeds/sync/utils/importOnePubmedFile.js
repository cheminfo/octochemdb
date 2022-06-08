import fs from 'fs';
import { open } from 'fs/promises';
import { join } from 'path';
import { createGunzip } from 'zlib';

import { parseStream } from 'arraybuffer-xml-parser';

import Debug from '../../../../utils/Debug.js';

import improvePubmedPool from './improvePubmedPool.js';

const debug = Debug('importOnePubmedFile');

export default async function importOnePubmedFile(
  connection,
  progress,
  file,
  options,
) {
  const collection = await connection.getCollection('pubmeds');
  await collection.createIndex({ _seq: 1 });
  debug(`Importing: ${file.name}`);
  const logs = await connection.geImportationLog({
    collectionName: 'pubmeds',
    sources: file.name,
    startSequenceID: progress.seq,
  });

  // unzip gzip file and return path to the unzipped file
  const unzipFile = async (filePath) => {
    const gunzipStream = createGunzip();
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(gunzipStream);
    const unzippedFilePath = filePath.replace('.gz', '');
    const writeStream = fs.createWriteStream(unzippedFilePath);
    gunzipStream.pipe(writeStream);
    await writeStream.on('finish', () => {
      debug(`Unzipped ${filePath} to ${unzippedFilePath}`);
    });
    return unzippedFilePath;
  };
  const path = await unzipFile(file.path);
  const files = await open(join(path), 'r');
  const stream = files.readableWebStream();

  // parse the xml file
  // let i = 0;

  //  const fileStream = await open(file.path, 'r');
  //const readableStream = fileStream.readableWebStream();
  // debug(readableStream);
  let { shouldImport, lastDocument } = options;
  let imported = 0;
  const actions = [];
  for await (const entry of parseStream(stream, 'PubmedArticle')) {
    if (!shouldImport) {
      if (entry.MedlineCitation.PMID['#text'] !== lastDocument._id) {
        continue;
      }
      shouldImport = true;
      debug(`Skipping pubmeds till: ${lastDocument._id}`);
      continue;
    }
    if (shouldImport) {
      actions.push(
        improvePubmedPool(entry)
          .then((result) => {
            result._seq = ++progress.seq;
            return collection.updateOne(
              { _id: result._id },
              { $set: result },
              { upsert: true },
            );
          })
          .then(() => {
            progress.sources = file.path.replace(
              process.env.ORIGINAL_DATA_PATH,
              '',
            );
            return connection.setProgress(progress);
          }),
      );
      imported++;
    }
    await Promise.all(actions);
    logs.dateEnd = Date.now();
    logs.endSequenceID = progress.seq;
    logs.status = 'updated';
    await connection.updateImportationLog(logs);
    debug(`${imported} articles processed`);
  }

  return imported;
}
