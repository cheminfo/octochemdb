import { getFields, PubChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromMasses');
// export the handler
const fromMasses = {
  method: 'GET',
  schema: {
    summary: 'Retrieve mass spectra from range of masses',
    description:
      'Allows to search for mass spectra based on a range of m/z values.',
    querystring: {
      masses: {
        type: 'string',
        description: 'List Monoisotopic mass',
        example: '289.2,295.5',
        default: '289.2,295.5',
      },
      precision: {
        type: 'number',
        description: 'Precision (in ppm) of the monoisotopic mass',
        default: 10,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 10,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data.spectrum,data.ocl',
      },
    },
  },
  handler: searchHandler,
};
export default fromMasses;

/**
 * @description Search for compounds from a monoisotopic mass, target taxonomies, source taxonomies and bioassays
 * @param {object} request
 * @returns {Promise<object>} Entries who match the query parameters inside the activeOrNaturals collection
 */
async function searchHandler(request) {
  let {
    masses = '289.2,295.5',
    precision = 10,
    limit = 10,
    fields = 'data.spectrum,data.ocl',
  } = request.query;

  // define the error allowed for the search
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('gnps');
    // get the fields to be retrieved
    let formattedFields = getFields(fields);
    formattedFields._id = 0;

    let massesArray = masses.split(',');
    let matchParameters = [];
    for (let massString of massesArray) {
      const mass = Number(massString);
      matchParameters.push({
        'data.spectrum.data.x': {
          $lte: mass + (mass / 1e6) * precision,
          $gte: mass - (mass / 1e6) * precision,
        },
      });
    }

    // search for the entries
    const results = await collection
      .aggregate([
        { $match: { $and: matchParameters } },
        { $limit: limit },
        {
          $project: formattedFields,
        },
      ])
      .toArray();
    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'gnps',
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
