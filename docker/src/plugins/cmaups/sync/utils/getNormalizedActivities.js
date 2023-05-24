import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';

/**
 * @description normalize the activities data and standardize the target taxonomies for cmaups
 * @param {*} entry the entry to be normalized
 * @param {*} taxonomiesCollection the taxonomies collection
 * @param {*} oldToNewTaxIDs the old to new taxonomies ids mapping
 * @param {*} collectionName the name of the collection
 * @returns {Promise<Array>} the normalized activities
 */
export async function getNormalizedActivities(
  entry,
  taxonomiesCollection,
  oldToNewTaxIDs,
) {
  let results = [];
  if (entry.data.activities) {
    let oldIDs = Object.keys(oldToNewTaxIDs);
    for (const activity of entry.data.activities) {
      let assayString = [
        activity.activityType,
        ':',
        activity.activityValue,
        activity.activityUnit,
      ].join(' ');
      let externalReference = [activity.refIdType, ':', activity.refId].join(
        ' ',
      );
      let activities = {
        assay: assayString,
        externalRef: externalReference,
      };
      // search for the taxonomies
      if (activity.targetId) {
        let idToUse = Number(activity.targetId);
        if (oldIDs.includes(activity.targetId)) {
          idToUse = Number(oldToNewTaxIDs[activity.targetId]);
        }
        let searchParameter = {
          _id: idToUse,
        };

        let result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          activities.targetTaxonomies = result[0].data;
        }
      }
      results.push(activities);
    }
  }
  return results;
}
