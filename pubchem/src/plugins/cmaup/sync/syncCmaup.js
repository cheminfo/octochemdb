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
    newFiles,
  } = await cmaupStartSyning(connection);
  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();
  let oldSource;
  if (lastDocumentImported !== null) {
    oldSource = lastDocumentImported._source;
  } else {
    oldSource = ['it is the first importation'];
  }

  let status = false;
  for (let i = 0; i < newFiles.length; i++) {
    if (newFiles[i].includes(oldSource[i])) status = true;
    if (!status) break;
  }

  // Reimport collection again only if lastDocument imported changed or importation was not completed
  if (
    lastDocumentImported === null ||
    !status ||
    progress.state !== 'updated'
  ) {
    if (progress.state === 'updated') {
      debug('Droped old collection');
      await connection.dropCollection('cmaup');
    }
    for (const entry of parseCmaup(
      general,
      activities,
      speciesPair,
      speciesInfo,
    )) {
      counter++;
      // If test mode break process after counter >20
      if (process.env.TEST === 'true' && counter > 20) break;
      // Log dubug each 10s or defined time
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
        debug(`Processing: counter: ${counter} - imported: ${imported}`);
        start = Date.now();
      }
      // Skipp importation till last id imported if collection was not fully updated
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
      progress.state = 'updating';
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
}
