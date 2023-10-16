import { prepareKeywords } from './prepareKeywords';

export function getKeywordsMatchParameter(matchParameter, keywords) {
  let regexKwTitles = prepareKeywords(keywords.kwTitles, {
    escapeRegExpression: true,
  });
  let regexKwBioassays = prepareKeywords(keywords.kwBioassays, {
    escapeRegExpression: true,
  });
  let regexKwActiveAgainst = prepareKeywords(keywords.kwActiveAgainst);
  let regexKwTaxonomies = prepareKeywords(keywords.kwTaxonomies);
  let regexKwMeshTerms = prepareKeywords(keywords.kwMeshTerms, {
    escapeRegExpression: true,
  });

  if (regexKwTaxonomies.length > 0) {
    matchParameter['data.kwTaxonomies'] = {
      $all: regexKwTaxonomies,
    };
  }
  if (regexKwTitles.length > 0) {
    matchParameter['data.kwTitles'] = { $in: regexKwTitles };
  }
  if (regexKwBioassays.length > 0) {
    matchParameter['data.kwBioassays'] = { $in: regexKwBioassays };
  }
  if (regexKwMeshTerms.length > 0) {
    matchParameter['data.kwMeshTerms'] = { $in: regexKwMeshTerms };
  }
  if (regexKwActiveAgainst.length > 0) {
    matchParameter['data.kwActiveAgainst'] = {
      $in: regexKwActiveAgainst,
    };
  }
}
