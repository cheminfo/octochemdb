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
  const orConditionsTitles = [];
  const orConditionsBioassays = [];
  const orConditionsMeshTerms = [];
  const orConditionsActiveAgainst = [];

  if (regexKwTitles.length > 0) {
    for (let regexKwTitle of regexKwTitles) {
      orConditionsTitles.push({
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
      orConditionsBioassays.push({
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
      orConditionsMeshTerms.push({
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
      orConditionsActiveAgainst.push({
        'data.kwActiveAgainst': {
          $elemMatch: {
            $regex: regexKwActive,
            $options: 'i',
          },
        },
      });
    }
  }
  let orConditions = [];
  if (orConditionsTitles.length > 0) {
    orConditions.push({
      $or: orConditionsTitles,
    });
  }
  if (orConditionsBioassays.length > 0) {
    orConditions.push({
      $or: orConditionsBioassays,
    });
  }
  if (orConditionsMeshTerms.length > 0) {
    orConditions.push({
      $or: orConditionsMeshTerms,
    });
  }
  if (orConditionsActiveAgainst.length > 0) {
    orConditions.push({
      $or: orConditionsActiveAgainst,
    });
  }
  if (orConditions.length > 0) {
    matchParameter.$and = orConditions;
  }
}
