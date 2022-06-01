import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import Debug from '../../../utils/Debug.js';

export async function aggregate(connection) {
  const debug = Debug('naturalSubstances');
  const COLLECTION_NAME = 'naturalSubstances';
  try {
    const options = { collection: COLLECTION_NAME, connection: connection };
    const progress = await connection.getProgress(options.collection);
    const collectionSource = await connection.getProgress('substances');
    const collectionSubstances = await connection.getCollection('substances');
    const sources = md5(collectionSource);
    const logs = await connection.geImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
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
        `${COLLECTION_NAME}_tmp`,
      );
      debug('start Aggregation process');
      progress.state = 'aggregating';
      await connection.setProgress(progress);
      ////
      const result = await collectionSubstances
        .aggregate([
          {
            $match: {
              $and: [
                { naturalProduct: true },
                { 'data.ocl.noStereoID': { $ne: 'd@' } },
              ],
            },
          },
          {
            $project: {
              _id: 0,
              noStereoID: '$data.ocl.noStereoID',
            },
          },
        ])
        .toArray();

      await result.hasNext();

      await temporaryCollection.deleteOne({ _id: null });

      await temporaryCollection.rename(options.collection, {
        dropTarget: true,
      });

      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'aggregated';
      await connection.updateImportationLog(logs);
      progress.sources = sources;
      progress.dateEnd = Date.now();
      progress.state = 'aggregated';
      await connection.setProgress(progress);
      debug('Aggregation Done');
    } else {
      debug(`Aggregation already up to date`);
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'naturalSubstances', connection });
    }
  }
}
