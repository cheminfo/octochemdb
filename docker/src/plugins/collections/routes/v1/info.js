import { OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('info');
// export default searchHandler;
const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve an overview about all the collections',
    description:
      'Retrieve an overview (stored in admin) and statistics about all the collections',
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
    connection = new OctoChemConnection();

    const adminInfo = {};
    (await (await connection.getCollection('admin')).find().toArray())
      .filter((entry) => String(entry._id).match(/_progress$/))
      .forEach((entry) => {
        adminInfo[String(entry._id).replace('_progress', '')] = {
          date: entry.dateEnd,
          state: entry.state,
          seq: entry.seq,
          logs: entry.logs,
        };
      });
    const names = await connection.getCollectionNames();

    const results = [];
    debug.trace(JSON.stringify(adminInfo));
    for (let name of names) {
      const collection = await connection.getCollection(name);
      const stats = await collection.stats();
      debug.trace(`${name}, ${JSON.stringify(adminInfo[name])}`);
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
      debug.fatal(e.message, {
        collection: 'admin',
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
