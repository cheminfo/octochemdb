// query for molecules from monoisotopic mass
import Debug from 'debug';

import PubChemConnection, {
  MFS_COLLECTION,
} from '../../../../util/PubChemConnection.js';

import getFields from './getFields.js';

const debug = Debug('mfsFromEM');

export const compoundsFromEM = {
  method: 'GET',
  url: '/compounds/compoundsFromEM',
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
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'em,mf,total,atom,unsaturation',
      },
    },
  },
  handler: searchHandler,
};

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
            em: { $lt: Number(em) + error, $gt: Number(em) - error },
          },
        },
        { $limit: Number(limit) },
        {
          $project: getFields(fields),
        },
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
