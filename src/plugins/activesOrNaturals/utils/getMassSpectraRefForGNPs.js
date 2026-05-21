import debugLibrary from '../../../utils/Debug.js';
/**
 * Get DBRefs of mass spectra in the GNPS collection.
 * @param connection
 * @param noStereoTautomerID
 * @returns
 */
export async function getMassSpectraRefForGNPs(connection, noStereoTautomerID) {
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
  } catch (/** @type {any} */ error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'gnps',
        connection,
        stack: error.stack,
      });
    }
  }
}
