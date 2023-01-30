// query for molecules from monoisotopic mass
import { getFields, PubChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromEM');

const fromEM = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compounds from a monoisotopic mass',
    description:
      'Allows to search for pubchem compounds based on a monoisotopic mass, precision (accuracy) of the measurement.',
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
        default: 'data.em,data.mf,data.total,data.atom,data.unsaturation',
      },
    },
  },
  handler: searchHandler,
};

export default fromEM;
/**
 * Find molecular formula from a monoisotopic mass
 * @param {object} [request={}]
 * @param {object} [request.query={}]
 * @param {number} [request.query.em=0]
 * @param {number} [request.query.limit=1000]
 * @param {number} [request.query.precision=100]
 * @param {string} [request.query.fields='data.em,data.mf,data.total,data.atom,data.unsaturation']
 * @param {number} [request.query.minPubchemEntries=0]
 * @return {Promise<Document[]>}
 */

async function searchHandler(request) {
  let {
    em = 0,
    limit = 1e3,
    precision = 100,
    fields = 'data.em,data.mf,data.total,data.atom,data.unsaturation',
  } = request.query;

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;
  let error = (em / 1e6) * precision;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('compounds');

    debug(em);

    const results = await collection
      .aggregate([
        { $match: { 'data.em': { $lt: em + error, $gt: em - error } } },
        { $limit: limit },
        {
          $project: getFields(fields),
        },
      ])
      .toArray();

    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'compounds', connection, stack: e.stack });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
