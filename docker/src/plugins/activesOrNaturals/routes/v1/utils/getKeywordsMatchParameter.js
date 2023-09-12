export function getKeywordsMatchParameter(matchParameter, keywords) {
  const {
    wordsToBeSearchedTaxonomies = '',
    wordsWithRegexBioassays = '',
    wordsWithRegexMeshTerms = '',
    wordsToBeSearchedActiveAgainst = '',
  } = keywords;
  if (wordsToBeSearchedTaxonomies.length > 0) {
    matchParameter['data.kwTaxonomies'] = {
      $all: wordsToBeSearchedTaxonomies,
    };
  }
  if (wordsWithRegexBioassays.length > 0) {
    matchParameter['data.kwBioassays'] = { $in: wordsWithRegexBioassays };
  }
  if (wordsWithRegexMeshTerms.length > 0) {
    matchParameter['data.kwMeshTerms'] = { $in: wordsWithRegexMeshTerms };
  }
  if (wordsToBeSearchedActiveAgainst.length > 0) {
    matchParameter['data.kwActiveAgainst'] = {
      $in: wordsToBeSearchedActiveAgainst,
    };
  }
}
