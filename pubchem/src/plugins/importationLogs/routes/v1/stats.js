// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('stats');

const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the importationLogs collection',
  },
  handler: searchHandler,
};

export default stats;
/**
 * Returns statistics about the collection
 * @return {Promise} statistics about the collection
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('importationLogs');

    const results = await collection.stats();

    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'importationLogs',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
