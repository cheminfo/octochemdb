import { OctoChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../utils/getRequestQuery.js';

const debug = debugLibrary('ids');

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary:
      'Retrieve articles which title or abstract contains the given text',
    description: 'Allows to search for articles Title and Abstract.',
    querystring: {
      ids: {
        type: 'string',
        description: 'patents IDs',
        example: 'EP-2078065-A2, EP-1293521-A2',
        default: '',
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },
    },
  },
  handler: searchHandler,
};

export default searchIDs;

async function searchHandler(request) {
  let data = getRequestQuery(request);
  let { ids = '', fields = 'data' } = data;
  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('patents');

    let matchParameters = {};
    let aggregateParameters;

    if (ids !== '') {
      matchParameters._id = { $in: ids.split(/[ ,;\t\r\n]+/) };
      aggregateParameters = [
        {
          $match: matchParameters,
        },
        { $project: formattedFields },
      ];
    } else {
      return { error: [{ title: 'No patents IDs provided' }] };
    }

    const result = await collection.aggregate(aggregateParameters).toArray();

    return { data: result };
  } catch (e) {
    if (connection) {
      await debug.error(e.message, {
        collection: 'patents',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug.trace('Closing connection');
    if (connection) await connection.close();
  }
}
