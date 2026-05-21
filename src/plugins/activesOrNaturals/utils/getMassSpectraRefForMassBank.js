import debugLibrary from '../../../utils/Debug.js';
/**
 * Get DBRefs of mass spectra in the MassBank collection.
 * @param connection
 * @param noStereoTautomerID
 * @returns
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
  } catch (/** @type {any} */ error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'massBank',
        connection,
        stack: error.stack,
      });
    }
  }
}
