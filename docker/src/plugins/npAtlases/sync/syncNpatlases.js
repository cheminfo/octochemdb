import { readFileSync } from 'fs';

import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import { taxonomySynonyms } from '../../activesOrNaturals/utils/utilsTaxonomies/taxonomySynonyms.js';

import { getTaxonomiesForNpAtlases } from './utils/getTaxonomiesForNpAtlases.js';
import { parseNpatlases } from './utils/parseNpatlases.js';
/**
 * @description sync npatlases from NPATLAS database
 * @param {*} connection - mongo connection
 * @returns {Promise} returns npatlases collection
 */
export async function sync(connection) {
  const debug = debugLibrary('syncNpAtlases');
  try {
    let options = {
      collectionSource: process.env.NPATLAS_SOURCE,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/npAtlases/full`,
      collectionName: 'npAtlases',
      filenameNew: 'npAtlases',
      extensionNew: 'json',
    };
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `${process.env.NPATLAS_SOURCE_TEST}`;
      sources = [lastFile];
    } else {
      // get last files available in the NPATLAS database
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`${process.env.ORIGINAL_DATA_PATH}`, '')];
    }
    // get taxonomies old to new IDs mapping
    const oldToNewTaxIDs = await taxonomySynonyms();
    // get taxonomies collection
    const collectionTaxonomies = await connection.getCollection('taxonomies');
    // get npAtlases collection and progress
    const progress = await connection.getProgress(options.collectionName);
    let isTimeToUpdate = false;
    if (
      progress.dateEnd !== 0 &&
      Date.now() - progress.dateEnd >
        Number(process.env.NPATLAS_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
      md5(JSON.stringify(sources)) !== progress.sources
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
      isTimeToUpdate = true;
    }

    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );

    // read file synchronized from NPATLAS database
    const fileJson = readFileSync(lastFile, 'utf8');
    // define counters
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (
      lastDocumentImported === null ||
      ((md5(JSON.stringify(sources)) !== progress.sources ||
        progress.state !== 'updated') &&
        isTimeToUpdate)
    ) {
      const collection = await connection.getCollection(options.collectionName);
      // get logs and last document imported
      const logs = await connection.getImportationLog({
        collectionName: options.collectionName,
        sources,
        startSequenceID: progress.seq,
      });
      // create temporary collection
      const temporaryCollection =
        await connection.getCollection('npAtlases_tmp');
      debug.info(`Start importing npAtlases`);
      // set progress to updating
      progress.state = 'updating';
      await connection.setProgress(progress);
      // parse file
      for await (const entry of parseNpatlases(
        JSON.parse(fileJson),
        connection,
      )) {
       console.log(entry);
        if (process.env.NODE_ENV === 'test' && counter > 20) break;
        counter++;
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }
        /// Normalize Taxonomies
        if (entry.data.taxonomies) {
          // get normalized taxonomies
          let taxonomies = await getTaxonomiesForNpAtlases(
            entry,
            collectionTaxonomies,
            oldToNewTaxIDs,
          );
          entry.data.taxonomies = taxonomies;
        }
        // insert entry in temporary collection
        entry._seq = ++progress.seq;
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );
        imported++;
      }
      // rename temporary collection to npAtlases
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });
      // set progressand logs to updated
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // create indexes on npAtlases collection
      await collection.createIndex({ 'data.ocl.noStereoTautomerID': 1 });
      await collection.createIndex({ _seq: 1 });

      debug.info(`npAtlases collection imported`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'npAtlases',
        connection,
        stack: e.stack,
      });
    }
  }
}
