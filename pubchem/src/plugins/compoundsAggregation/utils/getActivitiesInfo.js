import Debug from '../../../utils/Debug.js';
import { searchTaxonomies } from '../utils/utilsTaxonomies/searchTaxonomies.js';
//npass and bioassays
async function getActivitiesInfo(data, connection, taxonomiesCollection) {
  const debug = Debug('getActivityInfo');

  try {
    let activeTaxonomies = [];
    let activityInfo = [];
    for (const entry of data) {
      if (entry.collection === 'bioassays') {
        let activity = {
          assay: entry.data.assay,

          ref: entry._id,
        };

        if (entry.data?.activeAgainstTaxonomy) {
          let finalTaxonomy = entry.data?.activeAgainstTaxonomy[0];
          finalTaxonomy.ref = entry._id;
          activeTaxonomies.push(finalTaxonomy);
        }
        activityInfo.push(activity);
      }
      if (entry.collection === 'npasses') {
        if (entry.data?.activities) {
          for (const activity of entry.data.activities) {
            let activities = {
              assay: activity.activityType.concat([
                ':',
                activity.activityValue,
                activity.activityUnit,
              ]),
              ref: entry._id,
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
                let finalTaxonomy = result[0].data;
                finalTaxonomy.ref = entry._id;
                activeTaxonomies.push(finalTaxonomy);
              }
            }
            activityInfo.push(activities);
          }
        }
      }
    }

    return [activityInfo, activeTaxonomies];
  } catch (e) {
    const optionsDebug = { collection: 'bestOfCompounds', connection };
    debug(e, optionsDebug);
  }
}

export default getActivitiesInfo;
