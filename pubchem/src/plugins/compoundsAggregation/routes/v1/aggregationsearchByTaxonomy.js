// query for molecules from monoisotopic mass
import { getFields, PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('entries bestOfCompounds');

const entriesFromTaxonomies = {
  method: 'GET',
  schema: {
    querystring: {
      speciesName: {
        type: 'string',
        description: 'species',
        example: 'Podocarpus macrophyllus',
        default: null,
      },
      genusName: {
        type: 'string',
        description: 'genus',
        example: 'Podocarpus',
        default: null,
      },
      limit: {
        type: 'number',
        description: 'limit of records for ocls, activities and taxonomies',
        example: 10,
        default: 50,
      },
      limitResults: {
        type: 'number',
        description: 'limit of records output',
        example: 10,
        default: 50,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default:
          'data.em,data.charge,data.unsaturation,data.active,data.ocls,data.names,data.keywords,data.activities,data.taxonomies',
      },
    },
  },
  handler: searchHandler,
};

export default entriesFromTaxonomies;

async function searchHandler(request) {
  let {
    speciesName = '',
    genusName = '',
    limit = 0,
    limitResults = 0,
    fields = 'data.em,data.charge,data.unsaturation,data.active,data.ocls,data.names,data.keywords,data.activities,data.taxonomies',
  } = request.query;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('bestOfCompounds');
    debug(JSON.stringify({ speciesName }));
    debug(JSON.stringify({ genusName }));
    let formatedFields = getFields(fields);
    formatedFields._id = 0;
    formatedFields['data.activities'] = {
      $slice: ['$data.activities', Number(limit)],
    };
    formatedFields['data.ocls'] = { $slice: ['$data.ocls', Number(limit)] };
    formatedFields['data.taxonomies'] = {
      $slice: ['$data.taxonomies', Number(limit)],
    };
    let searchParameter;
    if (speciesName || genusName) {
      if (speciesName) {
        searchParameter = {
          'data.taxonomies.species': speciesName,
        };
      }
      if (genusName) {
        searchParameter = {
          'data.taxonomies.genus': genusName,
        };
      }
    }
    const results = await collection
      .aggregate([
        {
          $match: searchParameter,
        },
        {
          $limit: Number(limitResults),
        },
        {
          $project: formatedFields,
        },
      ])
      .toArray();

    return results;
  } catch (e) {
    debug(e.stack);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
