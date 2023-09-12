import { getKeywordsMatchParameter } from './getKeywordsMatchParameter.js';
import { getMolecularMatchParameter } from './getMolecularMatchParameter.js';

export function getMatchParameters(
  molecularInfo,
  keywords,
  flags,
  minMaxProperties,
) {
  // define match parameters for the search, the $in operator is used to search for multiple words and is true if at least one of the words is found
  let matchParameter = {};

  // insert the molecular match parameters
  getMolecularMatchParameter(matchParameter, molecularInfo);

  // KEYWORDS
  getKeywordsMatchParameter(matchParameter, keywords);

  // FLAGS
  const { isNaturalProduct, isBioactive } = flags;

  if (isNaturalProduct !== undefined) {
    matchParameter['data.naturalProduct'] = isNaturalProduct;
  }
  if (isBioactive !== undefined) {
    matchParameter['data.bioactive'] = isBioactive;
  }
  // MIN MAX PROPERTIES
  const {
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
  } = minMaxProperties;
  if (minNbMassSpectra !== undefined && maxNbMassSpectra !== undefined) {
    matchParameter['data.nbMassSpectra'] = {
      $gte: minNbMassSpectra,
      $lte: maxNbMassSpectra,
    };
  } else if (minNbMassSpectra !== undefined && maxNbMassSpectra === undefined) {
    matchParameter['data.nbMassSpectra'] = { $gte: minNbMassSpectra };
  } else if (maxNbMassSpectra !== undefined && minNbMassSpectra === undefined) {
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
  return matchParameter;
}
