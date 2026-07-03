// query for molecules from monoisotopic mass
import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';

const debug = debugLibrary('searchIDs');

/**
 * Retrieves npasses documents matching the requested npasses IDs.
 * Splits the comma/whitespace-separated `ids` query parameter and matches
 * them against the `_id` field of the `npasses` collection, projecting only
 * the requested `fields`.
 * @param request - Incoming HTTP request whose query provides `ids` (npasses IDs) and `fields` (fields to return, defaults to `data`).
 * @returns Object with a `data` array of matching documents, or an `errors` array on failure.
 */
export async function idsHandler(request) {
  let data = getRequestQuery(request);
  let { ids = '', fields = 'data' } = data;

  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('npasses');
    let matchParameters = {};
    let aggregateParameters;

    if (ids !== '') {
      matchParameters._id = {
        $in: ids.split(/[ ,;\t\r\n]+/).filter(Boolean),
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
  } catch (error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'npasses',
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
