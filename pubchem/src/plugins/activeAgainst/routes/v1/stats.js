// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('stats');

const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the activeAgainst collection',
  },
  handler: searchHandler,
};

export default stats;

/**
 * @description Generate statistics about the activeAgainst collection
 * @return {Promise} Returns statistics about the collection
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('activeAgainst');

    const results = await collection.stats();

    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'activeAgainst',
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
