import Debug from '../../../utils/Debug.js';

async function getActivityInfo(data) {
  const debug = Debug('getActivityInfo');
  let activityInfo = [];
  for (const info of data) {
    if (info.data?.activities) {
      for (const activity of info.data.activities) {
        activity.ref = info._id;
      }
      activityInfo.push(info.data?.activities);
    }
  }
  if (activityInfo.length > 0) {
    activityInfo = activityInfo[0];
    try {
      activityInfo = activityInfo.filter(
        (elem, index, self) =>
          self.findIndex((activity) => {
            return (
              activity.refId === elem.refId &&
              activity.refIdType === elem.refIdType &&
              activity.activityType === elem.activityType &&
              activity.activityValue === elem.activityValue
            );
          }) === index,
      );
    } catch (e) {
      debug(e.stack);
    }
  }
  return activityInfo;
}

export default getActivityInfo;