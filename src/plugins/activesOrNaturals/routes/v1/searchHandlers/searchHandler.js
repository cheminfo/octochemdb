import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';
import { getMatchParameters } from '../utils/getMatchParameters.js';

/**
 * Search for compounds by monoisotopic mass, taxonomies, bioassays, and keywords.
 * @param request - Fastify request
 * @returns
 */
export async function searchHandler(request) {
  const debug = debugLibrary('entriesSearch');

  const data = getRequestQuery(request);
  let limit = Number(data.limit ?? 1e3);
  const fields = /** @type {string} */ (data.fields ?? 'data.em,data.mf');

  // define lower and upper bounds of the returned results limit
  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;

  /** @type {OctoChemConnection | undefined} */
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('activesOrNaturals');
    // get the fields to be retrieved
    let formattedFields = getFields(fields);

    const matchParameter = getMatchParameters(data);
    // search for the entries
    const results = await collection
      .aggregate([
        { $match: matchParameter },
        { $limit: limit },
        {
          $project: formattedFields,
        },
      ])
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
