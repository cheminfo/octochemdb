import debugLibrary from '../../../utils/Debug.js';
/**
 * Get DbRefs of mass spectra in gnps collection
 * @param {*} connection - mongo connection
 * @param {*} noStereoTautomerID - noStereoTautomerID
 * @returns {Promise<Array>} - DbRefs of mass spectra in gnps collection
 */
export async function getMassSpectraRef(connection, noStereoTautomerID) {
  const debug = debugLibrary('getMassSpectra');
  try {
    const gnpsCollection = await connection.getCollection('gnps');
    const massSpectra = await gnpsCollection
      .aggregate([
        {
          $match: {
            'data.ocl.noStereoTautomerID': noStereoTautomerID,
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
