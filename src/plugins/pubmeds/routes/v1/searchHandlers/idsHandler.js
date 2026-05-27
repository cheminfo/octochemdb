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
 * @param request - Fastify request with
 *   `query.ids` (string) and `query.fields` (string).
 * @returns
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
          .filter(Boolean)
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
