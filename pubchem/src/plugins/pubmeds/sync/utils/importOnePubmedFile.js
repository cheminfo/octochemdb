import { rmSync } from 'fs';
import { open } from 'fs/promises';

import { parseStream } from 'arraybuffer-xml-parser';

import Debug from '../../../../utils/Debug.js';

import { decompressGziped } from './decompressGziped.js';
import improvePubmedPool from './improvePubmedPool.js';

const debug = Debug('importOnePubmedFile');

export default async function importOnePubmedFile(
  connection,
  progress,
  file,
  options,
) {
  try {
    const collection = await connection.getCollection('pubmeds');
    await collection.createIndex({ _seq: 1 });
    debug(`Importing: ${file.name}`);
    const logs = await connection.geImportationLog({
      collectionName: 'pubmeds',
      sources: file.name,
      startSequenceID: progress.seq,
    });

    const filePath = await decompressGziped(file.path);
    const fileStream = await open(filePath, 'r');
    // @ts-ignore
    const readableStream = fileStream.readableWebStream();
    let { shouldImport, lastDocument } = options;
    let imported = 0;
    const actions = [];
    debug(`Importing ${file.name}`);
    for await (const entry of parseStream(readableStream, 'PubmedArticle')) {
      if (!shouldImport) {
        // @ts-ignore
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
    }
    await Promise.all(actions);
    logs.dateEnd = Date.now();
    logs.endSequenceID = progress.seq;
    logs.status = 'updated';
    await connection.updateImportationLog(logs);
    debug(`${imported} articles processed`);
    // Remove the decompressed gzip file after it has been imported
    await fileStream.close();
    rmSync(filePath, { recursive: true });
    return imported;
  } catch (err) {
    debug(err, { collection: 'pubmeds', connection });
  }
}
