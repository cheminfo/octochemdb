import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';

import parseBioactivities from './utils/parseBioactivities.js';

export async function sync(connection) {
  const debug = Debug('syncBioassays');
  let options = {
    collectionSource: process.env.ACTIVITIES_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/bioassays/full`,
    collectionName: 'bioassays',
    filenameNew: 'bioactivities',
    extensionNew: 'tsv.gz',
  };
  try {
    const bioactivitiesFile = await getLastFileSync(options);
    const sourceActivity = [
      bioactivitiesFile.replace(process.env.ORIGINAL_DATA_PATH, ''),
    ];
    options.collectionSource = process.env.BIOASSAY_SOURCE;
    options.filenameNew = 'bioassays';
    const bioassaysFile = await getLastFileSync(options);
    const sources = [
      bioassaysFile.replace(process.env.ORIGINAL_DATA_PATH, ''),
      sourceActivity,
    ];
    const progress = await connection.getProgress(options.collectionName);
    const collection = await connection.getCollection(options.collectionName);
    await collection.createIndex({ _seq: 1 });
    await collection.createIndex({ _id: 1 });
    await collection.createIndex({ 'data.bioassays.activeAgainsTaxIDs': 1 });
    await collection.createIndex({ 'data.bioassays.aid': 1 });

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
    let firstID;
    if (lastDocumentImported !== null) {
      firstID = lastDocumentImported._id;
    }

    let skipping = firstID !== undefined;
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (
      lastDocumentImported === null ||
      md5(JSON.stringify(sources)) !== progress.sources ||
      progress.state !== 'updated'
    ) {
      debug(`Start parsing`);
      let parseSkip;
      if (skipping && progress.state !== 'updated') {
        parseSkip = firstID;
      }
      for await (let entry of parseBioactivities(
        bioactivitiesFile,
        bioassaysFile,
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
      progress.sources = md5(JSON.stringify(sources));
      progress.date = new Date();
      progress.state = 'updated';
      await connection.setProgress(progress);
      debug(`${imported} compounds processed`);
    } else {
      debug(`file already processed`);
    }

    const result = await collection.deleteMany({
      _seq: { $lte: logs.startSequenceID },
    });
    debug(`Deleting entries with wrong source: ${result.deletedCount}`);
  } catch (e) {
    const optionsDebug = { collection: options.collectionName, connection };
    debug(e, optionsDebug);
  }
}
