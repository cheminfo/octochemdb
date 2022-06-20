import Debug from '../../../utils/Debug.js';
/**
 * @description Get the mesh terms and dbRef for a given cid inside the pubmeds collection
 * @param {*} cid CID
 * @param {*} connection
 * @returns {Promise} returns an array of objects with mesh terms and dbRef
 */
export async function getMeshTerms(cid, connection) {
  const debug = Debug('getMeshTerms');
  try {
    const collection = connection.getCollection('pubmeds');
    const cursor = await collection.find({
      'data.cids': { $in: [cid] },
    });
    let results = [];
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc.data.meshHeadings) {
        let dbRef = { $ref: 'pubmeds', $id: doc._id };
        let result = { meshTerms: doc.data.meshHeadings, dbRef };
        results.push(result);
      }
    }
    return results;
  } catch (error) {
    debug(error);
  }
}
