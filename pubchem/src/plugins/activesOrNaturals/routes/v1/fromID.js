import { getFields, PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('entriesFromEM');
// export the handler
const entriesFromEM = {
  method: 'GET',
  schema: {
    summary: 'Retrieve a compound from the racemic oclID',
    description: '',
    querystring: {
      id: {
        type: 'string',
        description: '',
        example: '',
        default: '',
      },
    },
  },
  handler: searchHandler,
};
export default entriesFromEM;

/**
 * @description Search for compounds from a monoisotopic mass, target taxonomies, source taxonomies and bioassays
 * @param {object} request
 * @returns {Promise<object>} Entries who match the query parameters inside the activeOrNaturals collection
 */
async function searchHandler(request) {
  let {
    id = '',
    fields = 'data.em,data.mf,data.charge,data.unsaturation,data.bioActive,data.naturalProduct,data.kwMeshTerms,data.kwBioassays,data.kwTaxonomies,data.kwActiveAgainst,data.activities,data.taxonomies',
  } = request.query;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('activesOrNaturals');
    // get the fields to be retrieved
    let formattedFields = getFields(fields);
    formattedFields._id = 0;
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
      debug(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
