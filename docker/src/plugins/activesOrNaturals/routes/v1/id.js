import { getFields, OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('entriesFromID');
// export the handler
const entriesFromID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve the entry for a given noStereoTautomerID',
    description:
      'This route retrieves the entry for a given noStereoTautomerID, which is a ocl idCode of the molecule without stereochemistry and tautomerism. \n This is could be useful to retrieve the information about the molecule, such as the molecular formula, the bioassays, the publications, etc.',
    querystring: {
      id: {
        type: 'string',
        description: 'noStereoTautomerID',
        example:
          'fhiAP@@Xe[vRJJFYIJJDYxMUUUUUP@ZzQcFBXiafNXecVCXm`NOtQfJvOacxZuSGpq|L',
      },
    },
  },
  handler: searchHandler,
};
export default entriesFromID;

/**
 * @description Search for compounds from a monoisotopic mass, target taxonomies, source taxonomies and bioassays
 * @param {object} request
 * @returns {Promise<object>} Entries who match the query parameters inside the activeOrNaturals collection
 */
async function searchHandler(request) {
  let {
    id = '',
    fields = 'data.compounds,data.em,data.mf,data.charge,data.unsaturation,data.bioactive,data.naturalProduct,data.kwMeshTerms,data.kwBioassays,data.kwTaxonomies,data.kwActiveAgainst,data.activities,data.taxonomies,data.pubmeds,data.nbActivities,data.nbTaxonomies,data.nbPubmeds,data.nbPatents,data.patents,data.nbMassSpectra,data.massSpectra',
  } = request.query;

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
