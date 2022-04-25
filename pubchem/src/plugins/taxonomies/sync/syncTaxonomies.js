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

    // we reparse all the file and skip if required
    let skipping = firstID !== undefined;
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (
      lastDocumentImported === null ||
      md5(JSON.stringify(sources)) !== progress.sources ||
      progress.state !== 'updated'
    ) {
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
        if (skipping) {
          if (firstID === entry._id) {
            skipping = false;
            debug(`Skipping taxonomies till:${firstID}`);
          }
          continue;
        }
        progress.state = 'updating';
        entry._seq = ++progress.seq;
        await collection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );

        await connection.setProgress(progress);
        imported++;
      }
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

    // we remove all the entries that are not imported by the last file
    const result = await collection.deleteMany({
      _seq: { $lte: logs.startSequenceID },
    });
    debug(`Deleting entries with wrong source: ${result.deletedCount}`);
  } catch (e) {
    const optionsDebug = { collection: 'taxonomies', connection };
    debug(e, optionsDebug);
  }
}
