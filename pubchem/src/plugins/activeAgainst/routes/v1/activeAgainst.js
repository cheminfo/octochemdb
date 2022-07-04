import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('activeAgainst');

// export default activeAgainst;
const activeAgainst = {
  method: 'GET',
  schema: {
    summary: 'Retrieve all entries from the activeAgainst collection',
  },
  handler: searchHandler,
};
export default activeAgainst;

/**
 * @description Get all entries from the activeAgainst collection
 * @return {Promise} Returns statistics about the collection
 */

async function searchHandler() {
  let connection;
  try {
    // Get collections from the database
    connection = new PubChemConnection();
    const collection = await connection.getCollection('activeAgainst');
    // Get all entries from the activeAgainst collection
    const results = await collection
      .aggregate([{ $match: { _id: { $exists: true } } }])
      .toArray();
    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'activeAgainst', connection });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
