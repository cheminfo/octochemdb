import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';

/**
 * @description normalize the activities data and standardize the target taxonomies for cmaups
 * @param {*} entry the entry to be normalized
 * @param {*} taxonomiesCollection the taxonomies collection
 * @param {*} oldToNewTaxIDs the old to new taxonomies ids mapping
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
        activity.activityRelation,
        activity.activityValue,
        activity.activityUnit,
      ].join(' ');
      let externalReference = [activity.refIdType, ':', activity.refId].join(
        ' ',
      );
      let activities = {
        assay: assayString,
        externalRef: externalReference,
        assayOrganism: activity?.assayOrganism ? activity.assayOrganism : null,
        targetType: activity?.targetType ? activity.targetType : null,
        targetOrganism: activity?.targetOrganism
          ? activity.targetOrganism
          : null,
        targetName: activity?.targetName ? activity.targetName : null,
        geneSymbol: activity?.geneSymbol ? activity.geneSymbol : null,
        proteinName: activity?.proteinName ? activity.proteinName : null,
        uniprotId: activity?.uniprotId ? activity.uniprotId : null,
        chemblId: activity?.chemblId ? activity.chemblId : null,
        ttdId: activity?.ttdId ? activity.ttdId : null,
        targetClass1: activity?.targetClass1 ? activity.targetClass1 : null,
        targetClass2: activity?.targetClass2 ? activity.targetClass2 : null,
        targetClass3: activity?.targetClass3 ? activity.targetClass3 : null,
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
      // remove fields with null values
      for (let keys in activities) {
        if (activities[keys] === null) {
          delete activities[keys];
        }
      }
      results.push(activities);
    }
  }
  return results;
}
