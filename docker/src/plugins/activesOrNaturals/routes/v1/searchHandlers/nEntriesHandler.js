import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

/**
 * @description This function search for n entries while skipping the first k entries
 * @param {object} request
 * @returns {Promise<object>} Entries who match the query parameters inside the activeOrNaturals collection
 */
export async function nEntriesHandler(request) {
  let { n = 1000, k = 0, fields = '' } = request.query;
  const debug = debugLibrary('nEntriesHandler');

  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('activesOrNaturals');
    let formattedFields = getFields(fields);
    const results = await collection
      .find({})
      .skip(k)
      .limit(n)
      .project(formattedFields)
      .toArray();
    return { data: results };
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'activesOrNaturals',
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
