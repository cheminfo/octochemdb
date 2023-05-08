// query for molecules from monoisotopic mass
import { getFields, OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromMF');

const fromMF = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compounds from a molecular formula',
    description:
      'Useful to retrieve all the compounds that have a given molecular formula',
    querystring: {
      mf: {
        type: 'string',
        description: 'Molecular formula',
        example: 'C37H60O8',
        default: '',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 1000,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default:
          'data.em,data.mf,data.unsaturation,data.charge,data.ocl.idCode',
      },
    },
  },
  handler: searchHandler,
};

export default fromMF;

async function searchHandler(request) {
  let {
    mf = '',
    limit = 1e3,
    fields = 'data.em,data.mf,data.unsaturation,data.charge,data.ocl.idCode',
  } = request.query;

  if (limit > 5e4) limit = 5e4;
  if (limit < 1) limit = 1;

  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('compounds');

    const results = await collection
      .aggregate([
        { $match: { 'data.mf': mf } },
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
