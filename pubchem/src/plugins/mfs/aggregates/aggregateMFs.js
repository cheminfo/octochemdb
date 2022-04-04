import Debug from '../../../utils/Debug.js';

const debug = Debug('aggregateMFs');

export async function aggregate(connection) {
  const collection = await connection.getCollection('compounds');

  const progressCompounds = await connection.getProgress('compounds');
  const progress = await connection.getProgress('mfs');
  if (progressCompounds.seq === progress.seq) {
    debug('Aggregation up-to-date');
    return;
  }

  debug(`'Need to aggregate' ${await collection.countDocuments()} 'entries'`);
  let result = await collection.aggregate(
    [
      {
        $match: {
          'data.nbFragments': 1,
          'data.charge': 0,
          'data.mf': /^[^\]]+$/,
        },
      }, // one fragment, no charge and no isotopes
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
      { $out: 'mfs' },
    ],
    {
      allowDiskUse: true,
      maxTimeMS: 60 * 60 * 1000, // 1h
    },
  );
  await result.hasNext();

  let mfsCollection = await connection.getCollection('mfs');
  await mfsCollection.createIndex({ em: 1 });
  await mfsCollection.createIndex({ total: 1 });

  progress.seq = progressCompounds.seq;
  await connection.setProgress(progress);

  return result;
}
