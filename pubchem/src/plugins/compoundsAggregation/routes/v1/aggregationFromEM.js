// query for molecules from monoisotopic mass
import escapeRegExp from 'lodash.escaperegexp';
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

      taxonomies: {
        type: 'string',
        description:
          'Taxonomies family, genus or species (can handle multiple spaces, case insensitive, separate terms to search with ";" or "," )',
        example: 'Podocarpus macrophyllus',
        default: '',
      },
      bioassays: {
        type: 'string',
        description: 'keywords bioassays',
        example: 'MIC',
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
          'data.em,data.mf,data.charge,data.unsaturation,data.active,data.naturalProduct,data.ocls,data.names,data.kwBioassays,data.kwTaxonomies,data.activities,data.taxonomies',
      },
    },
  },
  handler: searchHandler,
};

export default entriesFromEM;

async function searchHandler(request) {
  let {
    em = 0,
    taxonomies = '',
    bioassays = '',
    limit = 1e3,
    precision = 100,

    fields = 'data.em,data.mf,data.charge,data.unsaturation,data.active,data.naturalProduct,data.ocls,data.names,data.kwBioassays,data.kwTaxonomies,data.activities,data.taxonomies',
  } = request.query;
  let wordsToBeSearchedTaxonomies = taxonomies
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/;+\s+/g, ';')
    .replace(/,+\s+/g, ',')
    .split(/[,;]+/)
    .filter((entry) => entry);
  let wordsWithRegexTaxonomies = [];
  let wordsWithRegexBioassays = [];
  let wordsToBeSearchedBioassays = bioassays
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/;+\s+/g, ';')
    .replace(/,+\s+/g, ',')
    .split(/[,;]+/)
    .filter((entry) => entry);

  for (let word of wordsToBeSearchedTaxonomies) {
    wordsWithRegexTaxonomies.push(new RegExp('^' + escapeRegExp(word), 'i'));
  }
  for (let word of wordsToBeSearchedBioassays) {
    wordsWithRegexBioassays.push(new RegExp('^' + escapeRegExp(word), 'i'));
  }
  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;
  let error = (em / 1e6) * precision;
  let connection;
  // ^ force the first letter
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('bestOfCompounds');
    let formatedFields = getFields(fields);
    formatedFields._id = 0;

    let matchParameter;

    if (em !== 0 && taxonomies !== '' && bioassays !== '') {
      matchParameter = {
        'data.em': { $lt: em + error, $gt: em - error },
        'data.kwTaxonomies': { $all: wordsWithRegexTaxonomies },
        'data.kwBioassays': { $all: wordsWithRegexBioassays },
      };
    }
    if (em !== 0 && taxonomies !== '' && bioassays === '') {
      matchParameter = {
        'data.em': { $lt: em + error, $gt: em - error },
        'data.kwTaxonomies': { $all: wordsWithRegexTaxonomies },
      };
    }
    if (em !== 0 && taxonomies === '' && bioassays !== '') {
      matchParameter = {
        'data.em': { $lt: em + error, $gt: em - error },
        'data.kwBioassays': { $all: wordsWithRegexBioassays },
      };
    }
    if (em !== 0 && taxonomies === '' && bioassays === '') {
      matchParameter = {
        'data.em': { $lt: em + error, $gt: em - error },
      };
    }
    if (em === 0 && taxonomies !== '' && bioassays !== '') {
      matchParameter = {
        'data.kwTaxonomies': { $all: wordsWithRegexTaxonomies },
        'data.kwBioassays': { $all: wordsWithRegexBioassays },
      };
    }
    if (em === 0 && taxonomies !== '' && bioassays === '') {
      matchParameter = {
        'data.kwTaxonomies': { $all: wordsWithRegexTaxonomies },
      };
    }
    if (em === 0 && taxonomies === '' && bioassays !== '') {
      matchParameter = {
        'data.kwBioassays': { $all: wordsWithRegexBioassays },
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
    const optionsDebug = { collection: 'bestOfCompounds', connection };
    debug(e, optionsDebug);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
