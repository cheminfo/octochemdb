import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getStats } from '../../../../../utils/getStats.js';

const debug = debugLibrary('stats');
// export default searchHandler;
/**
 * @description get the stats of the cmaups collection
 * @returns returns the stats of the cmaups collection
 */

export async function statsHandler() {
  let connection;
  try {
    connection = new OctoChemConnection();

    const results = await getStats(connection, 'cmaups');

    return { data: results };
  } catch (error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'cmaups',
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
