import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';

/**
 * Normalizes the raw activity records on a CMAUP entry and enriches each one
 * with taxonomy data for its biological target.
 *
 * For each activity, the function concatenates the four activity measure fields
 * into a single `assay` string and the reference fields into `externalRef`. It
 * then resolves the numeric `targetId` against `oldToNewTaxIDs` (to handle
 * deprecated identifiers) and queries the taxonomies collection; when a match
 * is found the first result's `data` payload is attached as `targetTaxonomies`.
 * Null-valued fields are removed in-place before the record is pushed to the
 * output array.
 *
 * @param {CmaupsEntry} entry - The CMAUP entry whose `data.activities` array is
 *   normalized. Key field: `data.activities` — iterated to produce one output
 *   record per element; skipped entirely when the field is absent.
 * @param {TaxonomyCollection} taxonomiesCollection - Live MongoDB collection
 *   used by `searchTaxonomies()` to resolve `targetId` to taxonomy metadata.
 * @param {DeprecatedTaxIdMap} oldToNewTaxIDs - Map of deprecated taxonomy IDs
 *   (keys) to their replacements (values). When `targetId` appears as a key the
 *   replacement ID is used for the taxonomy lookup instead.
 * @returns {Promise<CmaupsNormalizedActivity[]>}
 */
export async function getNormalizedActivities(
  entry,
  taxonomiesCollection,
  oldToNewTaxIDs,
) {
  /** @type {CmaupsNormalizedActivity[]} */
  const results = [];
  if (entry.data.activities) {
    const oldIDs = Object.keys(oldToNewTaxIDs);
    /** @type {CmaupsRawActivity[]} */
    const activitiesList = entry.data.activities;
    for (const activity of activitiesList) {
      const assayString = [
        activity.activityType,
        activity.activityRelation,
        activity.activityValue,
        activity.activityUnit,
      ].join(' ');
      const externalReference = [activity.refIdType, ':', activity.refId].join(
        ' ',
      );
      /** @type {Record<string, unknown>} */
      const activities = {
        assay: assayString,
        externalRef: externalReference,
        assayOrganism: activity.assayOrganism || null,
        targetType: activity.targetType || null,
        targetOrganism: activity.targetOrganism || null,
        targetName: activity.targetName || null,
        geneSymbol: activity.geneSymbol || null,
        proteinName: activity.proteinName || null,
        uniprotId: activity.uniprotId || null,
        chemblId: activity.chemblId || null,
        ttdId: activity.ttdId || null,
        targetClass1: activity.targetClassLevel1 || null,
        targetClass2: activity.targetClassLevel2 || null,
        targetClass3: activity.targetClassLevel3 || null,
      };

      // search for the taxonomies
      if (activity.targetId) {
        let idToUse = Number(activity.targetId);
        if (oldIDs.includes(activity.targetId)) {
          idToUse = Number(oldToNewTaxIDs[activity.targetId]);
        }
        const searchParameter = {
          _id: idToUse,
        };

        const result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );

        if (result.length > 0) {
          activities.targetTaxonomies = result[0].data;
        }
      }
      // remove fields with null values
      for (const key in activities) {
        if (activities[key] === null) {
          delete activities[key];
        }
      }
      /** @type {any} */
      const cleaned = activities;
      /** @type {CmaupsNormalizedActivity} */
      const normalizedActivity = cleaned;
      results.push(normalizedActivity);
    }
  }
  return results;
}
