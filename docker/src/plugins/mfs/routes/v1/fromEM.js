// query for molecules from monoisotopic mass
import { getFields, OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromEM');

const fromEM = {
  method: 'GET',
  schema: {
    summary: 'Find molecular formula from a monoisotopic mass',
    description:
      'Useful to retrieve all the molecular formula that have a given monoisotopic mass',
    querystring: {
      em: {
        type: 'number',
        description: 'Monoisotopic mass',
        example: 300.123,
        default: null,
      },
      minCount: {
        type: 'number',
        description: 'Minimum number of mfs in PubChem',
        default: 5,
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
        default: 'em,_id,count,atoms,unsaturation',
      },
    },
  },
  handler: searchHandler,
};

export default fromEM;

async function searchHandler(request) {
  let {
    em = 0,
    minCount = 5,
    limit = 1e3,
    precision = 100,
    fields = 'em,_id,count,atoms,unsaturation',
  } = request.query;

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;
  let error = (em / 1e6) * precision;

  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('mfs');

    let fieldsToRetrieve = getFields(fields);

    const results = await collection
      .aggregate([
        {
          $match: {
            em: { $lt: em + error, $gt: em - error },
            count: { $gte: minCount },
          },
        },
        {
          $project: fieldsToRetrieve,
        },
        {
          $addFields: {
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
    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'mfs', connection, stack: e.stack });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
