import { prepareKeywords } from './prepareKeywords.js';

export function getKeywordsMatchParameter(matchParameter, keywords) {
  let regexKwTitles = prepareKeywords(keywords.kwTitles);
  let regexKwBioassays = prepareKeywords(keywords.kwBioassays);
  let regexKwActiveAgainst = prepareKeywords(keywords.kwActiveAgainst);
  let regexKwTaxonomies = prepareKeywords(keywords.kwTaxonomies);
  let regexKwMeshTerms = prepareKeywords(keywords.kwMeshTerms);

  if (regexKwTaxonomies.length > 0) {
    matchParameter['data.kwTaxonomies'] = {
      $all: regexKwTaxonomies,
    };
  }
  const orConditions = [];
  if (regexKwTitles.length > 0) {
    for (let regexKwTitle of regexKwTitles) {
      orConditions.push({
        'data.kwTitles': {
          $elemMatch: {
            $regex: regexKwTitle,
            $options: 'i',
          },
        },
      });
    }
  }
  if (regexKwBioassays.length > 0) {
    for (let regexKwBioassay of regexKwBioassays) {
      orConditions.push({
        'data.kwBioassays': {
          $elemMatch: {
            $regex: regexKwBioassay,
            $options: 'i',
          },
        },
      });
    }
  }
  if (regexKwMeshTerms.length > 0) {
    for (let regexKwMeshTerm of regexKwMeshTerms) {
      orConditions.push({
        'data.kwMeshTerms': {
          $elemMatch: {
            $regex: regexKwMeshTerm,
            $options: 'i',
          },
        },
      });
    }
  }
  if (regexKwActiveAgainst.length > 0) {
    for (let regexKwActive of regexKwActiveAgainst) {
      orConditions.push({
        'data.kwActiveAgainst': {
          $elemMatch: {
            $regex: regexKwActive,
            $options: 'i',
          },
        },
      });
    }
  }
  if (orConditions.length > 0) {
    matchParameter.$or = orConditions;
  }
}
