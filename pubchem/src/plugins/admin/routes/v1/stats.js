// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('stats');
// export default searchHandler;
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

    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'admin', connection, stack: e.stack });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
