import Debug from '../../../utils/Debug.js';

/**
 * @description Get the mesh terms and dbRef for a given cid inside the pubmeds collection
 * @param {*} cid CID
 * @param {*} connection MongoDB connection
 * @returns {Promise} returns an object {meshTerms: array, dbRefs: array}
 */
export async function getMeshTerms(cid, collection, connection) {
  const debug = Debug('getMeshTerms');
  try {
    const cursor = await collection.find({
      'data.cids': { $in: [cid] },
    });
    let uniqueMeshTerms = {};
    let pmIds = [];
    let counter = 0;
    while (await cursor.hasNext()) {
      if (counter++ >= 999) break;
      const doc = await cursor.next();
      if (doc.data.meshHeadings) {
        for (let meshHeading of doc.data.meshHeadings) {
          uniqueMeshTerms[meshHeading.descriptorName] = true;
        }
        pmIds.push(doc._id);
      }
    }
    // get result array with uniques strings
    return { meshTermsForCid: Object.keys(uniqueMeshTerms), pmIds };
  } catch (error) {
    if (connection) {
      debug(error, { collection: collection.collectionName, connection });
    }
  }
}
