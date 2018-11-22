"use strict";

// query for molecules from monoisotopic mass
const pubChemConnection = new (require("../util/PubChemConnection"))();

/**
 * Find molecular formula from a monoisotopic mass
 * @param {number} em
 * @param {object} [options={}]
 * @param {object} [options.limit=1000]
 * @param {object} [options.precision=100]
 * @return {Array}
 */
module.exports = async function mfsFromEm(em, options = {}) {
  let { limit = 1e3, precision = 100 } = options;

  if (!em) {
    throw new Error("em parameter must be specified");
  }
  em = Number(em);

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;
  let error = (em / 1e6) * precision;

  const collection = await pubChemConnection.getMoleculesCollection();

  return collection
    .aggregate([
      {
        $match: {
          em: { $lt: em + error, $gt: em - error },
          nbFragments: 1,
          charge: 0
        }
      },
      { $limit: Number(limit) },
      { $project: { _id: 0, em: 1, mf: 1 } },
      {
        $group: {
          _id: "$mf",
          em: { $first: "$em" },
          ppm: { $first: { $abs: { $subtract: ["$em", em] } } },
          total: { $sum: 1 }
        }
      },
      { $project: { mf: "$_id", _id: 0, em: 1, ppm: 1, total: 1 } },
      { $sort: { ppm: 1 } }
    ])
    .toArray();
};
