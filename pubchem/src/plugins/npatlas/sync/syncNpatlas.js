import { readFileSync } from 'fs';

import Debug from 'debug';

import getFileIfNew from '../../../sync/http/utils/getFileIfNew.js';

import { npAtlasParser } from './utils/npAtlasParser.js';

const debug = Debug('syncNpAtlas');

export async function sync(connection) {
  const lastFile = await getLastTaxonomyFile();
  const progress = await connection.getProgress('npAtlas');
  const collection = await connection.getCollection('npAtlas');

  const lastDocumentImported = await getLastTaxonomyImported(
    connection,
    progress,
  );
  debug(`lastDocumentImported: ${JSON.stringify(lastDocumentImported)}`);
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
  for (const entry of npAtlasParser(JSON.parse(fileJson))) {
    counter++;
    if (process.env.TEST === 'true' && counter > 20) break;
    if (Date.now() - start > 10000) {
      debug(`Processing: counter: ${counter} - imported: ${imported}`);
      start = Date.now();
    }
    if (skipping) {
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
  debug(`${imported} compounds processed`);

  // we remove all the entries that are not imported by the last file
  const result = await collection.deleteMany({
    _source: { $ne: source },
  });
  debug(`Deleting entries with wrong source: ${result.deletedCount}`);
}

async function getLastTaxonomyImported(connection, progress) {
  const collection = await connection.getCollection('npAtlas');
  return collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();
}

async function getLastTaxonomyFile() {
  debug('Get last npAtlas file if new');

  const source = process.env.NPATLAS_SOURCE;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/npAtlas/full`;

  debug(`Syncing: ${source} to ${destination}`);

  return getFileIfNew({ url: source }, destination);
}
