import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

const debug = debugLibrary('fromPMID');

/**
 * Handler for the single-PMID lookup route.
 *
 * Queries the `pubmeds` collection for the article matching the given
 * numeric PMID and returns the projected fields.
 *
 * @param {import('fastify').FastifyRequest} request - Fastify request with
 *   `query.id` (number) and `query.fields` (string).
 * @returns {Promise<{ data: object } | { errors: object[] }>}
 */
export async function idHandler(request) {
  const { id = 1, fields = 'data' } = request.query;

  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('pubmeds');

    const results = await collection
      .aggregate([
        { $match: { _id: id } },
        {
          $project: getFields(fields),
        },
      ])
      .toArray();
    return { data: results[0] };
  } catch (e) {
    if (connection) {
      await debug.error(e.message, {
        collection: 'pubmeds',
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
