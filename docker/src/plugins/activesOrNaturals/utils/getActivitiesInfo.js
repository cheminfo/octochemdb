import debugLibrary from '../../../utils/Debug.js';

const debug = debugLibrary('getActivityInfo');
/**
 * @description Get unique activities from bioassays, npasses and cmaups collections
 * @param {*} data Array of data from aggregation process
 * @param {*} connection OctoChem connection
 * @returns {Promise} Returns the array of activities
 */
export default async function getActivitiesInfo(data, connection) {
  try {
    let activityInfo = [];

    for (const entry of data) {
      if (activityInfo.length > 999) {
        break;
      }
      if (entry.collection === 'bioassays') {
        let activity = {
          assay: entry.data.assay,
          dbRef: { $ref: entry.collection, $id: entry._id },
        };
        if (entry.data.targetTaxonomies) {
          activity.targetTaxonomies = entry.data.targetTaxonomies;
        }
        activityInfo.push(activity);
      }
      if (entry.collection === 'npasses' || entry.collection === 'cmaups') {
        if (entry.data.activities) {
          for (let activity of entry.data.activities) {
            activityInfo.push(activity);
          }
        }
      }
    }
    let activityInfos = [...new Set(activityInfo)];

    return activityInfos;
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
}
