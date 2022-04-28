import { readFileSync, createReadStream } from 'fs';
import { createGunzip, gunzipSync } from 'zlib';
import { toJson } from 'xml2json';
import pkg from 'xml-flow';
const flow = pkg;

import Debug from '../../../../utils/Debug.js';

import improvePubmed from './improvePubmed.js';

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
  const logs = await connection.geImportationtLog({
    collectionName: 'pubmeds',
    sources: file.name,
    startSequenceID: progress.seq,
  });
  // should we directly import the data how wait that we reach the previously imported information

  const stream = createReadStream(file.path).pipe(createGunzip());
  const xmlStream = flow(stream);
  let { shouldImport, lastDocument } = options;
  let imported = 0;
  await new Promise((resolve, reject) => {
    xmlStream
      .on('tag:pubmedarticle', async (article) => {
        if (!stop) {
          let recovertToXml = pkg.toXml(article);
          let pubMedObject = toJson(recovertToXml, {
            object: true,
            alternateTextNode: true,
          }).pubmedarticle.medlinecitation;

          if (!pubMedObject) throw new Error('citation not found', article);
          if (!shouldImport) {
            if (pubMedObject.pmid !== lastDocument._id) {
              shouldImport = true;
              debug(`Skipping pubmeds till: ${lastDocument._id}`);
            }
          }
          if (shouldImport) {
            let articles = improvePubmed(pubMedObject);
            articles._seq = ++progress.seq;

            progress.sources = file.path.replace(
              process.env.ORIGINAL_DATA_PATH,
              '',
            );
            await collection.updateOne(
              { _id: articles._id },
              { $set: articles },
              { upsert: true },
            );
            await connection.setProgress(progress);
            imported++;
          }
        }
      })
      .on('end', async () => {
        resolve();
        logs.dateEnd = Date.now();
        logs.endSequenceID = progress.seq;
        logs.status = 'updated';
        await connection.updateImportationLog(logs);
        debug(`${imported} pubmeds processed`);
      });
  });
  return imported;
}
