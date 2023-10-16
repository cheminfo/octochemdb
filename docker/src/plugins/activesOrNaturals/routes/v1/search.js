import { searchHandler } from './searchHandlers/searchHandler.js';

const entriesSearch = {
  method: ['GET', 'POST'],
  handler: searchHandler,
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
};
export default entriesSearch;
