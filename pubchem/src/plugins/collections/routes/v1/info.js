// query for molecules from monoisotopic mass
import Debug from '../../../../utils/Debug.js';

import { PubChemConnection } from '../../../../server/utils.js';

const debug = Debug('info');

const stats = {
  method: 'GET',
  schema: {
    summary: 'Retrieve an overview about all the collections',
  },
  handler: searchHandler,
};

export default stats;
/**
 * Returns statistics about the collection
 * @return {Promise}
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
        };
      });
    const names = await connection.getCollectionNames();

    const results = [];
    debug(adminInfo);
    for (let name of names) {
      const collection = await connection.getCollection(name);
      const stats = await collection.stats();
      debug(name, adminInfo[name]);
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

    return results;
  } catch (e) {
    console.log(e);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
