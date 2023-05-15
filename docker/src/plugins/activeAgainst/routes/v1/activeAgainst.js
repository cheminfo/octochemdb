import { OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('activeAgainst');

// export default activeAgainst;
const activeAgainst = {
  method: 'GET',
  schema: {
    summary: 'Retrieve all entries from the activeAgainst collection',
    description:
      'This route retrieves all entries from the activeAgainst collection, which contains information about the taxonomy of the targets organisms to which the active compounds are active. \n This is could be useful to determine the kind of bioassays that are performed (e.g. 20% of the bioassays are performed against bacteria, etc.) or to know if exists active compounds against a specific organism.',
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
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('activeAgainst');
    // Get all entries from the activeAgainst collection
    const results = await collection
      .aggregate([{ $match: { _id: { $exists: true } } }])
      .toArray();
    return { data: results };
  } catch (e) {
    if (connection) {
      debug.fatal(e.message, {
        collection: 'activeAgainst',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug.trace('Closing connection');
    if (connection) await connection.close();
  }
}
