// query for molecules from monoisotopic mass
import { OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('stats');

const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the GNPS collection',
  },
  handler: searchHandler,
};

export default stats;
/**
 * Returns statistics about the collection GNPS
 * @return {Promise}
 */

async function searchHandler() {
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('gnps');

    const results = await collection.stats();

    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'gnps', connection, stack: e.stack });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
