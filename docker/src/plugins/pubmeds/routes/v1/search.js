// query for molecules from monoisotopic mass
import { OctoChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../utils/getRequestQuery.js';

const debug = debugLibrary('search');

const search = {
  method: ['GET', 'POST'],
  schema: {
    summary:
      'Retrieve articles which title, MeSH terms or abstract contains the given text',
    description: 'Allows to search for articles Title and Abstract.',
    querystring: {
      ids: {
        type: 'string',
        description: 'PubMed IDs comma separated',
        example: '19342308,17200418',
        default: '',
      },
      keywords: {
        type: 'string',
        description:
          'Text to be searched in articles Title, Abstract or MeSH terms',
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

export default search;

async function searchHandler(request) {
  let data = getRequestQuery(request);
  let {
    ids = '',
    keywords = '',
    fields = 'data',
    minScore = 0,
    limit = 100,
  } = data;
  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('pubmeds');
    let matchParameters = {};
    let aggregateParameters;

    if (keywords !== '') {
      matchParameters.$text = { $search: keywords };
      formattedFields.score = { $meta: 'textScore' };
    }
    if (ids !== '') {
      matchParameters._id = {
        $in: ids
          .split(/[ ,;\t\r\n]+/)
          .filter((entry) => entry)
          .map(Number),
      };
    }
    if (keywords !== '' && ids !== '') {
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
      await debug.error(e.message, {
        collection: 'pubmeds',
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
