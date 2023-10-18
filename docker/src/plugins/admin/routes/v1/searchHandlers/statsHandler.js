// query for molecules from monoisotopic mass
import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getStats } from '../../../../../utils/getStats.js';

const debug = debugLibrary('stats');
// export default searchHandler;
/**
 * @description get the global statistics from the admin collection
 * @return {Promise} Returns statistics about the collection
 */

export async function statsHandler() {
  let connection;
  try {
    connection = new OctoChemConnection();

    const results = await getStats(connection, 'admin');

    return { data: results };
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'admin',
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
