import debugLibrary from '../../../utils/Debug.js';
/**
 * @description Aggregate in function of unique mfs in compounds collection
 * @param {*} connection mongo connection
 * @returns {Promise} returns mfs collection
 */
export async function aggregate(connection) {
  const debug = debugLibrary('aggregateMFs');
  // get compounds collection and progress
  const collection = await connection.getCollection('compounds');
  const progressCompounds = await connection.getProgress('compounds');
  // set progress to aggregating
  const progress = await connection.getProgress('mfs');
  await connection.setProgress(progress);
  try {
    if (progressCompounds.seq === progress.seq) {
      debug('Aggregation up-to-date');
      return;
    }
    progress.state = 'aggregating';
    await connection.setProgress(progress);
    debug(`Need to aggregate ${await collection.count()} entries`);
    let result = await collection.aggregate(
      [
        {
          $match: {
            'data.nbFragments': 1,
            'data.charge': 0,
            'data.mf': {
              $regex: '^[^]]+$',
            },
          },
        }, // one fragment, no charge and no isotopes
        {
          $project: {
            _id: 0,
            mf: '$data.mf',
            em: '$data.em',
            unsaturation: '$data.unsaturation',
            atoms: '$data.atoms',
          },
        },
        {
          $group: {
            _id: '$mf',
            em: { $first: '$em' },
            unsaturation: { $first: '$unsaturation' },
            atoms: { $first: '$atoms' },
            count: { $sum: 1 },
          },
        },
        { $out: 'mfs_tmp' },
      ],
      {
        allowDiskUse: true,
        maxTimeMS: 60 * 60 * 1000 * 12, // 6h
      },
    );
    await result.hasNext();
    const temporaryCollection = await connection.getCollection('mfs_tmp');
    // rename temporary collection to mfs
    await temporaryCollection.rename('mfs', { dropTarget: true });
    // set progress to aggregated
    progress.dateEnd = new Date();
    progress.seq = progressCompounds.seq;
    progress.state = 'aggregated';
    await connection.setProgress(progress);

    return result;
  } catch (e) {
    progress.state = 'error';
    await connection.setProgress(progress);
    if (connection) {
      debug(e.message, { collection: 'mfs', connection, stack: e.stack });
    }
  }
}
