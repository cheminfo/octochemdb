import md5 from 'md5';
import { getTaxonomiesForCoconuts } from '../../activesOrNaturals/utils/utilsTaxonomies/getTaxonomiesForCoconuts.js';
import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';

import { parseCoconuts } from './utils/parseCoconuts.js';

const debug = Debug('syncCoconuts');

export async function sync(connection) {
  let options = {
    collectionSource: process.env.COCONUT_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/coconuts/full`,
    collectionName: 'coconuts',
    filenameNew: 'coconuts',
    extensionNew: 'zip',
  };
  try {
    const lastFile = await getLastFileSync(options);
    const sources = [lastFile.replace(process.env.ORIGINAL_DATA_PATH, '')];
    const progress = await connection.getProgress(options.collectionName);
    const collection = await connection.getCollection(options.collectionName);
    const logs = await connection.geImportationtLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
    const collectionTaxonomies = await connection.getCollection('taxonomies');

    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );

    let counter = 0;
    let imported = 0;
    let start = Date.now();
    let fileName = 'uniqueNaturalProduct.bson';
    if (
      lastDocumentImported === null ||
      md5(JSON.stringify(sources)) !== progress.sources ||
      progress.state !== 'updated'
    ) {
      debug(`Start parsing: ${fileName}`);
      const temporaryCollection = await connection.getCollection(
        'temporaryCoconuts',
      );
      progress.state = 'updating';
      await connection.setProgress(progress);
      for await (const entry of parseCoconuts(lastFile, fileName)) {
        counter++;
        if (process.env.TEST === 'true' && counter > 20) break;

        if (
          Date.now() - start >
          Number(process.env.DEBUG_THROTTLING || 10000)
        ) {
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
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      await collection.createIndex({ _id: 1 });
      await collection.createIndex({ _seq: 1 });
      await collection.createIndex({ 'data.ocl.noStereoID': 1 });

      debug(`${imported} compounds processed`);
    } else {
      debug(`file already processed`);
    }
    // we remove all the entries that are not imported by the last file
  } catch (e) {
    const optionsDebug = { collection: options.collectionName, connection };
    debug(e, optionsDebug);
  }
}
