import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('stats');
// export default searchHandler;
const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve global statistics from the activesOrNaturals collection',
  },
  handler: searchHandler,
};

export default stats;
/**
 * @description Get stats from the activesOrNaturals collection
 * @return {Promise} Returns statistics about the collection
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('activesOrNaturals');

    const results = await collection.stats();

    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'activesOrNaturals', connection });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
