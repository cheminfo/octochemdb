// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('stats');

const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the lotuses collection',
  },
  handler: searchHandler,
};

export default stats;
/**
 * Returns statistics about the collection
 * @return {Promise} returns a promise with the statistics
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('lotuses');

    const results = await collection.stats();

    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'importationLogs', connection });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
