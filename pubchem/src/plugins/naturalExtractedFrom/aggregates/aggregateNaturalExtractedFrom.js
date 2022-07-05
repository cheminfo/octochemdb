import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import Debug from '../../../utils/Debug.js';
/**
 * @description Aggregate molecules in function of the organism taxonomy from which they are extracted
 * @param {*} connection mongo connection
 * @returns {Promise} returns naturalExtractedFrom collection
 */
export async function aggregate(connection) {
  const debug = Debug('aggregateNaturalExtractedFrom');
  const COLLECTION_NAME = 'naturalExtractedFrom';
  try {
    // get activesOrNaturals collection and progress
    const options = { collection: COLLECTION_NAME, connection: connection };
    const progress = await connection.getProgress(options.collection);
    const collectionSource = await connection.getProgress('activesOrNaturals');
    const collectionActivesOrNaturals = await connection.getCollection(
      'activesOrNaturals',
    );
    // get logs, last document imported and sources
    const sources = md5(collectionSource);
    const logs = await connection.getImportationLog({
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
      debug('start Aggregation process');
      // set progress to aggregating
      progress.state = 'aggregating';
      await connection.setProgress(progress);
      // aggregate based on superkingdom, kingdom, phylum and class
      const result = collectionActivesOrNaturals.aggregate([
        { $project: { taxonomies: '$data.taxonomies' } },
        { $unwind: '$taxonomies' },
        {
          $project: {
            superkingdom: '$taxonomies.superkingdom',
            kingdom: '$taxonomies.kingdom',
            phylum: '$taxonomies.phylum',
            class: '$taxonomies.class',
          },
        },
        {
          $group: {
            _id: {
              $concat: [
                '$_id',
                '$superkingdom',
                'kingdom',
                '$phylum',
                '$class',
              ],
            },
            superkingdom: { $first: '$superkingdom' },
            kingdom: { $first: '$kingdom' },
            phylum: { $first: '$phylum' },
            class: { $first: '$class' },
          },
        },
        {
          $group: {
            _id: { $concat: ['$superkingdom', 'kingdom', '$phylum', '$class'] },
            count: { $sum: 1 },
            superkingdom: { $first: '$superkingdom' },
            kingdom: { $first: '$kingdom' },
            phylum: { $first: '$phylum' },
            class: { $first: '$class' },
          },
        },
        { $out: 'naturalExtractedFrom' }, // output temporary collection
      ]);
      await result.hasNext();
      // delete null case from temporary collection
      const temporaryCollection = await connection.getCollection(
        `${COLLECTION_NAME}`,
      );
      await temporaryCollection.deleteOne({ _id: null });
      // rename temporary collection to naturalExtractedFrom
      await temporaryCollection.rename(options.collection, {
        dropTarget: true,
      });
      // set logs
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'aggregated';
      await connection.updateImportationLog(logs);
      // set progress to aggregated
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
      debug(e.message, {
        collection: 'naturalExtractedFrom',
        connection,
        stack: e.stack,
      });
    }
  }
}
