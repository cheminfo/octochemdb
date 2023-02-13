import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import { getTaxonomiesForLotuses } from '../../activesOrNaturals/utils/utilsTaxonomies/getTaxonomiesForLotuses.js';
import { taxonomySynonyms } from '../../activesOrNaturals/utils/utilsTaxonomies/taxonomySynonyms.js';

import { parseLotuses } from './utils/parseLotuses.js';
/**
 * @description syncLotuses - synchronize lotuses collection from lotus database
 * @param {*} connection - mongo connection
 * @returns {Promise} returns collection lotuses
 */
export async function sync(connection) {
  const debug = debugLibrary('syncLotuses');
  let options = {
    collectionSource: process.env.LOTUS_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/lotuses/full`,
    collectionName: 'lotuses',
    filenameNew: 'lotuses',
    extensionNew: 'zip',
  };
  try {
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `${process.env.LOTUS_SOURCE_TEST}`;
      sources = [lastFile];
    } else {
      // get last file from lotus database
      lastFile = await getLastFileSync(options);
      // get sources, progress and lotuses collection
      sources = [lastFile.replace(`${process.env.ORIGINAL_DATA_PATH}`, '')];
    }
    debug(lastFile);
    // get sources, progress and lotuses collection
    const progress = await connection.getProgress('lotuses');
    let isTimeToUpdate = false;
    if (
      progress.dateEnd !== 0 &&
      Date.now() - progress.dateEnd >
        Number(process.env.LOTUS_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
      md5(JSON.stringify(sources)) !== progress.sources
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
      isTimeToUpdate = true;
    }
    // get last document imported
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );

    // define counter
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (
      lastDocumentImported === null ||
      ((md5(JSON.stringify(sources)) !== progress.sources ||
        progress.state !== 'updated') &&
        isTimeToUpdate)
    ) {
      const collection = await connection.getCollection('lotuses');
      // get old to new taxonomies ids mapping
      const oldToNewTaxIDs = await taxonomySynonyms();
      // get taxonomies collection
      const collectionTaxonomies = await connection.getCollection('taxonomies');
      // get logs
      const logs = await connection.getImportationLog({
        collectionName: options.collectionName,
        sources,
        startSequenceID: progress.seq,
      });
      // define file inside zip folder to use for importation
      let fileName = 'lotusUniqueNaturalProduct.bson';
      // create temporary collection
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      debug(`Start parsing: ${fileName}`);
      // set progress state to updating
      progress.state = 'updating';
      await connection.setProgress(progress);
      // parse lotuses
      for await (const entry of parseLotuses(lastFile, fileName, connection)) {
        counter++;
        if (process.env.TEST === 'true' && counter > 20) break;

        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug(`Processing: counter: ${counter} - imported: ${imported}`);
          start = Date.now();
        }
        /// Normalize Taxonomies
        if (entry.data.taxonomies) {
          let taxonomies = await getTaxonomiesForLotuses(
            entry,
            collectionTaxonomies,
            oldToNewTaxIDs,
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
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // Indexing of collection properties
      await collection.createIndex({ 'data.ocl.noStereoTautomerID': 1 });
      await collection.createIndex({ _seq: 1 });

      debug(`${imported} compounds processed`);
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'lotuses', connection, stack: e.stack });
    }
  }
}
