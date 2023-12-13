import { readFileSync } from 'fs';

import { fileCollectionFromZip } from 'filelist-utils';
import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import { getTaxonomiesNodes } from './utils/getTaxonomiesNodes.js';
import { parseTaxonomies } from './utils/parseTaxonomies.js';

const debug = debugLibrary('syncTaxonomies');
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
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `${process.env.TAXONOMY_SOURCE_TEST}`;
      sources = [process.env.TAXONOMY_SOURCE_TEST];
    } else {
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`${process.env.ORIGINAL_DATA_PATH}`, '')];
    }
    const progress = await connection.getProgress(options.collectionName);
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    let isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.TAXONOMY_UPDATE_INTERVAL,
      connection,
    );

    let counter = 0;
    let imported = 0;
    let start = Date.now();

    if (isTimeToUpdate) {
      const collection = await connection.getCollection(options.collectionName);

      const fileList = (
        await fileCollectionFromZip(readFileSync(lastFile))
      ).filter((file) => file.name === 'rankedlineage.dmp');
      const arrayBuffer = await fileList.files[0].arrayBuffer();
      progress.state = 'updating';
      await connection.setProgress(progress);
      const temporaryCollection =
        await connection.getCollection('taxonomies_tmp');
      const fileListNodes = (
        await fileCollectionFromZip(readFileSync(lastFile))
      ).filter((file) => file.name === 'nodes.dmp');

      const arrayBufferNodes = await fileListNodes.files[0].arrayBuffer();
      debug.trace('Get Nodes Taxonomies');
      let nodes = getTaxonomiesNodes(arrayBufferNodes);
      debug.info('start parsing taxonomies');
      for (const entry of parseTaxonomies(arrayBuffer, nodes, connection)) {
        counter++;
        if (process.env.NODE_ENV === 'test' && counter > 20) break;
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
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
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      await createIndexes(collection, [
        { 'data.phylum': 1 },
        { 'data.class': 1 },
        { 'data.order': 1 },
        { 'data.family': 1 },
        { 'data.genus': 1 },
        { 'data.species': 1 },
        { 'data.organism': 1 },
        { _seq: 1 },
      ]);
      debug.info(`Taxonomies collection updated`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'taxonomies',
        connection,
        stack: e.stack,
      });
    }
  }
}
