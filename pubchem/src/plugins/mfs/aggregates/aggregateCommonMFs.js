import Debug from '../../../utils/Debug.js';

const debug = Debug('aggregatemfsCommon');

export async function aggregate(connection) {
  const collection = await connection.getCollection('compounds');

  const progressCompounds = await connection.getProgress('compounds');
  const progress = await connection.getProgress('mfsCommon');
  if (progressCompounds.seq === progress.seq) {
    debug('Aggregation up-to-date');
    return;
  }

  debug(`'mfsCommon: Need to aggregate: ${await collection.count()}`);
  let result = await collection.aggregate(
    [
      //
      { $match: { 'data.nbFragments': 1, 'data.charge': 0 } }, // we don't want charges in MF
      { $limit: 1e6 },
      {
        $project: {
          _id: 0,
          mf: '$data.mf',
          em: '$data.em',
          unsaturation: '$data.unsaturation',
          atom: '$data.atom',
        },
      },
      {
        $group: {
          _id: '$mf',
          em: { $first: '$em' },
          unsaturation: { $first: '$unsaturation' },
          atom: { $first: '$atom' },
          total: { $sum: 1 },
        },
      },
      { $match: { total: { $gte: 5 } } }, // only MFs with at least 5 products in pubchem
      { $out: 'mfsCommon' },
    ],
    {
      allowDiskUse: true,
      maxTimeMS: 60 * 60 * 1000, // 1h
    },
  );
  await result.hasNext();

  const collectionmfsCommon = await connection.getCollection('mfsCommon');

  await collectionmfsCommon.createIndex({ em: 1 });

  progress.seq = progressCompounds.seq;
  await connection.setProgress(progress);

  return result;
}
