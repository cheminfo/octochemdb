import md5 from 'md5';
import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';
import { insertNoStereoIDsAndTaxonomies } from './utils/insertNoStereoIDsAndTaxonomies.js';
import parseBioactivities from './utils/parseBioactivities.js';

export async function sync(connection) {
  const debug = Debug('syncBioassays');
  // Options defined outise try-catch to allow debug when error is throw
  let options = {
    collectionSource: process.env.ACTIVITIES_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/bioassays/full`,
    collectionName: 'bioassays',
    filenameNew: 'bioactivities',
    extensionNew: 'tsv.gz',
  };
  try {
    // Get last files available from source if their size changed compared to local ones
    const bioactivitiesFile = await getLastFileSync(options);
    options.collectionSource = process.env.BIOASSAY_SOURCE;
    options.filenameNew = 'bioassays';
    const bioassaysFile = await getLastFileSync(options);
    // Get collection progress (admin) and the one to be updated
    const progress = await connection.getProgress(options.collectionName);
    const collection = await connection.getCollection(options.collectionName);
    // Get last document (record) in the collection to be updated
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );
    // Get collection logs (importationLogs)
    const sources = [
      bioassaysFile.replace(process.env.ORIGINAL_DATA_PATH, ''),
      bioactivitiesFile.replace(process.env.ORIGINAL_DATA_PATH, ''),
    ];
    const logs = await connection.geImportationtLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
    // Define differents couters
    let counter = 0;
    let imported = 0;
    let start = Date.now();

    if (
      lastDocumentImported === null ||
      md5(JSON.stringify(sources)) !== progress.sources ||
      progress.state !== 'updated'
    ) {
      // Define stat updating because in case of failure Cron will retry importation in 24h
      progress.state = 'updating';
      await connection.setProgress(progress);
      // Create a temporaty Collection to avoid to drop the data already imported before the new ones are ready
      const temporaryCollection = await connection.getCollection(
        'temporaryBioassays',
      );
      debug(`Start parsing`);
      for await (let entry of parseBioactivities(
        bioactivitiesFile,
        bioassaysFile,
        connection,
      )) {
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
        counter++;
      }
      // Once it is finished, the temporary collection replace the old collection
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });
      // Define logs informations in collection importationLogs
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      // Define new informations and set state to updated in admin collection
      progress.sources = md5(JSON.stringify(sources));
      progress.date = new Date();
      progress.state = 'updated';
      await connection.setProgress(progress);
      debug(`${imported} compounds processed`);

      // Indexing of properties in collection
      await collection.createIndex({ _seq: 1 });
      await collection.createIndex({ _id: 1 });
      await collection.createIndex({ 'data.activeAgainsTaxIDs': 1 });
      await collection.createIndex({ 'data.aid': 1 });
      await collection.createIndex({ 'data.cid': 1 });

      // Insert noStereoIDs in collection and Taxonomies of target organisms
      let noStereoIDsBioassays = await insertNoStereoIDsAndTaxonomies(
        connection,
      );
      debug(
        `Number of noStereoIDs added to bioassays: ${noStereoIDsBioassays}`,
      );
      // Indexing new properties
      await collection.createIndex({ 'data.ocl.noStereoID': 1 });
      await collection.createIndex({ 'data.activeAgainstTaxonomy': 1 });
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    // If error is chatched, debug it on telegram
    const optionsDebug = { collection: options.collectionName, connection };
    debug(e, optionsDebug);
  }
}
