import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import debugLibrary from '../../../utils/Debug.js';
import getCollectionsLinks from '../utils/getCollectionsLinks.js';

import { main } from './main.js';

export async function aggregate(connection) {
  const debug = debugLibrary('inSilicoFragments');
  try {
    // Get collections from the database
    const options = { collection: 'inSilicoFragments', connection };
    const progress = await connection.getProgress(options.collection);
    const progressOfSourceCollection = await connection.getProgress(
      'activesOrNaturals',
    );

    const sources = md5(progressOfSourceCollection);
    // Add logs to the collection importLogs
    const logs = await connection.getImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
    // Get the last document imported
    const lastDocumentImported = await getLastDocumentImported(
      options.connection,
      progress,
      options.collection,
    );

    if (
      lastDocumentImported === null ||
      sources !== progress.sources ||
      progress.state !== 'updated'
    ) {
      const temporaryCollection = await connection.getCollection(
        `${options.collection}_tmp`,
      );
      debug.info('start fragmentation process');
      progress.state = 'aggregating';
      await connection.setProgress(progress);

      let links = await getCollectionsLinks(connection);

      await main(links);
      await temporaryCollection.createIndex({ 'data.masses.positive': 1 });
      await temporaryCollection.createIndex({ 'data.ocl.idCode': 1 });
      // rename temporary collection
      await temporaryCollection.rename(options.collection, {
        dropTarget: true,
      });
      // update logs
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'aggregated';
      await connection.updateImportationLog(logs);
      // update progress
      progress.sources = sources;
      progress.dateEnd = Date.now();
      progress.state = 'aggregated';
      await connection.setProgress(progress);
      await debug.info('Aggregation Done');
    } else {
      await debug.info(`Aggregation already up to date`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'inSilicoFragments',
        connection,
        stack: e.stack,
      });
    }
  }
}
