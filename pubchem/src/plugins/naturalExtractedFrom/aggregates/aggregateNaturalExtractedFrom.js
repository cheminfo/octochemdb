/*
db.activesOrNaturals_tmp.aggregate([
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
          $concat: ['$_id', '$superkingdom', 'kingdom', '$phylum', '$class'],
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
    { $out: { db: 'pubchem', coll: 'naturalExtractedFrom' } },
  ])
db.naturalExtractedFrom.deleteOne({_id:null})
  */
import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import Debug from '../../../utils/Debug.js';

export async function aggregate(connection) {
  const debug = Debug('aggregateNaturalExtractedFrom');
  const COLLECTION_NAME = 'naturalExtractedFrom';
  try {
    const options = { collection: COLLECTION_NAME, connection: connection };
    const progress = await connection.getProgress(options.collection);
    const collectionSource = await connection.getProgress('activesOrNaturals');
    const collectionActivesOrNaturals = await connection.getCollection(
      'activesOrNaturals',
    );
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
      debug('start Aggregation process');
      progress.state = 'aggregating';
      await connection.setProgress(progress);
      ////
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
        { $out: 'naturalExtractedFrom_tmp' },
      ]);
      await result.hasNext();
      const temporaryCollection = await connection.getCollection(
        `${COLLECTION_NAME}_tmp`,
      );
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
      debug(e, { collection: 'naturalExtractedFrom', connection });
    }
  }
}
