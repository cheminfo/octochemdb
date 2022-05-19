// query for molecules from monoisotopic mass
import { getFields, PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('entriesFromEM');

const entriesFromEM = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compounds from a monoisotopic mass',
    description:
      'Allows to search for pubchem compounds based on a monoisotopic mass, precision (accuracy) of the measurement.',
    querystring: {
      em: {
        type: 'number',
        description: 'Monoisotopic mass',
        example: 300.123,
        default: 0,
      },

      keywords: {
        type: 'string',
        description: 'Keyword',
        example: 'Podocarpus macrophyllus',
        default: '',
      },
      precision: {
        type: 'number',
        description: 'Precision (in ppm) of the monoisotopic mass',
        default: 100,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 1000,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default:
          'data.em,data.mf,data.charge,data.unsaturation,data.active,data.naturalProduct,data.ocls,data.names,data.keywords,data.activities,data.taxonomies',
      },
    },
  },
  handler: searchHandler,
};

export default entriesFromEM;

async function searchHandler(request) {
  let {
    em = 0,
    keywords = '',
    limit = 1e3,
    precision = 100,

    fields = 'data.em,data.mf,data.charge,data.unsaturation,data.active,data.naturalProduct,data.ocls,data.names,data.keywords,data.activities,data.taxonomies',
  } = request.query;

  let wordsToBeSearched = keywords.toLowerCase().trim().split(/\s+/);
  let wordsWithRegex = [];
  for (let word of wordsToBeSearched) {
    wordsWithRegex.push(new RegExp(word, 'i'));
  }

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;
  let error = (em / 1e6) * precision;
  let connection;

  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('bestOfCompounds');
    let formatedFields = getFields(fields);
    formatedFields._id = 0;

    let matchParameter;

    if (em !== 0 && keywords !== '') {
      matchParameter = {
        'data.em': { $lt: em + error, $gt: em - error },
        'data.keywords': { $in: wordsWithRegex },
      };
    }
    if (em === 0 && keywords !== '') {
      matchParameter = {
        'data.keywords': { $in: wordsWithRegex },
      };
    }
    if (em !== 0 && keywords === '') {
      matchParameter = {
        'data.em': { $lt: em + error, $gt: em - error },
      };
    }

    const results = await collection
      .aggregate([
        { $match: matchParameter },
        { $limit: limit },
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
