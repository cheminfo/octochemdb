/**
 * @description Get the active against taxonomies keywords from the aggregated activities
 * @param {*} activities Array of activities
 * @returns {Array} Array of active against keywords
 */
export default function getActiveAgainstKeywords(activities) {
  const activeAgainstKw = new Set();
  for (let activity of activities) {
    if (activity.targetTaxonomies) {
      const keywordsSuperKingdom = [activity.targetTaxonomies.superkingdom]
        .join(' ')
        .toLowerCase()
        .split(/\W+/);
      const keywordsKingdom = [activity.targetTaxonomies.kingdom]
        .join(' ')
        .toLowerCase()
        .split(/\W+/);
      const keywordsPhylum = [activity.targetTaxonomies.phylum]
        .join(' ')
        .toLowerCase()
        .split(/\W+/);
      const keywords = [
        ...keywordsSuperKingdom,
        ...keywordsKingdom,
        ...keywordsPhylum,
      ];
      for (let keyword of keywords) {
        if (keyword !== '') {
          activeAgainstKw.add(keyword);
        }
      }
    }
  }

  return [...activeAgainstKw];
}
