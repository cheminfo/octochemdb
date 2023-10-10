import escapeRegExp from 'lodash.escaperegexp';

import { getFields, OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../utils/getRequestQuery.js';

import { getMatchParameters } from './utils/getMatchParameters.js';

const debug = debugLibrary('entriesSearch');
// export the handler
const entriesSearch = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Retrieve compounds from a monoisotopic mass',
    description:
      'Allows to search for compounds based on a monoisotopic mass and precision (accuracy) of the measurement. \n Optional parameters can be used to filter the results based on their taxonomy, bioactivity and topic (MeSH terms) of PubMed publications related to the the molecules.',
    querystring: {
      em: {
        type: 'string',
        description: 'Monoisotopic mass (in Da)',
        example: '300.123, 259.0237',
        default: '',
      },
      precision: {
        type: 'number',
        description: 'Precision (in ppm) of the monoisotopic mass',
        default: 100,
      },
      mf: {
        type: 'string',
        description: 'MF of the compound',
        example: '',
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
      kwTitles: {
        type: 'string',
        description:
          'keywords compound titles (separate terms to search with ";" or "," ), please avoid using numbers (e.g:3,4-Methylenedioxymethamphetamine)',
        example: 'Cephalosporin',
        default: '',
      },
      kwMeshTerms: {
        type: 'string',
        description: 'keywords mesh terms (separate terms to search with ";" )',
        example: 'antibiotic',
        default: '',
      },
      isNaturalProduct: {
        type: 'boolean',
        description:
          'if true, only natural products are returned, if false, only not natural compounds are returned and if undefined, both are returned',
        default: undefined,
      },
      isBioactive: {
        type: 'boolean',
        description:
          'if true, only bioactive compounds are returned, if false, only not bioactive compounds are returned and if undefined, both are returned',
        default: undefined,
      },
      minNbMassSpectra: {
        type: 'number',
        description: 'minimum number of mass spectra',
        default: undefined,
      },
      maxNbMassSpectra: {
        type: 'number',
        description: 'Maximum number of mass spectra',
        default: undefined,
      },
      minNbActivities: {
        type: 'number',
        description: 'Minimum number of activities',
        default: undefined,
      },
      maxNbActivities: {
        type: 'number',
        description: 'Maximum number of activities',
        default: undefined,
      },
      minNbTaxonomies: {
        type: 'number',
        description: 'Minimum number of taxonomies',
        default: undefined,
      },
      maxNbTaxonomies: {
        type: 'number',
        description: 'Maximum number of taxonomies',
        default: undefined,
      },
      minNbPatents: {
        type: 'number',
        description: 'Minimum number of patents',
        default: undefined,
      },
      maxNbPatents: {
        type: 'number',
        description: 'Maximum number of patents',
        default: undefined,
      },
      minNbPubmeds: {
        type: 'number',
        description: 'Minimum of PubMed publications',
        default: undefined,
      },
      maxNbPubmeds: {
        type: 'number',
        description: 'Maximum of PubMed publications',
        default: undefined,
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
export default entriesSearch;

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
    kwTaxonomies = '',
    kwBioassays = '',
    kwTitles = '',
    kwActiveAgainst = '',
    kwMeshTerms = '',
    isNaturalProduct,
    isBioactive,
    minNbMassSpectra,
    maxNbMassSpectra,
    minNbActivities,
    maxNbActivities,
    minNbTaxonomies,
    maxNbTaxonomies,
    minNbPatents,
    maxNbPatents,
    minNbPubmeds,
    maxNbPubmeds,
    limit = 1e3,
    precision = 100,
    fields = 'data.em,data.mf',
  } = data;

  // This keywords use regular expressions to search even for incomplete terms
  let wordsWithRegexBioassays = [];
  let wordsWithRegexMeshTerms = [];
  let wordsWithRegexTitles = [];
  // convert to lower case and remove spaces and split by ";" or ","
  let wordsToBeSearchedTitles = prepareKeywords(kwTitles)
  let wordsToBeSearchedBioassays = kwBioassays
    .toLowerCase()
    .split(/ *[,;\t\n\r\s]+ */)
    .filter((entry) => entry);

  let wordsToBeSearchedActiveAgainst = kwActiveAgainst
    .toLowerCase()
    .split(/ *[,;\t\n\r\s]+ */)
    .filter((entry) => entry);

  let wordsToBeSearchedTaxonomies = kwTaxonomies
    .toLowerCase()
    .split(/ *[,;\t\n\r\s]+ */)
    .filter((entry) => entry);

  let wordsToBeSearchedMeshTerms = kwMeshTerms
    .toLowerCase()
    .split(/ *[,;\t\n\r\s]+ */)
    .filter((entry) => entry);
  // convert words to be searched in titles to regex
  wordsToBeSearchedTitles.forEach((word) => {
    wordsWithRegexTitles.push(new RegExp(escapeRegExp(word)));
  });
  // convert words to be searched in bioassays to regex
  wordsToBeSearchedBioassays.forEach((word) => {
    wordsWithRegexBioassays.push(new RegExp('^' + escapeRegExp(word)));
  });
  // convert phrases to regular expressions
  wordsToBeSearchedMeshTerms.forEach((word) => {
    wordsWithRegexMeshTerms.push(new RegExp('^' + escapeRegExp(word)));
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

    const molecularInfo = {
      em,
      mf,
      precision,
    };
    const keywords = {
      wordsWithRegexTitles,
      wordsWithRegexBioassays,
      wordsWithRegexMeshTerms,
      wordsToBeSearchedActiveAgainst,
      wordsToBeSearchedTaxonomies,
    };
    const flags = {
      isNaturalProduct,
      isBioactive,
    };
    const minMaxProperties = {
      minNbMassSpectra,
      maxNbMassSpectra,
      minNbActivities,
      maxNbActivities,
      minNbTaxonomies,
      maxNbTaxonomies,
      minNbPatents,
      maxNbPatents,
      minNbPubmeds,
      maxNbPubmeds,
    };
    const matchParameter = getMatchParameters(
      molecularInfo,
      keywords,
      flags,
      minMaxProperties,
    );
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
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug.trace('Closing connection');
    if (connection) await connection.close();
  }
}

function prepareKeywords(string) {
  return string.toLowerCase().split(/ *(?:, |[;\t\n\r\s]+) */).filter((entry) => entry);
}