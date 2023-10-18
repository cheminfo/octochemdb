import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';
import { prepareMolecularInfoQuery } from '../utils/prepareMolecularInfoQuery.js';
import { prepareSpectraQuery } from '../utils/prepareSpectraQuery.js';

const debug = debugLibrary('searchGNPS');

/**
 * @description Search for compounds from a monoisotopic mass, target taxonomies, source taxonomies and bioassays
 * @param {object} request
 * @returns {Promise<object>} Entries who match the query parameters inside the activeOrNaturals collection
 */
export async function searchHandler(request) {
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
    const collection = await connection.getCollection('gnps');
    // get the fields to be retrieved
    let formattedFields = getFields(fields);
    let matchParameter = {};
    // prepare speactra query
    prepareSpectraQuery(
      matchParameter,
      'data.spectrum.data.x',
      masses,
      precision,
    );
    // prepare molecular formula and/or exact mass query
    prepareMolecularInfoQuery(matchParameter, em, mf, precision);
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
      await debug.fatal(e.message, {
        collection: 'gnps',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    if (connection) await connection.close();
  }
}
