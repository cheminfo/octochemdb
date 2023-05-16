// query for molecules from monoisotopic mass
import { OctoChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('searchIDs');

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve bioassays for given bioassay IDs',
    description: 'Allows to search for articles Title and Abstract.',
    querystring: {
      bioassayIDs: {
        type: 'string',
        description: 'Bioassays IDs ',
        example: '59478_1,5351641_1',
        default: '',
      },

      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },

      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        example: 200,
        default: 100,
      },
    },
  },
  handler: searchHandler,
};

export default searchIDs;

async function searchHandler(request) {
  let data;
  if (request.method === 'GET') {
    data = request.query;
  } else {
    data = request.body;
  }
  let { bioassayIDs = '', fields = 'data', limit = 100 } = data;

  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('bioassays');
    let matchParameters = {};
    let aggregateParameters;

    if (bioassayIDs !== '') {
      matchParameters._id = {
        $in: bioassayIDs.split(/[ ,;\t\r\n]+/).filter((entry) => entry),
      };
    }

    aggregateParameters = [
      {
        $match: matchParameters,
      },
      { $project: formattedFields },
      { $limit: Number(limit) },
    ];

    const result = await collection.aggregate(aggregateParameters).toArray();

    return { data: result };
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'bioassays',
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
