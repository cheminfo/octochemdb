import { OctoChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../utils/getRequestQuery.js';

const debug = debugLibrary('searchIDs');

const searchIDs = {
  method: ['GET', 'POST'],
  schema: {
    summary:
      'Retrieve articles which title or abstract contains the given text',
    description: 'Allows to search for articles Title and Abstract.',
    querystring: {
      patentsIDs: {
        type: 'string',
        description: 'patents IDs',
        example: 'EP-2078065-A2, EP-1293521-A2',
        default: '',
      },
      keywords: {
        type: 'string',
        description: 'Text to be searched in articles Title and Abstract',
        example: 'antibiotic',
        default: '',
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },
      minScore: {
        type: 'number',
        description: 'Text search score minimum',
        example: 2,
        default: 1,
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
  let data = getRequestQuery(request);
  let {
    patentsIDs = '',
    keywords = '',
    fields = 'data.title, _id, data.abstract',
    minScore = 0,
    limit = 100,
  } = data;
  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('patents');

    let matchParameters = {};
    let aggregateParameters;
    if (patentsIDs !== '') {
      matchParameters._id = { $in: patentsIDs.split(/[ ,;\t\r\n]+/) };
    }
    if (keywords !== '') {
      matchParameters.$text = { $search: keywords };
      formattedFields.score = { $meta: 'textScore' };
      aggregateParameters = [
        {
          $match: matchParameters,
        },

        { $project: formattedFields },
        {
          $match: { score: { $gte: minScore } },
        },

        { $limit: Number(limit) },
      ];
    }
    if (keywords === '') {
      aggregateParameters = [
        {
          $match: matchParameters,
        },
        { $project: formattedFields },
        { $limit: Number(limit) },
      ];
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
