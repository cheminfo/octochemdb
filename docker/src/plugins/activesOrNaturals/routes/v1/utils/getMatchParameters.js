import { getKeywordsMatchParameter } from './getKeywordsMatchParameter.js';
import { getMolecularMatchParameter } from './getMolecularMatchParameter.js';
import { prepareMinMaxQuery } from './prepareMinMaxQuery.js';

export function getMatchParameters(data) {
  // define match parameters for the search, the $in operator is used to search for multiple words and is true if at least one of the words is found
  let matchParameter = {};

  // insert the molecular match parameters
  getMolecularMatchParameter(matchParameter, {
    em: data.em,
    mf: data.mf,
    precision: data.precision || 100,
  });

  // KEYWORDS
  getKeywordsMatchParameter(matchParameter, {
    kwTitles: data.kwTitles,
    kwBioassays: data.kwBioassays,
    kwActiveAgainst: data.kwActiveAgainst,
    kwTaxonomies: data.kwTaxonomies,
    kwMeshTerms: data.kwMeshTerms,
  });

  // FLAGS

  if (data.isNaturalProduct !== undefined) {
    matchParameter['data.naturalProduct'] = data.isNaturalProduct;
  }
  if (data.isBioactive !== undefined) {
    matchParameter['data.bioactive'] = data.isBioactive;
  }
  // MIN MAX PROPERTIES
  const minMaxQuery = [
    {
      'data.nbActivities': {
        min: data.minNbActivities,
        max: data.maxNbActivities,
      },
    },
    {
      'data.nbTaxonomies': {
        min: data.minNbTaxonomies,
        max: data.maxNbTaxonomies,
      },
    },
    {
      'data.nbPatents': {
        min: data.minNbPatents,
        max: data.maxNbPatents,
      },
    },
    {
      'data.nbPubmeds': {
        min: data.minNbPubmeds,
        max: data.maxNbPubmeds,
      },
    },
    {
      'data.nbMassSpectra': {
        min: data.minNbMassSpectra,
        max: data.maxNbMassSpectra,
      },
    },
  ];
  prepareMinMaxQuery(matchParameter, minMaxQuery);
  return matchParameter;
}
