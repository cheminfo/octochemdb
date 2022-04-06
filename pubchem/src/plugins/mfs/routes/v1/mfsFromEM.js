// query for molecules from monoisotopic mass
import { getFields, PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('mfsFromEM');

const mfsFromEM = {
  method: 'GET',
  schema: {
    querystring: {
      em: {
        type: 'number',
        description: 'Monoisotopic mass',
        example: 300.123,
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
 * @param {object} [request={}]
 * @param {object} [request.query={}]
 * @param {number} [request.query.em=0]
 * @param {number} [request.query.limit=1000]
 * @param {number} [request.query.precision=100]
 * @param {string} [request.query.fields='em,mf,total,atom,unsaturation']
 * @param {number} [request.query.minPubchemEntries=0]
 * @return {Promise<Document[]>}
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
    const collection = await connection.getCollection('mfs');

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
    debug(e.stack);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
