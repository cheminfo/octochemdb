import debugLibrary from '../../../utils/Debug.js';
/**
 * Get DBRefs of mass spectra in the GNPS collection.
 * @param {OctoChemConnection} connection
 * @param {string} noStereoTautomerID
 * @returns {Promise<MassSpectraDbRef[] | undefined>}
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
  } catch (/** @type {any} */ e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'gnps',
        connection,
        stack: e.stack,
      });
    }
  }
}
