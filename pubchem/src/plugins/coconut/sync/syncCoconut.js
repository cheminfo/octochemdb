import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';
import { parseCoconut } from './utils/parseCoconut.js';
import md5 from 'md5';

const debug = Debug('syncCoconut');

export async function sync(connection) {
  let options = {
    collectionSource: process.env.COCONUT_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/coconut/full`,
    collectionName: 'coconut',
    filenameNew: 'coconut',
    extensionNew: 'zip',
  };
  const lastFile = await getLastFileSync(options);
  const sources = [lastFile.replace(process.env.ORIGINAL_DATA_PATH, '')];
  const progress = await connection.getProgress(options.collectionName);
  const collection = await connection.getCollection(options.collectionName);
  const logs = await connection.geImportationtLog({
    collectionName: options.collectionName,
    sources,
    startSequenceID: progress.seq,
  });
  await collection.createIndex({ 'data.ocl.id': 1 });
  await collection.createIndex({ 'data.ocl.noStereoID': 1 });
  const lastDocumentImported = await getLastDocumentImported(
    connection,
    progress,
    options.collectionName,
  );
  let firstID;
  if (lastDocumentImported !== null) {
    firstID = lastDocumentImported._id;
  }

  // we reparse all the file and skip if required

  let skipping = firstID !== undefined;
  let counter = 0;
  let imported = 0;
  let start = Date.now();
  let fileName = 'uniqueNaturalProduct.bson';
  if (
    lastDocumentImported === null ||
    md5(JSON.stringify(sources)) !== progress.sources ||
    progress.state !== 'updated'
  ) {
    let parseSkip;
    if (skipping && progress.state !== 'updated') {
      parseSkip = firstID;
    }
    debug(`Start parsing: ${fileName}`);

    for await (const entry of parseCoconut(lastFile, fileName, parseSkip)) {
      counter++;
      if (process.env.TEST === 'true' && counter > 20) break;

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
    progress.sources = md5(JSON.stringify(sources));
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
