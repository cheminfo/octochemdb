import { readFileSync } from 'fs';

import Debug from '../../../utils/Debug.js';

import { parseCmaup } from './utils/parseCmaup.js';
import cmaupStartSyning from './utils/cmaupStartSyning.js';

const debug = Debug('syncCmaup');

export async function sync(connection) {
  const {
    firstID,
    lastDocumentImported,
    progress,
    source,
    collection,
    general,
    activities,
    speciesPair,
    speciesInfo,
    lastFile,
  } = await cmaupStartSyning(connection);
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
    for (const entry of parseCmaup(
      general,
      activities,
      speciesPair,
      speciesInfo,
    )) {
      counter++;
      if (process.env.TEST === 'true' && counter > 20) break;
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
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
      progress.state = 'updating';
      await connection.setProgress(progress);
      imported++;
    }
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
