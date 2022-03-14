// query for molecules from monoisotopic mass
import Debug from 'debug';

import { PubChemConnection } from '../../../../server/utils.js';

const debug = Debug('stats');

const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the mfs collection',
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
    const collection = await connection.getCollection('compounds');

    const results = await collection.stats();

    return results;
  } catch (e) {
    console.log(e);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
