/**
 * @description Get the active against taxonomies keywords from the aggregated activities
 * @param {*} activities Array of activities
 * @returns {Array} Array of active against keywords
 */
export default function getActiveAgainstKeywords(activities) {
  const activeAgainstKw = new Set();
  for (let activity of activities) {
    if (activity.targetTaxonomies) {
      const keywords = [
        activity.targetTaxonomies.superkingdom,
        activity.targetTaxonomies.kingdom,
        activity.targetTaxonomies.phylum,
      ]
        .join(' ')
        .toLowerCase();
      for (let keyword of keywords) {
        if (keyword !== '') {
          activeAgainstKw.add(keyword);
        }
      }
    }
  }

  return [...activeAgainstKw];
}
