import { PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('info');
// export default searchHandler;
const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve an overview about all the collections',
  },
  handler: searchHandler,
};

export default stats;
/**
 * @description Retrieve an overview (stored in admin) and statistics about all the collections
 * @returns {Promise} returns an overview of the collections and their statistics
 */

async function searchHandler() {
  let connection;
  try {
    connection = new PubChemConnection();

    const adminInfo = {};
    (await (await connection.getCollection('admin')).find().toArray())
      .filter((entry) => String(entry._id).match(/_progress$/))
      .forEach((entry) => {
        adminInfo[String(entry._id).replace('_progress', '')] = {
          date: entry.date,
          state: entry.state,
          seq: entry.seq,
          logs: entry.logs,
        };
      });
    const names = await connection.getCollectionNames();

    const results = [];
    debug(JSON.stringify(adminInfo));
    for (let name of names) {
      const collection = await connection.getCollection(name);
      const stats = await collection.stats();
      debug(`${name}, ${JSON.stringify(adminInfo[name])}`);
      results.push({
        ns: stats.ns,
        size: stats.size,
        count: stats.count,
        avgObjSize: stats.avgObjSize,
        storageSize: stats.storageSize,
        freeStorageSize: stats.freeStorageSize,
        capped: stats.capped,
        ...adminInfo[name],
      });
    }
    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'admin', connection });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
