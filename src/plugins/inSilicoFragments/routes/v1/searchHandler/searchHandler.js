import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';
import { prepareMolecularInfoQuery } from '../../../../gnps/routes/v1/utils/prepareMolecularInfoQuery.js';
import { prepareSpectraQuery } from '../../../../gnps/routes/v1/utils/prepareSpectraQuery.js';
import { fragmentationOptions } from '../../../aggregates/fragmentationOptions.js';

const debug = debugLibrary('inSilicoFragments');

/**
 * Searches the inSilicoFragments collection for mass spectra matching a list of experimental masses, an exact mass and/or molecular formula, filtered by ionization source and mode.
 * @param request - Fastify request whose query provides em, mf, masses, precision, limit, fields, source and mode.
 * @returns Object with the matching entries and the fragmentation options used, or an errors array on failure.
 */
export async function searchHandler(request) {
  let data = getRequestQuery(request);
  let {
    em = '',
    mf = '',
    masses = '',
    precision = 10,
    limit = 10,
    fields = 'data',
    source = 'esi',
    mode = 'positive',
  } = data;

  // define the error allowed for the search
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('inSilicoFragments');
    // get the fields to be retrieved
    let formattedFields = getFields(fields);
    let matchParameter = {};
    // prepare speactra query
    matchParameter = prepareSpectraQuery(
      matchParameter,
      'data.spectrum.data.x',
      masses,
      precision,
    );
    // prepare molecular formula and/or exact mass query
    matchParameter = prepareMolecularInfoQuery(
      matchParameter,
      em,
      mf,
      precision,
    );

    // add ion source and mode to the query, both need to be true in order to match
    matchParameter['_id.ionization'] = source;
    matchParameter['_id.mode'] = mode;

    const results = await collection
      .aggregate([
        { $match: matchParameter },
        { $limit: limit },
        {
          $project: formattedFields,
        },
      ])
      .toArray();
    return { data: results, fragmentationOptions };
  } catch (error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'inSilicoFragments',
        connection,
        stack: error.stack,
      });
    }
    return { errors: [{ title: error.message, detail: error.stack }] };
  } finally {
    if (connection) await connection.close();
  }
}
