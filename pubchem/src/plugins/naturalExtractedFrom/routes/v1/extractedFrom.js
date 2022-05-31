// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('naturalExtractedFrom');

const extractedFrom = {
  method: 'GET',
  schema: {
    summary: 'Retrieve all entries from the naturalExtractedFrom collection',
  },
  handler: searchHandler,
};

export default extractedFrom;
/**
 * Returns statistics about the collection
 * @return {Promise}
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('naturalExtractedFrom');

    const results = await collection
      .aggregate([{ $match: { _id: { $exists: true } } }])
      .toArray();
    return results;
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'naturalExtractedFrom', connection });
    }
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}