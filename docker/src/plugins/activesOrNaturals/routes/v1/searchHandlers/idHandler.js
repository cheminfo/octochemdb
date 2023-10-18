import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

/**
 * @description Search for compounds from a monoisotopic mass, target taxonomies, source taxonomies and bioassays
 * @param {object} request
 * @returns {Promise<object>} Entries who match the query parameters inside the activeOrNaturals collection
 */
export async function idHandler(request) {
  let { id = '', fields = 'data' } = request.query;
  const debug = debugLibrary('entriesFromID');

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
