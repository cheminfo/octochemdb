import debug from '../../../utils/debug.js';
import pkg from 'fs-extra';

import getFileIfNew from '../../../sync/http/utils/getFileIfNew.js';
import { parseLotus } from './utils/parseLotus.js';
import { unzipOneFile } from '../../../utils/unzipOneFile.js';
const { rmSync, existsSync } = pkg;
debug('syncLotus');

export async function sync(connection) {
  const lastFile = await getLastLotusFile();
  const progress = await connection.getProgress('lotus');
  const collection = await connection.getCollection('lotus');
  await collection.createIndex({ 'data.ocl.id': 1 });
  await collection.createIndex({ 'data.ocl.noStereoID': 1 });
  const lastDocumentImported = await getLastLotusImported(connection, progress);
  await debug(`lastDocumentImported: ${JSON.stringify(lastDocumentImported)}`);
  let firstID;
  if (
    lastDocumentImported &&
    lastDocumentImported._source &&
    lastFile.includes(lastDocumentImported._source)
  ) {
    firstID = lastDocumentImported._id;
  }

  const targetFile = await unzipOneFile(
    '/lotus/full',
    lastFile,
    'lotusUniqueNaturalProduct.bson',
  );
  // we reparse all the file and skip if required
  const source = lastFile.replace(process.env.ORIGINAL_DATA_PATH, '');
  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();
  if (
    lastDocumentImported === null ||
    (progress.seq !== lastDocumentImported._seq &&
      lastFile !== lastDocumentImported._source &&
      progress.state !== 'imported')
  ) {
    await debug(`Start parsing: ${targetFile}`);
    for await (const entry of parseLotus(targetFile)) {
      counter++;
      if (process.env.TEST === 'true' && counter > 20) break;
      if (Date.now() - start > 10000) {
        await debug(`Processing: counter: ${counter} - imported: ${imported}`);
        start = Date.now();
      }

      if (skipping) {
        if (firstID === entry._id) {
          skipping = false;
          await debug(`Skipping compound till:${firstID}`);
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
    progress.state = 'imported';
    await connection.setProgress(progress);
    await debug(`${imported} compounds processed`);
  } else {
    await debug(`file already processed`);
  }
  // we remove all the entries that are not imported by the last file
  const result = await collection.deleteMany({
    _source: { $ne: source },
  });
  await debug(`Deleting entries with wrong source: ${result.deletedCount}`);

  if (existsSync(targetFile)) {
    rmSync(targetFile, { recursive: true });
  }
}

async function getLastLotusImported(connection, progress) {
  const collection = await connection.getCollection('lotus');
  return collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();
}

async function getLastLotusFile() {
  await debug('Get last lotus file if new');

  const source = process.env.LOTUS_SOURCE;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/lotus/full`;

  await debug(`Syncing: ${source} to ${destination}`);

  return getFileIfNew({ url: source }, destination, {
    filename: 'lotus',
    extension: 'zip',
  });
}
