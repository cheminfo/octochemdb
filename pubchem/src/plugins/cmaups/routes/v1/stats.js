import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('stats');
// export default searchHandler;
const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the cmaups collection',
  },
  handler: searchHandler,
};

export default stats;
/**
 * @description get the stats of the cmaups collection
 * @returns {Promise} returns the stats of the cmaups collection
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('cmaups');

    const results = await collection.stats();

    return results;
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'cmaups', connection });
    }
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
