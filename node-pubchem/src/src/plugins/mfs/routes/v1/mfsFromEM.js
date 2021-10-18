// query for molecules from monoisotopic mass
import Debug from 'debug';

import { getFields } from '../../../../server/utils.js';
import PubChemConnection, {
  MFS_COLLECTION,
} from '../../../../util/PubChemConnection.js';

const debug = Debug('mfsFromEM');

const mfsFromEM = {
  method: 'GET',
  schema: {
    querystring: {
      em: {
        type: 'number',
        description: 'Monoisotopic mass',
        example: 300.123,
        required: ['em'],
        default: null,
      },
      precision: {
        type: 'number',
        description: 'Precision (in ppm) of the monoisotopic mass',
        default: 100,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 1000,
      },
      minPubchemEntries: {
        type: 'number',
        description: 'Minimal number of entries in pubhcem',
        default: 0,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'em,mf,total,atom,unsaturation',
      },
    },
  },
  handler: searchHandler,
};

export default mfsFromEM;

/**
 * Find molecular formula from a monoisotopic mass
 * @param {number} em
 * @param {object} [options={}]
 * @param {object} [options.limit=1000]
 * @param {object} [options.precision=100]
 * @param {object} [options.minPubchemEntries=0]
 * @return {Array}
 */

async function searchHandler(request) {
  let {
    em = 0,
    limit = 1e3,
    precision = 100,
    minPubchemEntries = 0,
    fields = 'em,mf,total,atom,unsaturation',
  } = request.query;

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;
  let error = (em / 1e6) * precision;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection(MFS_COLLECTION);

    debug(JSON.stringify({ em, error }));

    const results = await collection
      .aggregate([
        {
          $match: {
            em: { $lt: em + error, $gt: em - error },
            total: { $gte: minPubchemEntries },
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
    return results;
  } catch (e) {
    console.log(e);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
