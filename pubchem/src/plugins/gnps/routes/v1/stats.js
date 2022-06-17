// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('stats');

const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the GNPS collection',
  },
  handler: searchHandler,
};

export default stats;
/**
 * Returns statistics about the collection GNPS
 * @return {Promise}
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('gnps');

    const results = await collection.stats();

    return results;
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'gnps', connection });
    }
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
