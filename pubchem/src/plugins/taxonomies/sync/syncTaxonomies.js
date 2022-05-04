import { readFileSync } from 'fs';
import md5 from 'md5';
import { fileListFromZip } from 'filelist-from';
import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import Debug from '../../../utils/Debug.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import { parseTaxonomies } from './utils/parseTaxonomies.js';

const debug = Debug('syncTaxonomies');

export async function sync(connection) {
  let options = {
    collectionSource: process.env.TAXONOMY_SOURCE,
    destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/taxonomies/full`,
    collectionName: 'taxonomies',
    filenameNew: 'taxonomies',
    extensionNew: 'zip',
  };
  try {
    const lastFile = await getLastFileSync(options);
    const sources = [lastFile.replace(process.env.ORIGINAL_DATA_PATH, '')];
    const progress = await connection.getProgress(options.collectionName);
    const collection = await connection.getCollection(options.collectionName);
    await collection.createIndex({ _id: 1 });
    await collection.createIndex({ 'data.class': 1 });
    await collection.createIndex({ 'data.phylum': 1 });
    await collection.createIndex({ 'data.species': 1 });
    await collection.createIndex({ 'data.organism': 1 });
    await collection.createIndex({ 'data.family': 1 });
    await collection.createIndex({ 'data.genus': 1 });
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

    const fileList = (await fileListFromZip(readFileSync(lastFile))).filter(
      (file) => file.name === 'rankedlineage.dmp',
    );
    const arrayBuffer = await fileList[0].arrayBuffer();

    let counter = 0;
    let imported = 0;
    let start = Date.now();

    if (
      lastDocumentImported === null ||
      md5(JSON.stringify(sources)) !== progress.sources ||
      progress.state !== 'updated'
    ) {
      progress.state = 'updating';
      await connection.setProgress(progress);
      const temporaryCollection = await connection.getCollection(
        'temporaryTaxonomies',
      );
      for (const entry of parseTaxonomies(arrayBuffer, connection)) {
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
      temporaryCollection.renameCollection(collection, true);

      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      progress.sources = md5(JSON.stringify(sources));
      progress.date = new Date();
      progress.state = 'updated';
      await connection.setProgress(progress);
      debug(`${imported} taxonomies processed`);
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    const optionsDebug = { collection: 'taxonomies', connection };
    debug(e, optionsDebug);
  }
}
