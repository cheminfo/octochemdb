import Debug from '../../../utils/Debug.js';

import { parseCmaup } from './utils/parseCmaup.js';
import cmaupStartSync from './utils/cmaupStartSync.js';

const debug = Debug('syncCmaup');

export async function sync(connection) {
  const {
    firstID,
    lastDocumentImported,
    progress,
    sources,
    collection,
    general,
    activities,
    speciesPair,
    speciesInfo,
    logs,
  } = await cmaupStartSync(connection);

  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();

  // Reimport collection again only if lastDocument imported changed or importation was not completed
  if (
    lastDocumentImported === null ||
    sources !== progress.sources ||
    progress.state !== 'updated'
  ) {
    let parseSkip;
    if (skipping && progress.state !== 'updated') {
      parseSkip = firstID;
    }
    debug(`Start parsing cmaup`);
    for await (const entry of parseCmaup(
      general,
      activities,
      speciesPair,
      speciesInfo,
      parseSkip,
    )) {
      counter++;
      // If test mode break process after counter >20
      if (process.env.TEST === 'true' && counter > 20) break;
      // Skipp importation till last id imported if collection was not fully updated
      if (skipping && progress.state !== 'updated') {
        if (firstID === entry._id) {
          skipping = false;
          debug(`Skipping compound till:${firstID}`);
        }
        continue;
      }
      // Log dubug each 10s or defined time
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
    await connection.updateImportationLog(logs);
    progress.sources = sources;
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
}
