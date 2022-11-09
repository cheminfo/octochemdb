import { readFileSync } from 'fs';

import { fileListFromZip } from 'filelist-utils';
import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import Debug from '../../../utils/Debug.js';

import { getTaxonomiesNodes } from './utils/getTaxonomiesNodes.js';
import { parseTaxonomies } from './utils/parseTaxonomies.js';

const debug = Debug('syncTaxonomies');
/**
 * sync NCBI taxonomies
 * @param {*} connection connection to mongo
 */
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
    if (
      progress.dateEnd !== 0 &&
      progress.dateEnd - Date.now() > process.env.TAXONOMY_DATE_INTERVAL &&
      md5(JSON.stringify(sources)) !== progress.sources
    ) {
      progress.dateStart = Date.now();
      await connection.setProgress(progress);
    }
    const collection = await connection.getCollection(options.collectionName);

    const logs = await connection.getImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      progress,
      options.collectionName,
    );

    const fileList = (await fileListFromZip(readFileSync(lastFile))).filter(
      (file) => file.name === 'rankedlineage.dmp',
    );
    const arrayBuffer = await fileList[0].arrayBuffer();

    let counter = 0;
    let imported = 0;
    let start = Date.now();

    if (
      lastDocumentImported === null ||
      ((md5(JSON.stringify(sources)) !== progress.sources ||
        progress.state !== 'updated') &&
        Date.now() - progress.dateEnd >
          Number(process.env.TAXONOMY_DATE_INTERVAL))
    ) {
      progress.state = 'updating';
      await connection.setProgress(progress);
      const temporaryCollection = await connection.getCollection(
        'taxonomies_tmp',
      );
      const fileListNodes = (
        await fileListFromZip(readFileSync(lastFile))
      ).filter((file) => file.name === 'nodes.dmp');
      const arrayBufferNodes = await fileListNodes[0].arrayBuffer();
      debug('Get Nodes Taxonomies');
      let nodes = getTaxonomiesNodes(arrayBufferNodes);
      debug('start parsing taxonomies');
      for (const entry of parseTaxonomies(arrayBuffer, nodes, connection)) {
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
      await collection.createIndex({ 'data.phylum': 1 });
      await collection.createIndex({ 'data.class': 1 });
      await collection.createIndex({ 'data.order': 1 });
      await collection.createIndex({ 'data.family': 1 });
      await collection.createIndex({ 'data.genus': 1 });
      await collection.createIndex({ 'data.species': 1 });
      await collection.createIndex({ 'data.organism': 1 });
      await collection.createIndex({ _seq: 1 });

      debug(`${imported} taxonomies processed`);
    } else {
      debug(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'taxonomies',
        connection,
        stack: e.stack,
      });
    }
  }
}
