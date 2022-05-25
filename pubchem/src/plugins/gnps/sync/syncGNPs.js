import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';

import { parseGNPs } from './utils/parseGNPs.js';

const debug = Debug('syncGNPs');

export async function sync(connection) {
  try {
    let options = {
      collectionSource: process.env.GNPS_SOURCE,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/gnps/full`,
      collectionName: 'gnps',
      filenameNew: 'gnps_full',
      extensionNew: 'json',
    };
    const lastFile = await getLastFileSync(options);
    const sources = [lastFile.replace(process.env.ORIGINAL_DATA_PATH, '')];

    const progress = await connection.getProgress(options.collectionName);
    const collection = await connection.getCollection(options.collectionName);

    const logs = await connection.geImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });

    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );

    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (
      lastDocumentImported === null ||
      md5(JSON.stringify(sources)) !== progress.sources ||
      progress.state !== 'updated'
    ) {
      const temporaryCollection = await connection.getCollection(
        'temporaryGNPs',
      );
      debug(`Start parsing: ${lastFile}`);
      progress.state = 'updating';
      await connection.setProgress(progress);
      for await (const entry of parseGNPs(lastFile, connection)) {
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
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });

      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      await collection.createIndex({ _id: 1 });
      await collection.createIndex({ 'data.ocl.id': 1 });
      await collection.createIndex({ 'data.ocl.noStereoID': 1 });
      await collection.createIndex({ 'spectralData.msLevel': 1 });
      await collection.createIndex({ 'spectralData.ionSource': 1 });
      await collection.createIndex({ 'spectralData.precursorMz': 1 });
      await collection.createIndex({ 'spectralData.adduct': 1 });
      await collection.createIndex({ 'spectralData.ionMode': 1 });
      await collection.createIndex({ 'spectralData.spectrum': 1 });

      debug(`${imported} compounds processed`);
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    const optionsDebug = { collection: 'gnps', connection };
    debug(e, optionsDebug);
  }
}
