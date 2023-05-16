import debugLibrary from '../../../utils/Debug.js';
/**
 * Get DbRefs of mass spectra in massBank collection
 * @param {*} connection - mongo connection
 * @param {*} noStereoTautomerID - noStereoTautomerID
 * @returns {Promise} - DbRefs of mass spectra in massBank collection
 */
export async function getMassSpectraRefForMassBank(
  connection,
  noStereoTautomerID,
) {
  const debug = debugLibrary('getMassSpectra');
  try {
    const massBankCollection = await connection.getCollection('massBank');
    const massSpectra = await massBankCollection
      .aggregate([
        {
          $match: {
            'data.ocl.noStereoTautomerID': noStereoTautomerID,
          },
        },
        {
          $project: {
            _id: 0,
            dbRef: { $id: '$_id', $ref: 'massBank' },
          },
        },
      ])
      .toArray();
    return massSpectra;
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'massBank',
        connection,
        stack: e.stack,
      });
    }
  }
}
