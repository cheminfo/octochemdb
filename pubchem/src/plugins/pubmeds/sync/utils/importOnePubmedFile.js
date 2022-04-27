import { readFileSync, createReadStream } from 'fs';
import { createGunzip, gunzipSync } from 'zlib';

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
  let { shouldImport = true, lastDocument } = options;
  let imported = 0;
  let start = Date.now();
  await new Promise((resolve, reject) => {
    xmlStream
      .on('tag:pubmedarticle', async (article) => {
        let medlineCitation = article.medlinecitation;
        if (!medlineCitation) throw new Error('citation not found', article);
        if (!shouldImport) {
          if (medlineCitation.pmid !== lastDocument._id) {
            return;
          }
          shouldImport = true;
          if (
            Date.now() - start >
            Number(process.env.DEBUG_THROTTLING || 10000)
          ) {
            debug(`Skipping pubmeds till: ${lastDocument._id}`);
            start = Date.now();
          }
        }

        let articles = improvePubmed(medlineCitation);

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
