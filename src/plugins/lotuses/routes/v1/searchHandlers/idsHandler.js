// query for molecules from monoisotopic mass
import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';

const debug = debugLibrary('searchIDs');

/**
 * Route handler that retrieves lotuses entries matching the given IDs.
 * @param request - Incoming request whose query provides `ids` (a delimited
 *   list of lotuses IDs) and `fields` (the fields to project).
 * @returns Object with a `data` array of matching entries, or an `errors`
 *   array when the query fails.
 */
export async function idsHandler(request) {
  let data = getRequestQuery(request);
  let { ids = '', fields = 'data' } = data;

  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('lotuses');
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
        collection: 'lotuses',
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
