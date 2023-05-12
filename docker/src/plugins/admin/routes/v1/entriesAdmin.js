import { getFields, OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('entries Admin');
// export default searchHandler;
const entriesAdmin = {
  method: 'GET',
  schema: {
    summary: 'Retrieve entries from the admin collection for monitoring',
    description:
      'This route retrieves the entries from the admin collection. This can be integrated in a monitoring system to keep under control the collection state and the last 50 logs.',
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
        default: 'state,seq,dateStart,dateEnd,sources,logs',
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
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('admin');

    debug(JSON.stringify({ collectionToSearch }));
    let formatedFields = getFields(fields);
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

    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'admin', connection, stack: e.stack });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
