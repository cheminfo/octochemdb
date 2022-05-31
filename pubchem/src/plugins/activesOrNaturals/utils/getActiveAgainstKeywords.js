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
        activeAgainstKw.add(keyword);
      }
    }
  }

  return [...activeAgainstKw];
}
