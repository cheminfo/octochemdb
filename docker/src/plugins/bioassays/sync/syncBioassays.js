import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';
import { taxonomySynonyms } from '../../activesOrNaturals/utils/utilsTaxonomies/taxonomySynonyms.js';

import parseBioactivities from './utils/parseBioactivities.js';

const debug = debugLibrary('syncBioassays');
/**
 * @description Synchronize the bioassays collection from ftp server
 * @param {*} connection the connection object
 * @returns {Promise} Returns the bioassays collection
 */
export async function sync(connection) {
  let options = {
    collectionSource: process.env.ACTIVITIES_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/bioassays/full`,
    collectionName: 'bioassays',
    filenameNew: 'bioactivities',
    extensionNew: 'tsv.gz',
  };
  try {
    const progress = await connection.getProgress(options.collectionName);
    let bioactivitiesFile;
    let bioassaysFile;
    let sources;
    if (process.env.NODE_ENV === 'test') {
      bioactivitiesFile = `${process.env.BIOACTIVITIES_SOURCE_TEST}`;
      bioassaysFile = `${process.env.BIOASSAY_SOURCE_TEST}`;
      sources = [bioassaysFile, bioactivitiesFile];
    } else {
      // Download the bioActivities and bioAssays files if newer than last sync
      bioactivitiesFile = await getLastFileSync(options);
      options.collectionSource = process.env.BIOASSAY_SOURCE;
      options.filenameNew = 'bioassays';
      bioassaysFile = await getLastFileSync(options);
      // Get progress of last sync and the bioassays collection
      sources = [
        bioassaysFile.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
        bioactivitiesFile.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''),
      ];
    }

    // Get the last document imported
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    let isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.BIOASSAY_UPDATE_INTERVAL,
      connection,
    );
    // Define different coulters
    let counter = 0;
    let imported = 0;
    let start = Date.now();

    if (isTimeToUpdate) {
      // get compounds and taxonomies collections
      const oldToNewTaxIDs = await taxonomySynonyms();
      const collectionTaxonomies = await connection.getCollection('taxonomies');
      const collectionCompounds = await connection.getCollection('compounds');
      const collection = await connection.getCollection(options.collectionName);
      // Generate Logs for the sync
      const logs = await connection.getImportationLog({
        collectionName: options.collectionName,
        sources,
        startSequenceID: progress.seq,
      });
      // set progress to updating, if fail importation, a new try will be done 24h later
      progress.state = 'updating';
      await connection.setProgress(progress);
      // Temporary collection to store the new data
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      debug.info(`Start importing bioassays`);
      for await (let entry of parseBioactivities(
        bioactivitiesFile,
        bioassaysFile,
        connection,
        collectionCompounds,
        collectionTaxonomies,
        oldToNewTaxIDs,
      )) {
        // If cron launched in mode test, the importation will be stopped after 20 iteration
        if (process.env.NODE_ENV === 'test' && counter > 20) break;
        // Debug the processing progress every 10s or the defined time in process env
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }
        // update temporary collection with the new data
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
      // update logs with the new progress
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      // update progress with the new progress
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      debug.info(`${imported} compounds processed`);

      // Indexing of properties in collection
      await createIndexes(collection, [
        { 'data.ocl.noStereoTautomerID': 1 },
        { _seq: 1 },
      ]);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.stack, {
        collection: options.collectionName,
        connection,
        stack: e.stack,
      });
    }
  }
}
