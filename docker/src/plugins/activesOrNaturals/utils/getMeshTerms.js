import debugLibrary from '../../../utils/Debug.js';

/**
 * @description Get the mesh terms and dbRef for a given cid inside the pubmeds collection
 * @param {Number} cid CID
 * @param {*} collection : PUBMEDS collection
 * @param {*} connection MongoDB connection
 * @returns {Promise} returns an object {meshTerms: array, dbRefs: array}
 */
export async function getMeshTerms(cid, collection, connection) {
  const debug = debugLibrary('getMeshTerms');
  try {
    const cursor = await collection
      .find({
        'data.cids': cid,
      })
      .limit(1000);
    let uniqueMeshTerms = {};
    let pmids = [];
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc.data.meshHeadings) {
        for (let meshHeading of doc.data.meshHeadings) {
          if (meshHeading.descriptorName) {
            const descriptorName = meshHeading.descriptorName.toLowerCase();
            uniqueMeshTerms[descriptorName] = true;
          }
        }
        pmids.push(doc._id);
      }
    }
    const counterPmids = await collection.countDocuments({
      'data.cids': cid,
    });
    return {
      meshTermsForCid: Object.keys(uniqueMeshTerms),
      pmIds: pmids,
      counterPmids,
    };
  } catch (error) {
    if (connection) {
      debug(error, { collection: collection.collectionName, connection });
    }
  }
}
