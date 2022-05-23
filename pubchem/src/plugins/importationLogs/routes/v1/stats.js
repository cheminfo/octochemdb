// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('stats');

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
 * @return {Promise}
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('importationLogs');

    const results = await collection.stats();

    return results;
  } catch (e) {
    const optionsDebug = { collection: 'importationLogs', connection };
    debug(e, optionsDebug);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
