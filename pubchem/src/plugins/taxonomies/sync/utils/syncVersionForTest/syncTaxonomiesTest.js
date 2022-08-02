import { readFileSync } from 'fs';

import { fileListFromZip } from 'filelist-from';
import md5 from 'md5';

import getLastDocumentImported from '../../../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../../../sync/http/utils/getLastFileSync.js';
import { getTaxonomiesNodes } from '../getTaxonomiesNodes.js';
import { parseTaxonomies } from '../parseTaxonomies.js';
/**
 * sync NCBI taxonomies --- test version
 * @param {*} connection connection to mongo
 * @returns {Promise<*>} last document imported
 */
export async function sync(connection) {
  const originalDataPath = '../originalData/';
  const taxonomySource =
    'https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/new_taxdump/new_taxdump.zip';
  let options = {
    collectionSource: taxonomySource,
    destinationLocal: `${originalDataPath}/taxonomies/full`,
    collectionName: 'taxonomies_test',
    filenameNew: 'taxonomies',
    extensionNew: 'zip',
  };

  const lastFile = await getLastFileSync(options);
  const sources = [lastFile.replace(process.env.ORIGINAL_DATA_PATH, '')];
  const progress = await connection.getProgress(options.collectionName);
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

  if (
    lastDocumentImported === null ||
    md5(JSON.stringify(sources)) !== progress.sources ||
    progress.state !== 'updated'
  ) {
    progress.state = 'updating';
    await connection.setProgress(progress);
    const fileListNodes = (
      await fileListFromZip(readFileSync(lastFile))
    ).filter((file) => file.name === 'nodes.dmp');
    const arrayBufferNodes = await fileListNodes[0].arrayBuffer();
    let nodes = getTaxonomiesNodes(arrayBufferNodes);
    for (const entry of parseTaxonomies(arrayBuffer, nodes, connection)) {
      if (counter > 20) break;
      counter++;
      entry._seq = ++progress.seq;
      await collection.updateOne(
        { _id: entry._id },
        { $set: entry },
        { upsert: true },
      );
    }
  }
  logs.dateEnd = Date.now();
  logs.endSequenceID = progress.seq;
  logs.status = 'updated';
  await connection.updateImportationLog(logs);
  progress.sources = md5(JSON.stringify(sources));
  progress.dateEnd = Date.now();
  progress.state = 'updated';
  await connection.setProgress(progress);
  const lastDocumentImportedForTest = getLastDocumentImported(
    connection,
    progress,
    options.collectionName,
  );
  await connection.setProgress(progress);
  await collection.createIndexes(
    { _id: 1 },
    { 'data.phylum': 1 },
    { 'data.class': 1 },
    { 'data.order': 1 },
    { 'data.family': 1 },
    { 'data.genus': 1 },
    { 'data.species': 1 },
    { 'data.organism': 1 },
  );
  // remove data from admin and logs collections
  const adminCollection = await connection.getCollection('admin');
  await adminCollection.deleteOne({ _id: 'taxonomies_test_progress' });
  const logsCollection = await connection.getCollection('importationLogs');
  await logsCollection.deleteOne({ collectionName: 'taxonomies_test' });
  await collection.drop();
  await connection.close();
  return lastDocumentImportedForTest;
}
