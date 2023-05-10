import debugLibrary from '../../../utils/Debug.js';
/**
 * @description Aggregate function for most common mfs in compounds collection
 * @param {*} connection mongo connection
 * @returns {Promise} returns mfsCommon collection
 */
export async function aggregate(connection) {
  const debug = debugLibrary('aggregatemfsCommon');
  // get compounds collection and progress
  const collection = await connection.getCollection('compounds');
  // get progress collection mfsCommon
  const progressCompounds = await connection.getProgress('compounds');
  const progress = await connection.getProgress('mfsCommon');
  await connection.setProgress(progress);
  try {
    if (progressCompounds.seq === progress.seq) {
      debug('Aggregation up-to-date');
      return;
    }
    // set progress to aggregating
    progress.state = 'aggregating';
    await connection.setProgress(progress);
    debug(`mfsCommon: Need to aggregate: ${await collection.count()}`);
    // aggregate compounds with with mfs who have at least 5 entries

    let result = await collection.aggregate(
      [
        { $match: { 'data.nbFragments': 1, 'data.charge': 0 } }, // we don't want charges in MF
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

        { $match: { count: { $gte: 5 } } }, // only MFs with at least 5 products in pubchem
        {
          $project: {
            _id: '$_id',
            data: {
              em: '$em',
              atoms: '$atoms',
              unsaturation: '$unsaturation',
              count: '$count',
            },
          },
        },
        { $out: 'mfsCommon_tmp' },
      ],
      {
        allowDiskUse: true, // allow aggregation to use disk if necessary
        maxTimeMS: 60 * 60 * 3000, // 3h
      },
    );
    await result.hasNext();
    const temporaryCollection = await connection.getCollection('mfsCommon_tmp');
    //rename temporary collection to mfsCommon
    await temporaryCollection.rename('mfsCommon', { dropTarget: true });

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
