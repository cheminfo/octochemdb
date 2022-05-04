import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';

import { parseLotuses } from './utils/parseLotuses.js';
import md5 from 'md5';
const debug = Debug('syncLotuses');

export async function sync(connection) {
  let options = {
    collectionSource: process.env.LOTUS_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/lotuses/full`,
    collectionName: 'lotuses',
    filenameNew: 'lotuses',
    extensionNew: 'zip',
  };
  try {
    const lastFile = await getLastFileSync(options);
    const sources = [lastFile.replace(process.env.ORIGINAL_DATA_PATH, '')];
    const progress = await connection.getProgress('lotuses');
    const collection = await connection.getCollection('lotuses');

    const logs = await connection.geImportationtLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });

    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );

    let fileName = 'lotusUniqueNaturalProduct.bson';

    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (
      lastDocumentImported === null ||
      md5(JSON.stringify(sources)) !== progress.sources ||
      progress.state !== 'updated'
    ) {
      const temporaryCollection = await connection.getCollection(
        'temporaryLotuses',
      );
      debug(`Start parsing: ${fileName}`);
      progress.state = 'updating';
      await connection.setProgress(progress);
      for await (const entry of parseLotuses(lastFile, fileName, connection)) {
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
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );
        imported++;
      }
      // Temporary collection replace old collection
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });

      // update Logs in importationLogs collection
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);

      //Update progress in admin collection
      progress.sources = md5(JSON.stringify(sources));
      progress.date = new Date();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // Indexing of collection properties
      await collection.createIndex({ _seq: 1 });
      await collection.createIndex({ 'data.ocl.id': 1 });
      await collection.createIndex({ 'data.ocl.noStereoID': 1 });
      debug(`${imported} compounds processed`);
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    const optionsDebug = { collection: 'lotuses', connection };
    debug(e, optionsDebug);
  }
}
