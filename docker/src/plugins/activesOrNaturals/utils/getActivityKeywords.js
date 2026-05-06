import { isIgnoreKeyword } from '../../../utils/isIgnoreKeyword.js';
/**
 * Extract lowercased keyword tokens from the assay names in the activities array,
 * filtering out ignored keywords and numeric tokens.
 * @param {ActivityInfo[]} activities
 * @returns {string[]} deduplicated array of activity keywords
 */
export default function getActivityKeywords(activities) {
  const activitiesKW = new Set();
  for (let activity of activities) {
    const keywords = [activity.assay]
      .join(' ')
      .toLowerCase()
      .split(/\W+/)
      .filter((k) => k);
    for (let keyword of keywords) {
      if (!isIgnoreKeyword(keyword) && isNaN(Number(keyword))) {
        activitiesKW.add(keyword);
      }
    }
  }

  return [...activitiesKW];
}
