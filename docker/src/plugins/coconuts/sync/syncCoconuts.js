import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import { getTaxonomiesForCoconuts } from './utils/getTaxonomiesForCoconuts.js';
import { parseCoconuts } from './utils/parseCoconuts.js';
import { checkCoconutLink } from './utils/checkCoconutLink.js';

const coconutsTestSource =
  '../docker/src/plugins/coconuts/sync/utils/__tests__/data/coconuts_test.zip';
const coconutsSource =
  'https://coconut.s3.uni-jena.de/prod/downloads/2025-05/coconut_csv-05-2025.zip';

/**
 * @description Synchronize the coconuts collection from the coconut CSV ZIP
 * @param {*} connection MongoDB connection
 * @returns {Promise} returns coconuts collections
 */
export async function sync(connection) {
  const debug = debugLibrary('syncCoconuts');

  const options = {
    collectionSource: coconutsSource,
    destinationLocal: `../originalData/coconuts/full`,
    collectionName: 'coconuts',
    filenameNew: 'coconuts',
    extensionNew: 'zip',
  };

  try {
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = coconutsTestSource;
      sources = [lastFile];
    } else {
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`../originalData/`, '')];
    }

    const progress = await connection.getProgress(options.collectionName);
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    // This will check at each sync if the source link has changed and will log a fatal error if so
    await checkCoconutLink(process.env.COCONUT_SOURCE, connection);

    const isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.COCONUT_UPDATE_INTERVAL,
      connection,
    );

    let counter = 0;
    let imported = 0;
    let start = Date.now();

    if (isTimeToUpdate) {
      debug.info(`Start parsing coconuts (CSV in zip)`);

      const collection = await connection.getCollection(options.collectionName);
      const collectionTaxonomies = await connection.getCollection('taxonomies');
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );

      progress.state = 'updating';
      await connection.setProgress(progress);

      for await (const entry of parseCoconuts(lastFile, connection)) {
        counter++;
        if (process.env.NODE_ENV === 'test' && counter > 20) break;

        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }

        if (entry.data.taxonomies) {
          const taxonomies = await getTaxonomiesForCoconuts(
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

      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });

      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';

      await connection.setProgress(progress);
      await createIndexes(collection, [{ 'data.ocl.noStereoTautomerID': 1 }]);
      debug.info(`${imported} compounds processed`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: options.collectionName,
        connection,
        stack: e.stack,
      });
    }
  }
}
