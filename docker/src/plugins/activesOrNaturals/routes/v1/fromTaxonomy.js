import escapeRegExp from 'lodash.escaperegexp';

import { getFields, OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromTaxonomy');
// export the handler
const fromTaxonomy = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compounds from a monoisotopic mass',
    description:
      'Allows to search for compounds based on a taxonomy. \n Optional parameters allow to filter results by bioassays, mesh terms and active against',
    querystring: {
      kwTaxonomies: {
        type: 'string',
        description:
          'Taxonomies kingdom, phylum, class, order family, genus or species (separate terms to search with ";" or "," )',
        example: 'Podocarpus macrophyllus',
        default: '',
      },
      kwActiveAgainst: {
        type: 'string',
        description:
          'Taxonomies superkingdom, kingdom or phylum of target organism in bioassays(separate terms to search with ";" or "," )',
        example: 'Halobacterium salinarum',
        default: '',
      },
      kwBioassays: {
        type: 'string',
        description: 'keywords bioassays',
        example: 'MIC',
        default: '',
      },
      kwMeshTerms: {
        type: 'string',
        description: 'keywords mesh terms (separate terms to search with ";" )',
        example: 'antibiotic',
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
        default: 'data.em,data.mf',
      },
    },
  },
  handler: searchHandler,
};
export default fromTaxonomy;

/**
 * @description Search for compounds from a monoisotopic mass, target taxonomies, source taxonomies and bioassays
 * @param {object} request
 * @returns {Promise<object>} Entries who match the query parameters inside the activeOrNaturals collection
 */
async function searchHandler(request) {
  let {
    kwTaxonomies = '',
    kwBioassays = '',
    kwActiveAgainst = '',
    kwMeshTerms = '',
    limit = 1e3,
    fields = 'data.em,data.mf',
  } = request.query;
  // This keywords use regular expressions to search even for incomplete terms
  let wordsWithRegexBioassays = [];
  let wordsWithRegexMeshTerms = [];
  // convert to lower case and remove spaces and split by ";" or ","
  let wordsToBeSearchedBioassays = kwBioassays
    .toLowerCase()
    .split(/ *[,;\t\n\r]+ */)
    .filter((entry) => entry);

  let wordsToBeSearchedActiveAgainst = kwActiveAgainst
    .toLowerCase()
    .split(/ *[,;\t\n\r]+ */)
    .filter((entry) => entry);

  let wordsToBeSearchedTaxonomies = kwTaxonomies
    .toLowerCase()
    .split(/ *[,;\t\n\r]+ */)
    .filter((entry) => entry);

  let wordsToBeSearchedMeshTerms = kwMeshTerms
    .toUpperCase()
    .split(/ *[;\t\n\r]+ */)
    .filter((entry) => entry);
  // convert words to be searched in bioassays to regex
  wordsToBeSearchedBioassays.forEach((word) => {
    wordsWithRegexBioassays.push(new RegExp(escapeRegExp(word), 'i'));
  });
  // convert phrases to regular expressions

  wordsToBeSearchedMeshTerms.forEach((word) => {
    wordsWithRegexMeshTerms.push(new RegExp(escapeRegExp(word), 'i'));
  });

  // define lower and upper bounds of the returned results limit
  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;
  // define the error allowed for the search
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('activesOrNaturals');
    // get the fields to be retrieved
    let formattedFields = getFields(fields);
    formattedFields._id = 0;
    // define match parameters for the search, the $in operator is used to search for multiple words and is true if at least one of the words is found
    let matchParameter = {};

    if (!kwTaxonomies) {
      return { errors: [{ title: 'No taxonomies provided' }] };
    }
    matchParameter['data.targetTaxonomies'] = { $exists: true };

    if (kwTaxonomies) {
      matchParameter['data.kwTaxonomies'] = {
        $in: wordsToBeSearchedTaxonomies,
      };
    }
    if (kwBioassays) {
      matchParameter['data.kwBioassays'] = { $in: wordsWithRegexBioassays };
    }
    if (kwMeshTerms) {
      matchParameter['data.kwMeshTerms'] = { $in: wordsWithRegexMeshTerms };
    }
    if (kwActiveAgainst) {
      matchParameter['data.kwActiveAgainst'] = {
        $in: wordsToBeSearchedActiveAgainst,
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
    debug(e);
    if (connection) {
      debug(e.message, {
        collection: 'activesOrNaturals',
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
