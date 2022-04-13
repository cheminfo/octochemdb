import { readFileSync } from 'fs';

import getFileIfNew from '../../../sync/http/utils/getFileIfNew.js';
import Debug from '../../../utils/Debug.js';

import { npAtlasParser } from './utils/npAtlasParser.js';
import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
const debug = Debug('syncNpAtlas');

export async function sync(connection) {
  let options = {
    collectionSource: process.env.NPATLAS_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/npAtlas/full`,
    collectionName: 'npAtlas',
    filenameNew: 'npatlas',
    extensionNew: 'json',
  };
  const lastFile = await getLastFileSync(options);
  const progress = await connection.getProgress('npAtlas');
  const collection = await connection.getCollection('npAtlas');
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
  const fileJson = readFileSync(lastFile, 'utf8');
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
    debug(`Start parsing: ${lastFile}`);
    for (const entry of npAtlasParser(JSON.parse(fileJson))) {
      counter++;
      if (process.env.TEST === 'true' && counter > 20) break;
      if (skipping) {
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
      entry._source = source;
      progress.state = 'updating';
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
  const result = await collection.deleteMany({
    _source: { $ne: source },
  });
  debug(`Deleting entries with wrong source: ${result.deletedCount}`);
}
