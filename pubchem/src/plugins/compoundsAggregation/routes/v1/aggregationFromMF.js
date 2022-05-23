// query for molecules from monoisotopic mass
import { getFields, PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('aggregationFromMF');

const entriesFromMF = {
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
        default:
          'data.em,data.charge,data.unsaturation,data.active,data.ocls,data.names,data.keywords,data.activities,data.taxonomies',
      },
    },
  },
  handler: searchHandler,
};

export default entriesFromMF;

async function searchHandler(request) {
  let {
    mf = '',
    limit = 1e3,
    fields = 'data.em,data.charge,data.unsaturation,data.active,data.ocls,data.names,data.keywords,data.activities,data.taxonomies',
  } = request.query;

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('bestOfCompounds');
    let formatedFields = getFields(fields);
    formatedFields._id = 0;
    debug(mf);

    const results = await collection
      .aggregate([
        { $match: { 'data.mf': mf } },
        { $limit: limit },
        {
          $project: formatedFields,
        },
      ])
      .toArray();
    return results;
  } catch (e) {
    const optionsDebug = { collection: 'bestOfCompounds', connection };
    debug(e, optionsDebug);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
