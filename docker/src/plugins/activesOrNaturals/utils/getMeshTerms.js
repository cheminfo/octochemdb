import debugLibrary from '../../../utils/Debug.js';

/**
 * @description Get the mesh terms and dbRef for a given cid inside the pubmeds collection
 * @param {Array} cids CIDs
 * @param {*} collection : PUBMEDS collection
 * @param {*} connection MongoDB connection
 * @returns {Promise} returns an object {meshTerms: array, dbRefs: array}
 */

export async function getMeshTerms(cids, collection, connection) {
  const debug = debugLibrary('getMeshTerms');
  // get id from dbRef
  let compoundIds = [];
  for (let cid of cids) {
    compoundIds.push(Number(cid.$id));
  }
  try {
    /*
    // find cid in data.compounds.$id
    let cursor = await collection
      .find({ 'data.compounds.$id': Number(cid.$id) })
      .limit(1000);
    let cursor = await collection
      .find({
        'data.cids': Number(cid.$id),
      })
      .limit(1000);
      */
    // get all the documents that have the compoundIds
    const result = await collection
      .aggregate([
        {
          $match: {
            'data.compounds.$id': { $in: compoundIds },
          },
        },
        {
          $project: {
            _id: 1,
            data: 1,
          },
        },
        { $limit: 1000 },
      ])
      .toArray();

    let uniqueMeshTerms = {};
    let pmids = [];
    for (let doc of result) {
      if (doc.data?.meshHeadings) {
        for (let meshHeading of doc.data.meshHeadings) {
          if (meshHeading.descriptorName) {
            const descriptorName = meshHeading.descriptorName.toLowerCase();
            uniqueMeshTerms[descriptorName] = true;
          }
        }
        pmids.push(doc._id);
      }
    }

    const counterPmids = pmids.length;
    return {
      meshTermsForCid: Object.keys(uniqueMeshTerms),
      pmIds: pmids,
      counterPmids,
    };
  } catch (error) {
    if (connection) {
      await debug.fatal(error, {
        collection: collection.collectionName,
        connection,
      });
    }
  }
}
