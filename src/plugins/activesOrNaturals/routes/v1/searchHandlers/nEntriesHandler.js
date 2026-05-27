import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

/**
 * Search for `n` entries while skipping the first `k` entries.
 * @param request - Fastify request
 * @returns
 */
export async function nEntriesHandler(request) {
  const { n = 1000, k = 0, fields = '' } = request.query;
  const debug = debugLibrary('nEntriesHandler');

  /** @type {OctoChemConnection | undefined} */
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
  } catch (/** @type {any} */ error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'activesOrNaturals',
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
