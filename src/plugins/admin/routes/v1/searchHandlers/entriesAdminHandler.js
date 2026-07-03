import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

import { getEntriesStats } from './getEntriesStats.js';
/**
 * Retrieves admin/progress entries (optionally for a single collection) enriched with per-collection storage statistics.
 * @param request - The incoming request; its query may contain `collectionToSearch` (restrict to one collection) and `fields` (fields to project).
 * @returns An object with a `data` array of progress entries plus their stats, or an `errors` array on failure.
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
    results = await getEntriesStats(connection, results, collectionToSearch);
    return { data: results };
  } catch (error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'admin',
        connection,
        stack: error.stack,
      });
    }
    return { errors: [{ title: error.message, detail: error.stack }] };
  } finally {
    debug.trace('Closing connection');
    if (connection) await connection.close();
  }
}
