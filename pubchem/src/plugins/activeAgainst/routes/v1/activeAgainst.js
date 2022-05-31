// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('activeAgainst');

const activeAgainst = {
  method: 'GET',
  schema: {
    summary: 'Retrieve all entries from the activeAgainst collection',
  },
  handler: searchHandler,
};

export default activeAgainst;
/**
 * Returns statistics about the collection
 * @return {Promise}
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('activeAgainst');

    const results = await collection
      .aggregate([{ $match: { _id: { $exists: true } } }])
      .toArray();
    return results;
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'activeAgainst', connection });
    }
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}