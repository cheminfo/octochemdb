import { readFileSync } from 'fs';

import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';
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
      collectionSource:
        'https://www.npatlas.org/static/downloads/NPAtlas_download.json',
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/npAtlases/full`,
      collectionName: 'npAtlases',
      filenameNew: 'npAtlases',
      extensionNew: 'json',
    };
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `../docker/src/plugins/npAtlases/sync/utils/__tests__/data/npAtlasTest.json`;
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

    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    let isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.NPATLAS_UPDATE_INTERVAL,
      connection,
    );

    // read file synchronized from NPATLAS database
    const fileJson = readFileSync(lastFile, 'utf8');

    // define counters
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (isTimeToUpdate) {
      const collection = await connection.getCollection(options.collectionName);

      // create temporary collection
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      debug.info(`Start importing npAtlases`);
      // set progress to updating
      progress.state = 'updating';
      await connection.setProgress(progress);
      // parse file
      for await (const entry of parseNpatlases(
        JSON.parse(fileJson),
        connection,
      )) {
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

      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // create indexes on npAtlases collection
      await createIndexes(collection, [
        { 'data.ocl.noStereoTautomerID': 1 },
        { _seq: 1 },
      ]);

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
