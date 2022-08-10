import { isIgnoreKeyword } from '../../../utils/isIgnoreKeyword.js';
/**
 * @description Get the keywords from the assay name in the activities array
 * @param {*} activities Array of activities
 * @returns {Array} Array of keywords from the assay name
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
