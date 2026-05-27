import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getStats } from '../../../../../utils/getStats.js';

const debug = debugLibrary('stats');

/**
 * Handler for the pubmeds collection statistics route.
 *
 * Returns global statistics (document count, index sizes, etc.) for the
 * `pubmeds` collection, suitable for monitoring dashboards.
 * @returns
 */
export async function statsHandler() {
  let connection;
  try {
    connection = new OctoChemConnection();

    const results = await getStats(connection, 'pubmeds');

    return { data: results };
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
