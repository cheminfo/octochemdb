// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('stats');

const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the admin collection',
  },
  handler: searchHandler,
};

export default stats;
/**
 * @description get the global statistics from the admin collection
 * @return {Promise} Returns statistics about the collection
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('admin');

    const results = await collection.stats();

    return results;
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'admin', connection });
    }
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
