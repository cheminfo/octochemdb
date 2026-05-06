import debugLibrary from '../../../utils/Debug.js';

import { sortTaxonomies } from './utilsTaxonomies/sortTaxonomies.js';

const debug = debugLibrary('getActivityInfo');

/**
 * Collect activity information from bioassays, npasses and cmaups entries.
 * @param {Array<Record<string, any>>} data - documents from the aggregation pipeline
 * @param {OctoChemConnection} connection
 * @returns {Promise<ActivitiesInfoResult | undefined>}
 */
export default async function getActivitiesInfo(data, connection) {
  try {
    let activityInfo = [];
    let activityDBRefs = [];
    for (const entry of data) {
      if (activityInfo.length > 999) {
        break;
      }
      if (entry.collection === 'bioassays') {
        let activity = {
          assay: entry.data.assay,
        };
        if (entry.data?.targetTaxonomies !== undefined) {
          let sortedTaxonomies;
          if (entry.data.targetTaxonomies?.length > 1) {
            sortedTaxonomies = sortTaxonomies(entry.data.targetTaxonomies);
          } else {
            sortedTaxonomies = entry.data.targetTaxonomies;
          }
          activity.targetTaxonomies = sortedTaxonomies;
        }
        activityInfo.push(activity);
        activityDBRefs.push({
          $ref: entry.collection,
          $id: entry._id,
        });
      }

      if (entry.collection === 'npasses' || entry.collection === 'cmaups') {
        if (entry.data.activities) {
          for (let activity of entry.data.activities) {
            if (activity?.targetTaxonomies !== undefined) {
              activity.targetTaxonomies = [activity.targetTaxonomies];
            }
            activityInfo.push(activity);
          }
          activityDBRefs.push({ $ref: entry.collection, $id: entry._id });
        }
      }
    }
    let activityInfos = [...new Set(activityInfo)];
    let activityDBRef = [...new Set(activityDBRefs)];

    return { activityInfos, activityDBRef };
  } catch (/** @type {any} */ e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
}
