// query for molecules from monoisotopic mass
import { OctoChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('searchIDs');

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve lotuses entries for given lotuses IDs',
    description: 'Allows to search for compounds data',
    querystring: {
      ids: {
        type: 'string',
        description: 'lotuses IDs ',
        example: 'LTS0043466, LTS0256604',
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
  let data = {};
  for (let key in request.query) {
    data[key] = request.query[key];
  }
  if (request.body !== undefined) {
    for (let key in request.body) {
      data[key] = request.body[key].value;
    }
  }
  let { ids = '', fields = 'data' } = data;

  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('lotuses');
    let matchParameters = {};
    let aggregateParameters;

    if (ids !== '') {
      matchParameters._id = {
        $in: ids.split(/[ ,;\t\r\n]+/).filter((entry) => entry),
      };
    }

    aggregateParameters = [
      {
        $match: matchParameters,
      },
      { $project: formattedFields },
    ];

    const result = await collection.aggregate(aggregateParameters).toArray();

    return { data: result };
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'lotuses',
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