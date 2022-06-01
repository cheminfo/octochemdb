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
      'Allows to search for pubchem compounds based on a monoisotopic mass, precision (accuracy) of the measurement, taxonomy or bioassay.',
    querystring: {
      em: {
        type: 'number',
        description: 'Monoisotopic mass',
        example: 300.123,
        default: 0,
      },
      precision: {
        type: 'number',
        description: 'Precision (in ppm) of the monoisotopic mass',
        default: 100,
      },
      kwActiveAgainst: {
        type: 'string',
        description:
          'Taxonomies superkingdom, kingdom or phylum of target organism in bioassays(separate terms to search with ";" or "," )',
        example: 'Halobacterium salinarum',
        default: '',
      },
      kwTaxonomies: {
        type: 'string',
        description:
          'Taxonomies family, genus or species (separate terms to search with ";" or "," )',
        example: 'Podocarpus macrophyllus',
        default: '',
      },
      kwBioassays: {
        type: 'string',
        description: 'keywords bioassays',
        example: 'MIC',
        default: '',
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
    kwTaxonomies = '',
    kwBioassays = '',
    kwActiveAgainst = '',
    limit = 1e3,
    precision = 100,
    fields = 'data.em,data.mf,data.charge,data.unsaturation,data.active,data.naturalProduct,data.ocls,data.names,data.kwBioassays,data.kwTaxonomies,data.kwActiveAgainst,data.activities,data.taxonomies',
  } = request.query;

  let wordsWithRegexBioassays = [];
  let wordsToBeSearchedBioassays = kwBioassays
    .toLowerCase()
    .split(/ *[,;\t\n\r]+ */)
    .filter((entry) => entry);

  for (let word of wordsToBeSearchedBioassays) {
    wordsWithRegexBioassays.push(new RegExp(`^${escapeRegExp(word)}`, 'i'));
  }
  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;
  let error = (em / 1e6) * precision;
  let connection;
  // ^ force the first letter
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('activesOrNaturals');
    let formatedFields = getFields(fields);
    formatedFields._id = 0;

    let matchParameter = {};

    if (em) {
      matchParameter['data.em'] = { $lt: em + error, $gt: em - error };
    }
    if (kwTaxonomies) {
      matchParameter['data.kwTaxonomies'] = { $in: kwTaxonomies };
    }
    if (kwBioassays) {
      matchParameter['data.kwBioassays'] = { $in: wordsWithRegexBioassays };
    }
    if (kwActiveAgainst) {
      matchParameter['data.kwActiveAgainst'] = { $in: kwActiveAgainst };
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
    if (connection) {
      debug(e, { collection: 'activesOrNaturals', connection });
    }
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
