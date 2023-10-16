// query for molecules from monoisotopic mass
import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

const debug = debugLibrary('stats');
/**
 * Returns statistics about the collection
 * @return {Promise}
 */

export async function statsHandler() {
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('compounds');

    const results = await collection.stats();

    return { data: results };
  } catch (e) {
    if (connection) {
      await debug.error(e.message, {
        collection: 'compounds',
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
