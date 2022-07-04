import { getFields, PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('entries Admin');
// export default searchHandler;
const entriesAdmin = {
  method: 'GET',
  schema: {
    querystring: {
      collectionToSearch: {
        type: 'string',
        description: 'Collection progress',
        example: 'bioassays',
        default: 'bioassays',
      },
      limit: {
        type: 'number',
        description: 'limit logs message',
        example: 10,
        default: 50,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'state,seq,date,sources,logs',
      },
    },
  },
  handler: searchHandler,
};

export default entriesAdmin;
/**
 * @description Search handler for the entries admin
 * @param {*} request the request object 'state,seq,date,sources,logs'
 * @returns {Promise<*>} the result of the search
 */

async function searchHandler(request) {
  let {
    collectionToSearch = '',
    limit = 0,
    fields = 'state,seq,date,sources,logs',
  } = request.query;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('admin');

    debug(JSON.stringify({ collectionToSearch }));
    let formatedFields = getFields(fields);
    formatedFields._id = 0;
    formatedFields.logs = { $slice: ['$logs', Number(limit)] };
    const results = await collection
      .aggregate([
        {
          $match: {
            _id: `${collectionToSearch}_progress`,
          },
        },
        {
          $project: formatedFields,
        },
      ])
      .toArray();

    return results;
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'admin', connection });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
