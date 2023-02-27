import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import { getTaxonomiesForCoconuts } from '../../activesOrNaturals/utils/utilsTaxonomies/getTaxonomiesForCoconuts.js';

import { parseCoconuts } from './utils/parseCoconuts.js';

/**
 * @description Synchronize the coconuts collection from the coconut database
 * @param {*} connection MongoDB connection
 * @returns {Promise} returns coconuts collections
 */
export async function sync(connection) {
  const debug = debugLibrary('syncCoconuts');
  let options = {
    collectionSource: process.env.COCONUT_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/coconuts/full`,
    collectionName: 'coconuts',
    filenameNew: 'coconuts',
    extensionNew: 'zip',
  };
  try {
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `${process.env.COCONUTS_SOURCE_TEST}`;
      sources = [lastFile];
    } else {
      // Get lastFile available in the online database, the local database collection and the progress of the import
      const lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`${process.env.ORIGINAL_DATA_PATH}`, '')];
    }
    const progress = await connection.getProgress(options.collectionName);
    let isTimeToUpdate = false;
    if (
      progress.dateEnd !== 0 &&
      Date.now() - progress.dateEnd >
        Number(process.env.COCONUT_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
      md5(JSON.stringify(sources)) !== progress.sources
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
      isTimeToUpdate = true;
    }

    // Get last document imported
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );
    // Define counters
    let counter = 0;
    let imported = 0;
    let start = Date.now();

    // check if importation is necessary
    if (
      lastDocumentImported === null ||
      ((md5(JSON.stringify(sources)) !== progress.sources ||
        progress.state !== 'updated') &&
        isTimeToUpdate)
    ) {
      // define file to use for importation inside the zip file
      let fileName = 'uniqueNaturalProduct.bson';
      debug(`Start parsing: ${fileName}`);
      debug(lastFile);
      const collection = await connection.getCollection(options.collectionName);
      const logs = await connection.getImportationLog({
        collectionName: options.collectionName,
        sources,
        startSequenceID: progress.seq,
      });
      // Get taxonomies collection
      const collectionTaxonomies = await connection.getCollection('taxonomies');
      // create temporary collection to import
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      // set progress to updating
      progress.state = 'updating';
      await connection.setProgress(progress);
      // start importation
      for await (const entry of parseCoconuts(lastFile, fileName, connection)) {
        counter++;
        if (process.env.TEST === 'true' && counter > 20) break;

        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug(`Processing: counter: ${counter} - imported: ${imported}`);
          start = Date.now();
        }
        /// Normalize Taxonomies
        if (entry.data.taxonomies) {
          let taxonomies = await getTaxonomiesForCoconuts(
            entry,
            collectionTaxonomies,
          );
          entry.data.taxonomies = taxonomies;
        }
        entry._seq = ++progress.seq;
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );

        imported++;
      }
      // rename temporary collection to real collection
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });
      // set logs and progress to updated
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      // create indexes on the collection for faster search
      await connection.setProgress(progress);
      await collection.createIndex({ 'data.ocl.noStereoTautomerID': 1 });
      debug(`${imported} compounds processed`);
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: options.collectionName,
        connection,
        stack: e.stack,
      });
    }
  }
}
