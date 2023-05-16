import escapeRegExp from 'lodash.escaperegexp';
import { MF } from 'mf-parser';

import { getFields, OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

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
  let data;
  if (request.method === 'GET') {
    data = request.query;
  } else {
    data = request.body;
  }
  let {
    em = '',
    mf = '',
    kwTaxonomies = '',
    kwBioassays = '',
    kwActiveAgainst = '',
    kwMeshTerms = '',
    isNaturalProduct = undefined,
    isBioactive = undefined,
    minNbMassSpectra = undefined,
    maxNbMassSpectra = undefined,
    minNbActivities = undefined,
    maxNbActivities = undefined,
    minNbTaxonomies = undefined,
    maxNbTaxonomies = undefined,
    minNbPatents = undefined,
    maxNbPatents = undefined,
    minNbPubmeds = undefined,
    maxNbPubmeds = undefined,
    limit = 1e3,
    precision = 100,
    fields = 'data.em,data.mf',
  } = data;
  // This keywords use regular expressions to search even for incomplete terms
  let wordsWithRegexBioassays = [];
  let wordsWithRegexMeshTerms = [];
  // convert to lower case and remove spaces and split by ";" or ","
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
    // define match parameters for the search, the $in operator is used to search for multiple words and is true if at least one of the words is found
    let matchParameter = {};

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
    if (isNaturalProduct !== undefined) {
      matchParameter['data.naturalProduct'] = isNaturalProduct;
    }
    if (isBioactive !== undefined) {
      matchParameter['data.bioactive'] = isBioactive;
    }
    if (minNbMassSpectra !== undefined && maxNbMassSpectra !== undefined) {
      matchParameter['data.nbMassSpectra'] = {
        $gte: minNbMassSpectra,
        $lte: maxNbMassSpectra,
      };
    } else if (
      minNbMassSpectra !== undefined &&
      maxNbMassSpectra === undefined
    ) {
      matchParameter['data.nbMassSpectra'] = { $gte: minNbMassSpectra };
    } else if (
      maxNbMassSpectra !== undefined &&
      minNbMassSpectra === undefined
    ) {
      matchParameter['data.nbMassSpectra'] = { $lte: maxNbMassSpectra };
    }
    if (minNbActivities !== undefined && maxNbActivities !== undefined) {
      matchParameter['data.nbActivities'] = {
        $gte: minNbActivities,
        $lte: maxNbActivities,
      };
    } else if (minNbActivities !== undefined && maxNbActivities === undefined) {
      matchParameter['data.nbActivities'] = { $gte: minNbActivities };
    } else if (maxNbActivities !== undefined && minNbActivities === undefined) {
      matchParameter['data.nbActivities'] = { $lte: maxNbActivities };
    }
    if (minNbTaxonomies !== undefined && maxNbTaxonomies !== undefined) {
      matchParameter['data.nbTaxonomies'] = {
        $gte: minNbTaxonomies,
        $lte: maxNbTaxonomies,
      };
    } else if (minNbTaxonomies !== undefined && maxNbTaxonomies === undefined) {
      matchParameter['data.nbTaxonomies'] = { $gte: minNbTaxonomies };
    } else if (maxNbTaxonomies !== undefined && minNbTaxonomies === undefined) {
      matchParameter['data.nbTaxonomies'] = { $lte: maxNbTaxonomies };
    }
    if (minNbPatents !== undefined && maxNbPatents !== undefined) {
      matchParameter['data.nbPatents'] = {
        $gte: minNbPatents,
        $lte: maxNbPatents,
      };
    } else if (minNbPatents !== undefined && maxNbPatents === undefined) {
      matchParameter['data.nbPatents'] = { $gte: minNbPatents };
    } else if (maxNbPatents !== undefined && minNbPatents === undefined) {
      matchParameter['data.nbPatents'] = { $lte: maxNbPatents };
    }
    if (minNbPubmeds !== undefined && maxNbPubmeds !== undefined) {
      matchParameter['data.nbPubmeds'] = {
        $gte: minNbPubmeds,
        $lte: maxNbPubmeds,
      };
    } else if (minNbPubmeds !== undefined && maxNbPubmeds === undefined) {
      matchParameter['data.nbPubmeds'] = { $gte: minNbPubmeds };
    } else if (maxNbPubmeds !== undefined && minNbPubmeds === undefined) {
      matchParameter['data.nbPubmeds'] = { $lte: maxNbPubmeds };
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
