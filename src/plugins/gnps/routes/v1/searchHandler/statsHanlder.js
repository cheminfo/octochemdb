// query for molecules from monoisotopic mass
import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getStats } from '../../../../../utils/getStats.js';

const debug = debugLibrary('stats');
/**
 * Returns statistics about the collection GNPS
 * @returns
 */

export async function statsHandler() {
  let connection;
  try {
    connection = new OctoChemConnection();

    const results = await getStats(connection, 'gnps');
    return { data: results };
  } catch (error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'gnps',
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
