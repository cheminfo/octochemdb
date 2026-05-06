import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

/**
 * Search for `n` entries while skipping the first `k` entries.
 * @param {{ query: { n?: number, k?: number, fields?: string } }} request - Fastify request
 * @returns {Promise<{data: unknown[]} | {errors: Array<{title: string, detail: string}>}>}
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
  } catch (/** @type {any} */ e) {
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
