import Debug from '../../../utils/Debug.js';

const debug = Debug('aggregateCHNOSClF');

export async function aggregate(connection) {
  const collection = await connection.getCollection('compounds');

  const progressCompounds = await connection.getProgress('compounds');
  const progress = await connection.getProgress('mfsCHNOSClF');
  progress.state = 'aggregating';
  await connection.setProgress(progress);
  try {
    if (progressCompounds.seq === progress.seq) {
      debug('Aggregation up-to-date');
      return;
    }

    debug('Need to aggregate', await collection.countDocuments());
    let result = collection.aggregate(
      [
        {
          $match: {
            'data.nbFragments': 1,
            'data.mf': {
              $regex:
                /^C[0-9]*H[0-9]*Cl?[0-9]*F?[0-9]*N?[0-9]*O?[0-9]*S?[0-9]*$/,
            },
            'data.charge': { $lte: 1, $gte: -1 },
          },
        },
        {
          $project: {
            _id: 0,
            mf: '$data.mf',
            em: '$data.em',
            unsaturation: '$data.unsaturation',
          },
        },
        {
          $group: {
            _id: '$mf',
            count: { $sum: 1 },
            em: { $first: '$em' },
            unsaturation: { $first: '$unsaturation' },
          },
        },

        { $out: 'mfsCHNOSClF' },
      ],
      {
        allowDiskUse: true,
        maxTimeMS: 60 * 60 * 1000, // 1h
      },
    );
    await result.hasNext(); // trigger the creation of the output collection

    progress.seq = progressCompounds.seq;
    progress.state = 'aggregate';
    await connection.setProgress(progress);

    return result;
  } catch (e) {
    progress.state = 'error';
    await connection.setProgress(progress);
    const optionsDebug = { collection: 'mfsCHNOSClF', connection };
    debug(e, optionsDebug);
  }
}
