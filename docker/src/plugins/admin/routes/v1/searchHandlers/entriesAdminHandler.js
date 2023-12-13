import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

/**
 * @description Search handler for the entries admin
 * @param {*} request the request object 'state,seq,date,sources,logs'
 * @returns {Promise<*>} the result of the search
 */

export async function entriesAdminHandler(request) {
  const debug = debugLibrary('entries Admin');

  let {
    collectionToSearch = '',
    fields = '_id,state,seq,dateStart,dateEnd,logs,sources',
  } = request.query;
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('admin');

    let formatedFields = getFields(fields);
    let matchParameter = {};
    if (collectionToSearch !== '') {
      matchParameter = {
        _id: `${collectionToSearch}_progress`,
      };
    }
    let results = await collection
      .aggregate([
        {
          $match: matchParameter,
        },
        {
          $project: formatedFields,
        },
      ])
      .toArray();
    ///
    const names = await connection.getCollectionNames();
    for (let name of names) {
      if (!results.find((result) => result._id === `${name}_progress`)) {
        results.push({
          _id: `${name}_progress`,
          state: 'not started',
          seq: 0,
          dateStart: 0,
          dateEnd: 0,
        });
      }
      const collection = await connection.getCollection(name);
      const query = await collection.aggregate([
        { $collStats: { storageStats: {} } },
      ]);
      const stats = await query.next();
      const progressResult = results.find(
        (result) => result._id === `${name}_progress`,
      );
      if (progressResult) {
        progressResult.ns = stats?.ns;
        progressResult.size = stats?.storageStats?.size;
        progressResult.count = stats?.storageStats?.count;
        progressResult.avgObjSize = stats?.storageStats?.avgObjSize;
        progressResult.storageSize = stats?.storageStats?.storageSize;
        progressResult.freeStorageSize = stats?.storageStats?.freeStorageSize;
        progressResult.capped = stats?.storageStats?.capped;
        results = results.map((result) => {
          if (result._id === `${name}_progress`) {
            return progressResult;
          } else {
            return result;
          }
        });
      }
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
