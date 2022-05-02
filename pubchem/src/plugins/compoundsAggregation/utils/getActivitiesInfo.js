import Debug from '../../../utils/Debug.js';
//npass and bioassays
async function getActivitiesInfo(data, connection) {
  const debug = Debug('getActivityInfo');
  try {
    let activityInfo = [];
    for (const entry of data) {
      if (entry.collection === 'bioassays') {
        let activity = {};
      }
      if (entry.collection === 'npasses') {
        if (entry.data?.activities) {
          for (const activity of entry.data.activities) {
            activity.ref = entry._id;
            if (activity.target_id) {
              let searchParameter = {
                _id: Number(activity.target_id),
              };
            }
          }
          activityInfo.push(entry.data?.activities);
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
