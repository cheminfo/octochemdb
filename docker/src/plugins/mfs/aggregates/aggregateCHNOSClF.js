import debugLibrary from '../../../utils/Debug.js';

/**
 * @description Aggregate function for molecules with mf containing CHNOSClF elements (most common element in organic compounds)
 * @param {*} connection mongo connection
 * @returns {Promise} returns mfsCHNOSClF collection
 */
export async function aggregate(connection) {
  const debug = debugLibrary('aggregateCHNOSClF');
  // get compounds collection and progress
  const collection = await connection.getCollection('compounds');
  const progressCompounds = await connection.getProgress('compounds');
  // get progress collection mfsCHNOSClF
  const progress = await connection.getProgress('mfsCHNOSClF');
  // set progress to aggregating
  await connection.setProgress(progress);
  try {
    if (progressCompounds.seq === progress.seq) {
      debug('Aggregation up-to-date');
      return;
    }
    // set progress to aggregating
    progress.state = 'aggregating';
    await connection.setProgress(progress);
    debug('Need to aggregate', await collection.countDocuments());
    // aggregate compounds with mf containing CHNOSClF
    let result = collection.aggregate(
      [
        {
          $match: {
            'data.nbFragments': 1,
            'data.mf': {
              $regex:
                /^C[0-9]*H[0-9]*Cl?[0-9]*F?[0-9]*N?[0-9]*O?[0-9]*S?[0-9]*$/,
            },
            'data.charge': 0,
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

        { $out: 'mfsCHNOSClF_tmp' },
      ],
      {
        allowDiskUse: true, // allow aggregation to use disk if necessary
        maxTimeMS: 60 * 60 * 1000, // 1h
      },
    );
    await result.hasNext(); // trigger the creation of the output collection
    const temporaryCollection = await connection.getCollection(
      'mfsCHNOSClF_tmp',
    );
    // rename temporary collection to mfsCHNOSClF
    await temporaryCollection.rename('mfsCHNOSClF', { dropTarget: true });
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
      debug(e.message, {
        collection: 'mfsCHNOSClF',
        connection,
        stack: e.stack,
      });
    }
  }
}
