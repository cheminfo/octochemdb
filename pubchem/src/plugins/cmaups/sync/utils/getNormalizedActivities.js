import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';

export async function getNormalizedActivities(
  entry,
  taxonomiesCollection,
  synonyms,
  collectionName,
) {
  let results = [];
  if (entry.data.activities) {
    let oldIDs = Object.keys(synonyms);
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
        dbRef: { $ref: collectionName, $id: entry._id },
        externalRef: externalReference,
      };
      if (activity.targetId) {
        let idToUse = Number(activity.targetId);
        if (oldIDs.includes(activity.targetId)) {
          idToUse = Number(synonyms[activity.targetId]);
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
