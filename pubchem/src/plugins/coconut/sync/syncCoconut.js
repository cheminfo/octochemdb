import pkg from 'fs-extra';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';
import { unzipOneFile } from '../../../utils/unzipOneFile.js';

import { parseCoconut } from './utils/parseCoconut.js';

const { rmSync, existsSync } = pkg;

const debug = Debug('syncCoconut');

export async function sync(connection) {
  let options = {
    collectionSource: process.env.COCONUT_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/coconut/full`,
    collectionName: 'coconut',
    filenameNew: 'coconut',
    extensionNew: 'zip',
  };
  const lastFile = await getLastFileSync(options);
  const progress = await connection.getProgress(options.collectionName);
  const collection = await connection.getCollection(options.collectionName);
  const logs = await connection.getImportationLog({
    collectionMame: options.collectionName,
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
  let firstID;
  if (lastDocumentImported !== null) {
    firstID = lastDocumentImported._id;
  }

  const targetFile = await unzipOneFile(
    '/coconut/full',
    lastFile,
    'uniqueNaturalProduct.bson',
  );

  // we reparse all the file and skip if required
  const source = [lastFile.replace(process.env.ORIGINAL_DATA_PATH, '')];

  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();
  if (
    lastDocumentImported === null ||
    !lastFile.includes(logs.sources) ||
    progress.state !== 'updated'
  ) {
    debug(`Start parsing: ${targetFile}`);
    if (logs.status === 'updated' || lastDocumentImported === null) {
      logs.sources = source;
      logs.dateStart = Date.now();
      logs.status = 'updating';
      logs.startSequenceID = progress.seq;
      await connection.setLogs(logs);
    }
    for await (const entry of parseCoconut(targetFile)) {
      counter++;
      if (process.env.TEST === 'true' && counter > 20) break;
      if (skipping && progress.state !== 'updated') {
        if (firstID === entry._id) {
          skipping = false;
          debug(`Skipping compound till:${firstID}`);
        }
        continue;
      }
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
        debug(`Processing: counter: ${counter} - imported: ${imported}`);
        start = Date.now();
      }

      entry._seq = ++progress.seq;
      progress.state = 'updating';
      await collection.updateOne(
        { _id: entry._id },
        { $set: entry },
        { upsert: true },
      );
      await connection.setProgress(progress);
      imported++;
    }
    logs.dateEnd = Date.now();
    logs.endSequenceID = progress.seq;
    logs.status = 'updated';
    await connection.setLogs(logs);

    progress.date = new Date();
    progress.state = 'updated';
    await connection.setProgress(progress);
    debug(`${imported} compounds processed`);
  } else {
    debug(`file already processed`);
  }
  // we remove all the entries that are not imported by the last file
  const result = await collection.deleteMany({
    _seq: { $lte: logs.startSequenceID },
  });
  debug(`Deleting entries with wrong source: ${result.deletedCount}`);

  // we remove all the entries that are not imported by the last file
  if (existsSync(targetFile)) {
    rmSync(targetFile, { recursive: true });
  }
}
