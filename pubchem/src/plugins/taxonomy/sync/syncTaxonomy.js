import { readFileSync } from 'fs';

import { fileListFromZip } from 'filelist-from';

import getFileIfNew from '../../../sync/http/utils/getFileIfNew.js';
import Debug from '../../../utils/Debug.js';

import { taxonomyParser } from './utils/taxonomyParser.js';

const debug = Debug('syncTaxonomy');

export async function sync(connection) {
  const lastFile = await getLastTaxonomyFile();
  const progress = await connection.getProgress('taxonomies');
  const collection = await connection.getCollection('taxonomies');

  const lastDocumentImported = await getLastTaxonomyImported(
    connection,
    progress,
  );
  let firstID;
  if (
    lastDocumentImported &&
    lastDocumentImported._source &&
    lastFile.includes(lastDocumentImported._source)
  ) {
    firstID = lastDocumentImported._id;
  }
  const fileList = (await fileListFromZip(readFileSync(lastFile))).filter(
    (file) => file.name === 'fullnamelineage.dmp',
  );
  const arrayBuffer = await fileList[0].arrayBuffer();

  // we reparse all the file and skip if required
  const source = lastFile.replace(process.env.ORIGINAL_DATA_PATH, '');
  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();
  if (
    lastDocumentImported === null ||
    (!lastFile.includes(lastDocumentImported._source) &&
      progress.state === 'updated') ||
    progress.state !== 'updated'
  ) {
    progress.state = 'updating';
    await connection.setProgress(progress);
    for (const entry of taxonomyParser(arrayBuffer)) {
      counter++;
      if (process.env.TEST === 'true' && counter > 20) break;
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
        debug(`Processing: counter: ${counter} - imported: ${imported}`);
        start = Date.now();
      }
      if (skipping) {
        if (firstID === entry._id) {
          skipping = false;
          debug(`Skipping taxonomies till:${firstID}`);
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
  }
  progress.state = 'updated';
  await connection.setProgress(progress);

  debug(`${imported} taxonomies processed`);

  // we remove all the entries that are not imported by the last file
  const result = await collection.deleteMany({
    _source: { $ne: source },
  });
  debug(`Deleting entries with wrong source: ${result.deletedCount}`);
}

async function getLastTaxonomyImported(connection, progress) {
  const collection = await connection.getCollection('taxonomies');
  return collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();
}

async function getLastTaxonomyFile() {
  debug('Get last taxonomy file if new');

  const source = process.env.TAXONOMY_SOURCE;
  const destination = `${process.env.ORIGINAL_DATA_PATH}/taxonomy/full`;

  debug(`Syncing: ${source} to ${destination}`);

  return getFileIfNew({ url: source }, destination, {
    filename: 'taxonomy',
    extension: 'zip',
  });
}
