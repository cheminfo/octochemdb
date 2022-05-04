import Debug from '../../../utils/Debug.js';
import { searchTaxonomies } from '../utils/utilsTaxonomies/searchTaxonomies.js';
async function getActivitiesInfo(data, connection, taxonomiesCollection) {
  const debug = Debug('getActivityInfo');

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
          activity.taxonomies = entry.data?.activeAgainstTaxonomy[0];
        }
        activityInfo.push(activity);
      }
      if (entry.collection === 'npasses') {
        if (entry.data?.activities) {
          for (const activity of entry.data.activities) {
            let assayString = [
              activity.activityType,
              ':',
              activity.activityValue,
              activity.activityUnit,
            ].join(' ');
            let activities = {
              assay: assayString,
              dbRef: { $ref: entry.collection, $id: entry._id },
            };
            if (activity.target_id) {
              let searchParameter = {
                _id: Number(activity.target_id),
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

    return activityInfo;
  } catch (e) {
    const optionsDebug = { collection: 'bestOfCompounds', connection };
    debug(e, optionsDebug);
  }
}

export default getActivitiesInfo;
