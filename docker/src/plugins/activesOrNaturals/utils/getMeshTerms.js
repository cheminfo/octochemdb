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
    const result = await collection
      .aggregate([
        {
          $project: {
            _id: 1,
            data: 1,
            compounds: {
              $map: {
                input: '$data.compounds',
                as: 'compound',
                in: '$$compound.$id',
              },
            },
          },
        },
        { $match: { compounds: { $in: compoundIds } } },
        { $limit: 2 },
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
