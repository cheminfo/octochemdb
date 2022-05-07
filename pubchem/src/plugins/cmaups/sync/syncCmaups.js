import Debug from '../../../utils/Debug.js';

import cmaupsStartSync from './utils/cmaupsStartSync.js';
import { parseCmaups } from './utils/parseCmaups.js';

const debug = Debug('syncCmaups');

export async function sync(connection) {
  try {
    // Get necessary variables like collections, readed files, ecc. (see cmaupsStartSync for details)
    const [
      lastDocumentImported,
      progress,
      sources,
      collection,
      general,
      activities,
      speciesPair,
      speciesInfo,
      logs,
    ] = await cmaupsStartSync(connection);
    // Define counters
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    // Reimport collection again only if lastDocument imported changed or importation was not completed
    if (
      lastDocumentImported === null ||
      sources !== progress.sources ||
      progress.state !== 'updated'
    ) {
      // Define stat updating because in case of failure Cron will retry importation in 24h
      progress.state = 'updating';
      await connection.setProgress(progress);
      // Create a temporaty collection to avoid to drop the data already imported before the new ones are ready
      const temporaryCollection = await connection.getCollection(
        'temporaryCmaups',
      );
      debug(`Start parsing cmaup`);
      for await (const entry of parseCmaups(
        general,
        activities,
        speciesPair,
        speciesInfo,
        connection,
      )) {
        counter++;
        // If cron launched in mode test, the importation will be stoped after 20 iteration
        if (process.env.TEST === 'true' && counter > 20) break;

        // Debug the processing progress every 10s or the defined time in process env
        if (
          Date.now() - start >
          Number(process.env.DEBUG_THROTTLING || 10000)
        ) {
          debug(`Processing: counter: ${counter} - imported: ${imported}`);
          start = Date.now();
        }
        // Insert the entry(i) in the temporary collection
        entry._seq = ++progress.seq;
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );
        imported++;
      }
      // Once it is finished, the temporary collection replace the old collection
      await temporaryCollection.rename('cmaups', {
        dropTarget: true,
      });
      // Define logs informations in collection importationLogs
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      // Define new informations and set state to updated in admin collection
      progress.sources = sources;
      progress.date = new Date();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // Indexing of properties in collection
      await collection.createIndex({ _id: 1 });
      await collection.createIndex({ 'data.ocl.id': 1 });
      await collection.createIndex({ 'data.ocl.noStereoID': 1 });
      await collection.createIndex({ 'data.taxonomies': 1 });

      debug(`${imported} compounds processed`);
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    // If error is chatched, debug it on telegram
    const optionsDebug = { collection: 'cmaups', connection };
    debug(e, optionsDebug);
  }
}
