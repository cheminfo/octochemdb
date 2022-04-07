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
  const progress = await connection.getProgress('coconut');
  const collection = await connection.getCollection('coconut');
  await collection.createIndex({ 'data.ocl.id': 1 });
  await collection.createIndex({ 'data.ocl.noStereoID': 1 });
  const lastDocumentImported = await getLastDocumentImported(
    connection,
    progress,
    options.collectionName,
  );
  let firstID;
  if (
    lastDocumentImported &&
    lastDocumentImported._source &&
    lastFile.includes(lastDocumentImported._source)
  ) {
    firstID = lastDocumentImported._id;
  }

  const targetFile = await unzipOneFile(
    '/coconut/full',
    lastFile,
    'uniqueNaturalProduct.bson',
  );
  // we reparse all the file and skip if required
  const source = lastFile.replace(process.env.ORIGINAL_DATA_PATH, '');
  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();
  if (
    lastDocumentImported === null ||
    !lastFile.includes(lastDocumentImported._source) ||
    progress.state !== 'updated'
  ) {
    if (progress.state === 'updated') {
      debug('Droped old collection');
      await connection.dropCollection('coconut');
    }
    debug(`Start parsing: ${targetFile}`);
    progress.state = 'updating';
    await connection.setProgress(progress);
    for await (const entry of parseCoconut(targetFile)) {
      counter++;
      if (process.env.TEST === 'true' && counter > 20) break;
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
        debug(`Processing: counter: ${counter} - imported: ${imported}`);
        start = Date.now();
      }
      if (skipping && progress.state !== 'updated') {
        if (firstID === entry._id) {
          skipping = false;
          debug(`Skipping compound till:${firstID}`);
        }
        continue;
      }
      entry._seq = ++progress.seq;
      entry._source = source;

      await collection.updateOne(
        { _id: entry._id },
        { $set: entry },
        { upsert: true },
      );
      await connection.setProgress(progress);
      imported++;
    }
    progress.date = new Date();
    progress.state = 'updated';
    await connection.setProgress(progress);
    debug(`${imported} compounds processed`);
  } else {
    debug(`file already processed`);
  }
  // we remove all the entries that are not imported by the last file
  if (existsSync(targetFile)) {
    rmSync(targetFile, { recursive: true });
  }
}
