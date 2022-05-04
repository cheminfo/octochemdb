import { readFileSync } from 'fs';

import md5 from 'md5';
import Debug from '../../../utils/Debug.js';

import { parseNpatlases } from './utils/parseNpatlases.js';
import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
const debug = Debug('syncNpAtlases');

export async function sync(connection) {
  try {
    let options = {
      collectionSource: process.env.NPATLAS_SOURCE,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/npAtlases/full`,
      collectionName: 'npAtlases',
      filenameNew: 'npAtlases',
      extensionNew: 'json',
    };
    const lastFile = await getLastFileSync(options);
    const sources = [lastFile.replace(process.env.ORIGINAL_DATA_PATH, '')];

    const progress = await connection.getProgress(options.collectionName);
    const collection = await connection.getCollection(options.collectionName);
    await collection.createIndex({ _seq: 1 });

    const logs = await connection.geImportationtLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
    await collection.createIndex({ 'data.ocl.id': 1 });
    await collection.createIndex({ 'data.ocl.noStereoID': 1 });
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );

    const fileJson = readFileSync(lastFile, 'utf8');

    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (
      lastDocumentImported === null ||
      md5(JSON.stringify(sources)) !== progress.sources ||
      progress.state !== 'updated'
    ) {
      const temporaryCollection = await connection.getCollection(
        'temporaryNpAtlases',
      );
      debug(`Start parsing: ${lastFile}`);
      progress.state = 'updating';
      await connection.setProgress(progress);
      for await (const entry of parseNpatlases(
        JSON.parse(fileJson),
        connection,
      )) {
        counter++;
        if (process.env.TEST === 'true' && counter > 20) break;

        if (
          Date.now() - start >
          Number(process.env.DEBUG_THROTTLING || 10000)
        ) {
          debug(`Processing: counter: ${counter} - imported: ${imported}`);
          start = Date.now();
        }
        entry._seq = ++progress.seq;
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );
        imported++;
      }
      temporaryCollection.renameCollection(collection, true);

      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      progress.sources = md5(JSON.stringify(sources));
      progress.date = new Date();
      progress.state = 'updated';
      await connection.setProgress(progress);
      debug(`${imported} compounds processed`);
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    const optionsDebug = { collection: 'npAtlases', connection };
    debug(e, optionsDebug);
  }
}
