// query for molecules from monoisotopic mass
import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getStats } from '../../../../../utils/getStats.js';

const debug = debugLibrary('stats');
// export default searchHandler;
/**
 * @description get the global statistics from the admin collection
 * @returns Returns statistics about the collection
 */

export async function statsHandler() {
  let connection;
  try {
    connection = new OctoChemConnection();

    const results = await getStats(connection, 'admin');

    return { data: results };
  } catch (error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'admin',
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
