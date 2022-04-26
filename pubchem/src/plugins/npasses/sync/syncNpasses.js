import Debug from '../../../utils/Debug.js';
import npassesStartSync from './utils/npassesStartSync.js';

import { parseNpasses } from './utils/parseNpasses.js';

const debug = Debug('syncNpasses');

export async function sync(connection) {
  try {
    const {
      firstID,
      lastDocumentImported,
      progress,
      sources,
      collection,
      general,
      activities,
      properties,
      speciesPair,
      speciesInfo,
      logs,
    } = await npassesStartSync(connection);
    await collection.createIndex({ ' _seq': 1 });

    // we reparse all the file and skip if required
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
      debug(`Start parsing npass`);

      for await (const entry of parseNpasses(
        general,
        activities,
        properties,
        speciesPair,
        speciesInfo,
        parseSkip,
        connection,
      )) {
        counter++;
        if (process.env.TEST === 'true' && counter > 20) break;

        if (
          Date.now() - start >
          Number(process.env.DEBUG_THROTTLING || 10000)
        ) {
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
  } catch (e) {
    const optionsDebug = { collection: 'npasses', connection };
    debug(e, optionsDebug);
  }
}
