// query for molecules from monoisotopic mass
import Debug from 'debug';

import { getFields, PubChemConnection } from '../../../../server/utils.js';

const debug = Debug('compoundsFromMF');

const compoundsFromMF = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compounds from a molecular formula',
    description: '',
    querystring: {
      mf: {
        type: 'string',
        description: 'Molecular formula',
        example: 'Et3N',
        default: null,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 1000,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data.em,data.mf,data.total,data.atom,data.unsaturation',
      },
    },
  },
  handler: searchHandler,
};

export default compoundsFromMF;
/**
 * Find molecular formula from a monoisotopic mass
 * @param {object} [request={}]
 * @param {object} [request.query={}]
 * @param {number} [request.query.mf='']
 * @param {number} [request.query.limit=1000]
 * @param {string} [request.query.fields='data.em,data.mf,data.total,data.atom,data.unsaturation']
 * @param {number} [request.query.minPubchemEntries=0]
 * @return {Promise<Document[]>}
 */

async function searchHandler(request) {
  let {
    mf = '',
    limit = 1e3,
    fields = 'data.em,data.mf,data.total,data.atom,data.unsaturation',
  } = request.query;

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('compounds');

    debug(mf);

    const results = await collection
      .aggregate([
        { $match: { 'data.mf': mf } },
        { $limit: limit },
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
