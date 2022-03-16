import Debug from 'debug';

const debug = Debug('aggregateCommonMFs');

export async function aggregate(connection) {
  const collection = await connection.getCollection('compounds');

  const progressCompounds = await connection.getProgress('compounds');
  const progress = await connection.getProgress('commonMFs');
  if (progressCompounds.seq === progress.seq) {
    debug('Aggregation up-to-date');
    return;
  }

  debug(
    'commonMFs: Need to aggregate',
    await collection.countDocuments(),
    'entries',
  );
  let result = await collection.aggregate(
    [
      //    { $limit: 1e4 },
      { $match: { 'data.nbFragments': 1, 'data.charge': 0 } }, // we don't want charges in MF
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
      { $out: 'commonMFs' },
    ],
    {
      allowDiskUse: true,
      maxTimeMS: 60 * 60 * 1000, // 1h
    },
  );
  await result.hasNext();

  const collectionCommonMFs = await connection.getCollection('mfsCommon');

  await collectionCommonMFs.createIndex({ em: 1 });

  progress.seq = progressCompounds.seq;
  await connection.setProgress(progress);

  return result;
}