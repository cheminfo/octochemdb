import { getFields, OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../utils/getRequestQuery.js';

const debug = debugLibrary('fromMasses');
// export the handler
const fromMasses = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve mass spectra from range of masses, from EM or from MF',
    description:
      'Allows to search for mass spectra based on a range of m/z values. Also allows to search for exact mass or molecular formula.',
    querystring: {
      masses: {
        type: 'string',
        description: 'List experimental mass',
        example: '125.02,185.09',
        default: '',
      },
      precision: {
        type: 'number',
        description: 'Precision (in ppm) of the monoisotopic mass',
        default: 10,
      },
      mode: {
        type: 'string',
        description: 'Mode of the mass spectra: positive or negative',
        default: 'positive',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 10,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data.masses.positive,data.ocl',
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
  let data = getRequestQuery(request);
  let {
    masses = '',
    mode = 'positive',
    precision = 10,
    limit = 10,
    fields = 'data.masses,data.ocl',
  } = data;

  // define the error allowed for the search
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('inSilicoFragments');
    // get the fields to be retrieved
    let formattedFields = getFields(fields);

    let massesArray = masses.split(/[, \t\n\r:;]+/);
    let matchParameter = {};
    let spectraPatamenters = [];
    let modeParameter;
    if (mode === 'positive') {
      modeParameter = 'data.masses.positive';
    } else {
      modeParameter = 'data.masses.negative';
    }
    if (massesArray.length > 0 && massesArray[0] !== '') {
      for (let massString of massesArray) {
        const mass = Number(massString);
        const error = (mass / 1e6) * precision;
        let search = {};
        search[modeParameter] = {
          $elemMatch: {
            $gte: mass - error,
            $lte: mass + error,
          },
        };

        spectraPatamenters.push(search);
      }
      matchParameter.$and = spectraPatamenters;
    }
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
  } catch (e) {
    if (connection) {
      await debug.error(e.message, {
        collection: 'inSilicoFragments',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    if (connection) {
      debug.trace('Closing connection');
      await connection.close();
    }
  }
}
