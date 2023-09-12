import { MF } from 'mass-tools';

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
      em: {
        type: 'string',
        description: 'Monoisotopic mass (in Da)',
        example: '287.116, 318.147',
        default: '',
      },
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
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 10,
      },
      mf: {
        type: 'string',
        description: 'MF of the compound',
        example: 'C16H17NO4',
        default: '',
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
  let data = getRequestQuery(request);
  let {
    em = '',
    mf = '',
    masses = '',
    precision = 10,
    limit = 10,
    fields = 'data.spectrum,data.ocl',
  } = data;

  // define the error allowed for the search
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('massBank');
    // get the fields to be retrieved
    let formattedFields = getFields(fields);

    let massesArray = masses.split(/[, \t\n\r:;]+/);
    let matchParameter = {};
    let spectraPatamenters = [];
    if (massesArray.length > 0 && massesArray[0] !== '') {
      for (let massString of massesArray) {
        const mass = Number(massString);
        const error = (mass / 1e6) * precision;
        spectraPatamenters.push({
          'data.spectrum.data.x': {
            $elemMatch: {
              $gte: mass - error,
              $lte: mass + error,
            },
          },
        });
      }
      matchParameter.$and = spectraPatamenters;
    }
    if (mf !== '') {
      let mfinfo = new MF(mf).getInfo();
      matchParameter['data.mf'] = mfinfo.mf;
    }
    let error;
    let ems = em
      .split(/[ ,;\t\r\n]+/)
      .filter((entry) => entry)
      .map(Number);
    if (ems.length > 1) {
      let match = [];

      for (let em of ems) {
        error = (em / 1e6) * precision;
        match.push({
          'data.em': { $lt: em + error, $gt: em - error },
        });
      }
      matchParameter = { $or: match };
    } else if (ems.length === 1 && ems[0] !== '') {
      error = (ems[0] / 1e6) * precision;

      matchParameter = {
        'data.em': { $lt: ems[0] + error, $gt: ems[0] - error },
      };
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
        collection: 'massBank',
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
