import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';

const debug = debugLibrary('search');

/**
 * Handler for the PubMed full-text search route.
 *
 * Supports filtering by PMID list and/or keyword text search (using
 * MongoDB's `$text` operator).  When keywords are supplied, results are
 * scored by text relevance and filtered by `minScore`.
 * @param request - Fastify request with
 *   `query.ids`, `query.keywords`, `query.fields`, `query.minScore`,
 *   and `query.limit`.
 * @returns
 */
export async function searchHandler(request) {
  const data = getRequestQuery(request);
  const {
    ids = '',
    keywords = '',
    fields = 'data',
    minScore = 0,
    limit = 100,
  } = data;
  const formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('pubmeds');
    let matchParameters = {};
    let aggregateParameters;
    if (ids !== '') {
      matchParameters._id = {
        $in: ids
          .split(/[ ,;\t\r\n]+/)
          .filter(Boolean)
          .map(Number),
      };
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
  } catch (error) {
    if (connection) {
      await debug.error(error.message, {
        collection: 'pubmeds',
        connection,
        stack: error.stack,
      });
    }
    return { errors: [{ title: error.message, detail: error.stack }] };
  } finally {
    debug.trace('Closing connection');
    if (connection) await connection.close();
  }
}
