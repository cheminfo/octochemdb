import Debug from '../../../utils/Debug.js';
/**
 * Get DbRefs of mass spectra in gnps collection
 * @param {*} connection - mongo connection
 * @param {*} noStereoID - noStereoID
 * @returns {Promise<Array>} - DbRefs of mass spectra in gnps collection
 */
export async function getMassSpectraRef(connection, noStereoID) {
  const debug = Debug('getMassSpectra');
  try {
    const gnpsCollection = await connection.getCollection('gnps');
    const massSpectra = await gnpsCollection
      .aggregate([
        {
          $match: {
            'data.ocl.noStereoID': noStereoID,
          },
        },
        {
          $project: {
            _id: 0,
            dbRef: { $id: '$_id', $ref: 'gnps' },
          },
        },
      ])
      .toArray();
    return massSpectra;
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'gnps',
        connection,
        stack: e.stack,
      });
    }
  }
}
