import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';

import { insertNoStereoIDsAndTaxonomies } from './utils/insertNoStereoIDsAndTaxonomies.js';
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

    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (
      lastDocumentImported === null ||
      md5(JSON.stringify(sources)) !== progress.sources ||
      progress.state !== 'updated'
    ) {
      debug(`Start parsing`);
      progress.state = 'updating';
      await connection.setProgress(progress);
      const temporaryCollection = await connection.getCollection(
        'temporaryBioassays',
      );
      for await (let entry of parseBioactivities(
        bioactivitiesFile,
        bioassaysFile,
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
      progress.date = new Date();
      progress.state = 'updated';
      await connection.setProgress(progress);
      debug(`${imported} compounds processed`);
      await collection.createIndex({ _seq: 1 });
      await collection.createIndex({ _id: 1 });
      await collection.createIndex({ 'data.activeAgainsTaxIDs': 1 });
      await collection.createIndex({ 'data.aid': 1 });
      await collection.createIndex({ 'data.cid': 1 });
      let noStereoIDsBioassays = await insertNoStereoIDsAndTaxonomies(
        connection,
      );
      debug(
        `Number of noStereoIDs added to bioassays: ${noStereoIDsBioassays}`,
      );
      await collection.createIndex({ 'data.ocl.noStereoID': 1 });
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    const optionsDebug = { collection: options.collectionName, connection };
    debug(e, optionsDebug);
  }
}
