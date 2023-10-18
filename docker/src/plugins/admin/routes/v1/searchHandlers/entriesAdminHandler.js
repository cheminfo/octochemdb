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
    limit = 0,
    fields = 'state,seq,date,sources,logs',
  } = request.query;
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('admin');

    debug.trace(JSON.stringify({ collectionToSearch }));
    let formatedFields = getFields(fields);
    if (formatedFields.logs) {
      formatedFields.logs = { $slice: ['$logs', Number(limit)] };
    }

    const results = await collection
      .aggregate([
        {
          $match: {
            _id: `${collectionToSearch}_progress`,
          },
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
