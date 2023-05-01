/**
 * @description Get the active against taxonomies keywords from the aggregated activities
 * @param {*} activities Array of activities
 * @returns {Array} Array of active against keywords
 */
export default function getActiveAgainstKeywords(activities) {
  const activeAgainstKw = new Set();
  for (let activity of activities) {
    if (activity?.targetTaxonomies?.length > 0) {
      let taxonomies = activity.targetTaxonomies;
      if (!Array.isArray(taxonomies)) {
        taxonomies = [taxonomies];
      }
      for (let taxonomy of taxonomies) {
        const keywordsSuperKingdom = [taxonomy?.superkingdom]
          .join(' ')
          .toLowerCase()
          .split(/\W+/);
        const keywordsKingdom = [taxonomy?.kingdom]
          .join(' ')
          .toLowerCase()
          .split(/\W+/);
        const keywordsPhylum = [taxonomy?.phylum]
          .join(' ')
          .toLowerCase()
          .split(/\W+/);
        const keywordClass = [taxonomy?.class]
          .join(' ')
          .toLowerCase()
          .split(/\W+/);
        const keywordOrder = [taxonomy?.order]
          .join(' ')
          .toLowerCase()
          .split(/\W+/);
        const keywordFamily = [taxonomy?.family]
          .join(' ')
          .toLowerCase()
          .split(/\W+/);
        const keywordGenus = [taxonomy?.genus]
          .join(' ')
          .toLowerCase()
          .split(/\W+/);
        const keywordSpecies = [taxonomy?.species]
          .join(' ')
          .toLowerCase()
          .split(/\W+/);
        const keywords = [
          ...keywordsSuperKingdom,
          ...keywordsKingdom,
          ...keywordsPhylum,
          ...keywordClass,
          ...keywordOrder,
          ...keywordFamily,
          ...keywordGenus,
          ...keywordSpecies,
        ];
        for (let keyword of keywords) {
          if (keyword !== '') {
            activeAgainstKw.add(keyword);
          }
        }
      }
    }
  }

  return [...activeAgainstKw];
}
