import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';

const debug = debugLibrary('searchIDs');

/**
 * Performs a full-text search over patent titles and abstracts, optionally
 * restricted to a set of patent IDs, and returns the matching patents.
 * @param request - Fastify request whose query provides `patentsIDs`
 *   (optional list of IDs to restrict the search), `keywords` (text searched in
 *   title and abstract), `fields` (fields to return), `minScore` (minimum text
 *   search score) and `limit` (maximum number of results).
 * @returns Object with a `data` array of matching patents (including a `score`
 *   field when keywords are used), or an `errors` array if the query fails.
 */
export async function searchHandler(request) {
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
  } catch (error) {
    if (connection) {
      await debug.error(error.message, {
        collection: 'patents',
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
