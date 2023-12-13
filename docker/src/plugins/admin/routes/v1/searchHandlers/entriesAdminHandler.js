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
    const results = await collection
      .aggregate([
        {
          $match: matchParameter,
        },
        {
          $project: formatedFields,
        },
      ])
      .toArray();

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
