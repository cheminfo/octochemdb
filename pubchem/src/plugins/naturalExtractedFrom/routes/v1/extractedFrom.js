// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('naturalExtractedFrom');
// searchHandler()
const extractedFrom = {
  method: 'GET',
  schema: {
    summary: 'Retrieve all entries from the naturalExtractedFrom collection',
  },
  handler: searchHandler,
};

export default extractedFrom;
/**
 * Returns all entries from the naturalExtractedFrom collection
 * @return {Promise} returns all entries from the naturalExtractedFrom collection
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('naturalExtractedFrom');

    const results = await collection
      .aggregate([{ $match: { _id: { $exists: true } } }])
      .toArray();
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
