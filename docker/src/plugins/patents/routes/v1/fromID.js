import { OctoChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('searchIDs');

const searchIDs = {
  method: 'GET',
  schema: {
    summary: 'Retrieve a patent abstract and title from a patent ID',
    description: 'Allows to search for articles Title and Abstract.',
    querystring: {
      patentsID: {
        type: 'string',
        description: 'patents ID',
        example: 'CN101597246A',
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
  let { patentsID: patentID = '', fields = 'data' } = request.query;
  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('patents');
    debug(patentID);
    let matchParameters = {};
    let aggregateParameters;

    matchParameters._id = patentID;
    debug(matchParameters);
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
      debug(e.message, {
        collection: 'patents',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
