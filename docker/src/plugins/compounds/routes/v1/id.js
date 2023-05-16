// query for molecules from monoisotopic mass
import { OctoChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('searchIDs');

const searchIDs = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compound for given compound ID',
    description: 'Allows to search for compound data',
    querystring: {
      id: {
        type: 'string',
        description: 'compound ID ',
        example: '102126174',
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
  let { id = '', fields = 'data' } = request.query;

  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('compounds');
    let matchParameters = {};
    let aggregateParameters;

    if (id !== '') {
      matchParameters._id = {
        $in: id
          .split(/[ ,;\t\r\n]+/)
          .filter((entry) => entry)
          .map(Number),
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
        collection: 'compounds',
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