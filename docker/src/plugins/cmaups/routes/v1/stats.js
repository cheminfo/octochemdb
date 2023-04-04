import { OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('stats');
// export default searchHandler;
const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the cmaups collection',
    description:
      'This route retrieves the global statics for the collection cmaups. This can be integrated in a monitoring system to keep under control the number of entries in the collection.',
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
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('cmaups');

    const results = await collection.stats();

    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'cmaups', connection, stack: e.stack });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
