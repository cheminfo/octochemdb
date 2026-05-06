import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

/**
 * Retrieve the entry for a given noStereoTautomerID.
 * @param {{ query: { id?: string, fields?: string } }} request - Fastify request
 * @returns {Promise<{data: unknown} | {errors: Array<{title: string, detail: string}>}>}
 */
export async function idHandler(request) {
  const { id = '', fields = 'data' } = request.query;
  const debug = debugLibrary('entriesFromID');

  /** @type {OctoChemConnection | undefined} */
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('activesOrNaturals');
    // get the fields to be retrieved
    let formattedFields = getFields(fields);
    // define match parameters for the search, the $in operator is used to search for multiple words and is true if at least one of the words is found
    // search for the entries
    const results = await collection
      .aggregate([
        { $match: { _id: id } },
        { $limit: 1 },
        {
          $project: formattedFields,
        },
      ])
      .next();
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
