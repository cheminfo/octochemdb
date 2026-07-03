// query for molecules from monoisotopic mass
import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getStats } from '../../../../../utils/getStats.js';

const debug = debugLibrary('stats');
/**
 * Route handler that returns global statistics for the npAtlases collection.
 * @returns Object with a `data` field holding the statistics, or an `errors`
 *   array when the query fails.
 */

export async function statsHandler() {
  let connection;
  try {
    connection = new OctoChemConnection();

    const results = await getStats(connection, 'npAtlases');

    return { data: results };
  } catch (error) {
    if (connection) {
      await debug.error(error.message, {
        collection: 'npAtlases',
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
