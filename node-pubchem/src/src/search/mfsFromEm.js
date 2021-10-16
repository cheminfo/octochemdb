// query for molecules from monoisotopic mass
import Debug from 'debug';

import getFields from './getFields.js';

const pubChemConnection = new (require('../util/PubChemConnection'))();

const debug = Debug('mfsFromEm');

/**
 * Find molecular formula from a monoisotopic mass
 * @param {number} em
 * @param {object} [options={}]
 * @param {object} [options.limit=1000]
 * @param {object} [options.precision=100]
 * @param {object} [options.minPubchemEntries=0]
 * @return {Array}
 */
export default async function mfsFromEm(em, options = {}) {
  let {
    limit = 1e3,
    precision = 100,
    minPubchemEntries = 0,
    fields = 'em,mf,total,atom,unsaturation',
  } = options;

  if (!em) {
    throw new Error('em parameter must be specified');
  }
  em = Number(em);

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;
  let error = (em / 1e6) * precision;

  const collection = await pubChemConnection.getMfsCollection();

  debug(JSON.stringify({ em, error }));

  return collection
    .aggregate([
      {
        $match: {
          em: { $lt: em + error, $gt: em - error },
          total: { $gte: Number(minPubchemEntries) },
        },
      },
      {
        $project: getFields(fields),
      },
      {
        $addFields: {
          mf: '$_id',
          ppm: {
            $divide: [
              { $multiply: [{ $abs: { $subtract: ['$em', em] } }, 1e6] },
              em,
            ],
          },
        },
      },
      { $sort: { ppm: 1 } },
      { $limit: Number(limit) },
    ])
    .toArray();
}

/* direct test in mongoDB
em = 106.077351;
precision = 10;
error = (em * precision) / 1e6;
limit = 100;
db.mfs.aggregate([
  {
    $match: {
      em: { $lt: em + error, $gt: em - error }
    }
  },
  {
    $project: { _id: 0, em: 1, mf: '$_id', total: 1, atom: 1, unsaturation: 1 }
  },
  {
    $addFields: {
      ppm: {
        $divide: [
          { $multiply: [{ $abs: { $subtract: ['$em', em] } }, 1e6] },
          em
        ]
      }
    }
  },
  { $sort: { ppm: 1 } },
  { $limit: Number(limit) }
]);
*/
