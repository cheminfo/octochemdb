import debugLibrary from '../../../utils/Debug.js';
/**
 * Get DBRefs of mass spectra in the MassBank collection.
 * @param {OctoChemConnection} connection
 * @param {string} noStereoTautomerID
 * @returns {Promise<MassSpectraDbRef[] | undefined>}
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
  } catch (/** @type {any} */ e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'massBank',
        connection,
        stack: e.stack,
      });
    }
  }
}
