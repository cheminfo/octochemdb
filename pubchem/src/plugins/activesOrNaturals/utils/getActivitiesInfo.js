import Debug from '../../../utils/Debug.js';
const debug = Debug('getActivityInfo');

import { searchTaxonomies } from './utilsTaxonomies/searchTaxonomies.js';

export default async function getActivitiesInfo(
  data,
  connection,
  taxonomiesCollection,
) {
  try {
    let activityInfo = [];

    for (const entry of data) {
      if (activityInfo.length > 999) {
        continue;
      }
      if (entry.collection === 'bioassays') {
        let activity = {
          assay: entry.data.assay,

          dbRef: { $ref: entry.collection, $id: entry._id },
        };

        if (entry.data?.activeAgainstTaxonomy) {
          activity.taxonomies = entry.data?.activeAgainstTaxonomy;
        }
        activityInfo.push(activity);
      }
      if (entry.collection === 'npasses' || entry.collection === 'cmaups') {
        if (entry.data?.activities) {
          for (const activity of entry.data.activities) {
            if ([activity.refIdType].includes('PubChem')) {
              continue;
            }
            let assayString = [
              activity.activityType,
              ':',
              activity.activityValue,
              activity.activityUnit,
            ].join(' ');
            let externalReference = [
              activity.refIdType,
              ':',
              activity.refId,
            ].join(' ');
            let activities = {
              assay: assayString,
              dbRef: { $ref: entry.collection, $id: entry._id },
              externalRef: externalReference,
            };
            if (activity.targetId) {
              let searchParameter = {
                _id: Number(activity.targetId),
              };

              let result = await searchTaxonomies(
                taxonomiesCollection,
                searchParameter,
              );
              if (result.length > 0) {
                activities.taxonomy = result[0].data;
              }
            }
            activityInfo.push(activities);
          }
        }
      }
    }
    let activityInfos = [...new Set(activityInfo)];

    return activityInfos;
  } catch (e) {
    const optionsDebug = { collection: 'activesOrNaturals', connection };
    debug(e, optionsDebug);
  }
}
