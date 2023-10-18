// query for molecules from monoisotopic mass
import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getStats } from '../../../../../utils/getStats.js';

const debug = debugLibrary('stats');
/**
 * Returns statistics about the collection
 * @return {Promise} - Promise that resolves to an object with the statistics
 */

export async function statsHandler() {
  let connection;
  try {
    connection = new OctoChemConnection();

    const results = await getStats(connection, 'npAtlases');

    return { data: results };
  } catch (e) {
    if (connection) {
      await debug.error(e.message, {
        collection: 'npAtlases',
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
