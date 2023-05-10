import { OctoChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

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
        description: 'patents IDs comma separated',
        example: 'CN101597246A, KR20170097520A',
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
  let data;
  if (request.method === 'GET') {
    data = request.query;
  } else {
    data = request.body;
  }
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

    if (keywords !== '') {
      matchParameters.$text = { $search: keywords };
      formattedFields.score = { $meta: 'textScore' };
    }
    if (patentsIDs !== '') {
      matchParameters._id = { $in: patentsIDs.split(/[ ,;\t\r\n]+/) };
    }
    if (keywords !== '' && patentsIDs !== '') {
      aggregateParameters = [
        {
          $match: matchParameters,
        },

        { $project: formattedFields },
        {
          $match: { score: { $gt: minScore } },
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
