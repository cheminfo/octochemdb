// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('stats');

const stats = {
  method: 'GET',
  schema: {
    summary:
      'Retrieve global statistics from the naturalExtractedFrom collection',
  },
  handler: searchHandler,
};

export default stats;
/**
 * Returns statistics about the collection
 * @return {Promise} returns statistics about the collection
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('naturalExtractedFrom');

    const results = await collection.stats();

    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'naturalExtractedFrom',
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
