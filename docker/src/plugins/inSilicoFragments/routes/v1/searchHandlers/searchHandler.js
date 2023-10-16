import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';
import { prepareSpectraQuery } from '../../../../gnps/routes/v1/utils/prepareSpectraQuery.js';

const debug = debugLibrary('fromMasses');

/**
 * @description Search for compounds from a monoisotopic mass, target taxonomies, source taxonomies and bioassays
 * @param {object} request
 * @returns {Promise<object>} Entries who match the query parameters inside the activeOrNaturals collection
 */
export async function searchHandler(request) {
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
    const collection = await connection.getCollection('inSilicoFragments_V2');
    // get the fields to be retrieved
    let formattedFields = getFields(fields);
    let matchParameter = {};
    let modeParameter;
    if (mode === 'positive') {
      modeParameter = 'data.masses.positive';
    } else {
      modeParameter = 'data.masses.negative';
    }
    prepareSpectraQuery(matchParameter, modeParameter, masses, precision);
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
        collection: 'inSilicoFragments_V2',
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
