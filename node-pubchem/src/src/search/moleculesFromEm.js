'use strict';

// query for molecules from monoisotopic mass
const pubChemConnection = new (require('../util/PubChemConnection'))();

/**
 * Find molecules from a monoisotopic mass
 * @param {number} em
 * @param {object} [options={}]
 * @param {object} [options.limit=1000]
 * @param {object} [options.precision=0.1]
 * @return {Array}
 */
module.exports = async function moleculesFromEm(em, options = {}) {
  let { limit = 1e3, precision = 0.1 } = options;

  if (!em) {
    throw new Error('em parameter must be specified');
  }

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;
  let error = (em / 1e6) * precision;

  const mongoQuery = {
    em: { $lt: Number(em) + error, $gt: Number(em) - error }
  };

  const collection = await pubChemConnection.getMoleculesCollection();

  return collection
    .aggregate([
      { $match: mongoQuery },
      { $limit: limit },
      {
        $project: {
          id: '$_id',
          iupac: 1,
          ocl: 1,
          mf: 1,
          em: 1,
          nbFragments: 1,
          charge: 1
        }
      }
    ])
    .toArray();
};
