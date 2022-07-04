// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('stats');

const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the compounds collection',
  },
  handler: searchHandler,
};

export default stats;
/**
 * Returns statistics about the collection
 * @return {Promise} returns statistics about the collection compounds
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('compounds');

    const results = await collection.stats();

    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'compounds', connection });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
