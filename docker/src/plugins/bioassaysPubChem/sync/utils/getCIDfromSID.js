/**
 * @description Get Compound IDs from Substance IDs
 * @param {Object} substanceCollection
 * @param {Array} substanceIDs
 * @returns {Object} - Array of objects containing Substance ID and Compound ID
 */
export function getCIDfromSID(substanceCollection, substanceIDs) {
  const sidToCid = {};
  substanceIDs.forEach((sid) => {
    const substanceEntry = substanceCollection.findOne({ _id: sid });
    if (substanceEntry) {
      sidToCid[sid] = substanceEntry.data.cids[0];
    }
  });
  return sidToCid;
}
