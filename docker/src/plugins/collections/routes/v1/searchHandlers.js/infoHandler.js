import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

const debug = debugLibrary('info');
/**
 * @description Retrieve an overview (stored in admin) and statistics about all the collections
 * @returns {Promise} returns an overview of the collections and their statistics
 */

export async function infoHandler() {
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
      const query = await collection.aggregate([
        { $collStats: { storageStats: {} } },
      ]);
      const stats = await query.next();
      debug.trace(`${name}, ${JSON.stringify(adminInfo[name])}`);
      //  console.log(stats?.storageStats.ns);
      results.push({
        ns: stats?.ns,
        size: stats?.storageStats.size,
        count: stats?.storageStats.count,
        avgObjSize: stats?.storageStats.avgObjSize,
        storageSize: stats?.storageStats.storageSize,
        freeStorageSize: stats?.storageStats.freeStorageSize,
        capped: stats?.storageStats.capped,
        ...adminInfo[name],
      });
    }
    return { data: results };
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
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
