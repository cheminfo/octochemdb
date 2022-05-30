import { isIgnoreKeyword } from '../../../utils/isIgnoreKeyword.js';

export function getActivityKeywords(activities) {
  const activitesKW = new Set();
  for (let activity of activities) {
    const keywords = [
      activity.assay,
      activity.taxonomy.superkingdom,
      activity.taxonomy.kingdom,
      activity.taxonomy.phylum,
    ]
      .join(' ')
      .toLowerCase()
      .split(/\W+/)
      .filter((k) => k);
    for (let keyword of keywords) {
      if (!isIgnoreKeyword(keyword) && isNaN(Number(keyword))) {
        activitesKW.add(keyword);
      }
    }
  }

  return [...activitesKW];
}
