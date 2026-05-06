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
 *
 * @param {import('fastify').FastifyRequest} request - Fastify request with
 *   `query.ids`, `query.keywords`, `query.fields`, `query.minScore`,
 *   and `query.limit`.
 * @returns {Promise<{ data: object[] } | { errors: object[] }>}
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
          .filter((entry) => entry)
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
