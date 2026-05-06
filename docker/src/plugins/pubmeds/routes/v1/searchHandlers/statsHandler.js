import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getStats } from '../../../../../utils/getStats.js';

const debug = debugLibrary('stats');

/**
 * Handler for the pubmeds collection statistics route.
 *
 * Returns global statistics (document count, index sizes, etc.) for the
 * `pubmeds` collection, suitable for monitoring dashboards.
 *
 * @returns {Promise<{ data: object } | { errors: object[] }>}
 */
export async function statsHandler() {
  let connection;
  try {
    connection = new OctoChemConnection();

    const results = await getStats(connection, 'pubmeds');

    return { data: results };
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
