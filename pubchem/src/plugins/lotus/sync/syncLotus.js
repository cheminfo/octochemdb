import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import Debug from 'debug';
import { fileListFromZip } from 'filelist-from';

import getFileIfNew from '../../../sync/http/utils/getFileIfNew.js';

import { parseLotus } from './utils/parseLotus.js';

const debug = Debug('syncLotus');

export async function sync(connection) {
  const lastFile = await getLastTaxonomyFile();
  const progress = await connection.getProgress('lotus');
  const collection = await connection.getCollection('lotus');

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
  const fileList = (await fileListFromZip(readFileSync(lastFile))).filter(
    (file) => file.name === 'lotusUniqueNaturalProduct.bson',
  );
  ///
  const targetFolder = `${process.env.ORIGINAL_DATA_PATH}/lotus/full`;

  const targetFileUnZip = join(targetFolder, fileList[0].name);

  const arrayBufferUnZip = await fileList[0].arrayBuffer();
  writeFileSync(targetFileUnZip, new Uint8Array(arrayBufferUnZip));

  // we reparse all the file and skip if required
  const source = lastFile.replace(process.env.ORIGINAL_DATA_PATH, '');
  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();

  const lotus = await parseLotus(targetFileUnZip);

  for (const entry of lotus) {
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
  const collection = await connection.getCollection('lotus');
  return collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();
}

async function getLastTaxonomyFile() {
  debug('Get last lotus file if new');

  const source = process.env.LOTUS_SOURCE;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/lotus/full`;

  debug(`Syncing: ${source} to ${destination}`);

  return getFileIfNew({ url: source }, destination);
}
//`bsondump --bsonFile lotusUniqueNaturalProduct.bson  | head -100 | jq > head.json`
