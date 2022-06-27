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
    let results = [];
    let dbRefs = [];
    let counter = 0;
    while (await cursor.hasNext()) {
      if (counter >= 999) break;
      const doc = await cursor.next();
      if (doc.data.meshHeadings) {
        let dbRef = { $ref: 'pubmeds', $id: doc._id };
        let meshTerms = [];
        for (let meshHeading of doc.data.meshHeadings) {
          meshTerms.push(meshHeading.descriptorName);
        }
        counter++;
        dbRefs.push(dbRef);
        if (meshTerms.length > 0) {
          results.push(meshTerms);
        }
      }
    }
    // get result array with uniques strings
    results = results.map((meshTerms) => {
      return meshTerms.filter((term, index) => {
        return meshTerms.indexOf(term) === index;
      });
    });

    return [results, dbRefs];
  } catch (error) {
    if (connection) {
      debug(error, { collection: collection.collectionName, connection });
    }
  }
}
