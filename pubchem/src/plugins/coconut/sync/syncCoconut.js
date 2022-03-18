import { readFileSync } from 'fs';

import Debug from 'debug';
import { fileListFromZip } from 'filelist-from';

import getFileIfNew from '../../../sync/http/utils/getFileIfNew.js';

import { parseCoconut } from './utils/parseCoconut.js';

const debug = Debug('syncCoconut');

export async function sync(connection) {
  const lastFile = await getLastTaxonomyFile();
  const progress = await connection.getProgress('coconut');
  const collection = await connection.getCollection('coconut');

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
    (file) => file.name === 'uniqueNaturalProduct.bson',
  );
  // we reparse all the file and skip if required
  const source = lastFile.replace(process.env.ORIGINAL_DATA_PATH, '');
  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();
  const coconut = await parseCoconut(fileList);
  for (const entry of coconut) {
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
  const collection = await connection.getCollection('coconut');
  return collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();
}

async function getLastTaxonomyFile() {
  debug('Get last coconut file if new');

  const source = process.env.COCONUT_SOURCE;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/coconut/full`;

  debug(`Syncing: ${source} to ${destination}`);

  return getFileIfNew({ url: source }, destination);
}
//`bsondump --bsonFile lotusUniqueNaturalProduct.bson  | head -100 | jq > head.json`
