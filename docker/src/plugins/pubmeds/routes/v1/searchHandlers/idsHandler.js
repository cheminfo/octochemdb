import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';

const debug = debugLibrary('searchIDs');

/**
 * Handler for the multi-PMID lookup route.
 *
 * Splits the comma/whitespace-separated `ids` string into numeric PMIDs,
 * queries the `pubmeds` collection with `$in`, and returns the projected
 * fields for all matching articles.
 *
 * @param {import('fastify').FastifyRequest} request - Fastify request with
 *   `query.ids` (string) and `query.fields` (string).
 * @returns {Promise<{ data: object[] } | { errors: object[] }>}
 */
export async function idsHandler(request) {
  const data = getRequestQuery(request);
  const { ids = '', fields = 'data' } = data;

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
      aggregateParameters = [
        {
          $match: matchParameters,
        },
        { $project: formattedFields },
      ];
    } else {
      return { error: [{ title: 'No IDs provided' }] };
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
